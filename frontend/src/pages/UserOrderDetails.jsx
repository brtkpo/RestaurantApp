import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import CheckoutButton from '../components/CheckoutButton';
import Chat from '../components/Chat';

const UserOrderDetails = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
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
    const fetchOrderDetails = async () => {
      try {
        const token = sessionStorage.getItem('authToken');
        const response = await axios.get(`http://localhost:8000/api/user/orders/${orderId}/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setOrder(response.data);
        setLoading(false);
        console.log(response.data);
        console.log(response.data.archived);
      } catch (error) {
        setError('Błąd podczas ładowania szczegółów zamówienia');
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  if (loading) {
    return <p>Ładowanie szczegółów zamówienia...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  return (
    <div>
      <h2>Szczegóły zamówienia nr {order.order_id}</h2>
      {order && (
        <div>
          <p>Data: {new Date(order.created_at).toLocaleString()}</p>
          <p>Typ płatności: {order.payment_type}</p>
          <p>Typ dostawy: {order.delivery_type}</p>
          <p>Notatki: {order.order_notes}</p>
          <p>Adres: {order.address.first_name} {order.address.last_name}, {order.address.street} {order.address.building_number} {order.address.apartment_number}, {order.address.postal_code} {order.address.city}</p>
          <p>Restauracja: {order.restaurant.name}</p>
          <p>Produkty:</p>
          <ul>
            {order.items.map((item) => (
              <li key={item.id}>
                {item.product.name} - {item.quantity} szt. x {item.product.price} PLN
              </li>
            ))}
          </ul>
          <p>Suma: {order.total_price} PLN</p>
          {order.payment_type === "online" && !order.is_paid && !order.archived &&(
            <CheckoutButton
              email={order.address.email}
              orderId={order.order_id}
              restaurant={order.restaurant.name}
              totalAmount={order.total_price}
            />
          )}
          {order.payment_type === "online" && order.is_paid && (
            <p>Zapłacono online</p>
          )}
        </div>
      )}
      <button onClick={() => navigate('/user')}>Powrót</button>
      <Chat roomName={order.order_id} archived={order.archived} />
      <h3>Historia zamówienia</h3>
      <ul>
        {order.history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map((entry) => (
          <li key={entry.id}>
            <p>Status: {statusLabels[entry.status]}</p>
            <p>Data: {new Date(entry.timestamp).toLocaleString()}</p>
            {entry.description && <p>Opis: {entry.description}</p>}
          </li>
        ))}
      </ul>
      <button onClick={() => navigate('/user')}>Powrót</button>
    </div>
  );
};

export default UserOrderDetails;