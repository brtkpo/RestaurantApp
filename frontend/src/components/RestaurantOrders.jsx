import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const RestaurantOrders = ({ restaurantId }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const statusLabels = {
    pending: 'Złożone',
    confirmed: 'Potwierdzone',
    shipped: 'Wydane do dostarczenia',
    delivered: 'Dostarczone',
    cancelled: 'Anulowane',
    ready_for_pickup: 'Gotowe do odbioru',
    picked_up: 'Odebrane',
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = sessionStorage.getItem('authToken');
        const response = await axios.get(`http://localhost:8000/api/restaurant/${restaurantId}/orders/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setOrders(response.data);
        console.log("orders: ", orders);
        setLoading(false);
      } catch (err) {
        setError('Błąd podczas ładowania zamówień');
        setLoading(false);
      }
    };

    fetchOrders();
  }, [restaurantId]);

  if (loading) {
    //return <p>Ładowanie zamówień...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  return (
    <div>
      <h2>Zamówienia dla restauracji</h2>
      {orders.length === 0 ? (
        <p>Brak zamówień.</p>
      ) : (
        <ul>
          {orders.map((order) => (
            <li key={order.order_id}>
              <h3>Zamówienie nr.{order.order_id}</h3>
              <p>Status: {statusLabels[order.status]}</p>
              <p>Data: {new Date(order.created_at).toLocaleString()}</p>
              <p>Typ płatności: {order.payment_type}</p>
              <p>Typ dostawy: {order.delivery_type}</p>
              <p>Notatki: {order.order_notes}</p>
              <p>Adres: {order.address.first_name} {order.address.last_name}, {order.address.street} {order.address.building_number} {order.address.apartment_number}, {order.address.postal_code} {order.address.city}</p>
              <p>Produkty:</p>
              <ul>
                {order.items.map((item) => (
                  <li key={item.id}>
                    {item.product.name} - {item.quantity} szt.
                  </li>
                ))}
              </ul>
              <p>Suma: {order.total_price} PLN</p>
              <button onClick={() => navigate(`/order/${order.order_id}`)}>Szczegóły</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default RestaurantOrders;