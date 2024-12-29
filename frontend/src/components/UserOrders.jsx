import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { Link } from 'react-router-dom';
import CheckoutButton from './CheckoutButton';

const UserOrders = () => {
  const token = useSelector((state) => state.token); // Pobieramy token z Redux
  const [orders, setOrders] = useState([]);

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
        const response = await axios.get('http://localhost:8000/api/user/orders/', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setOrders(response.data);
        console.log('Fetched orders:', response.data);
      } catch (error) {
        console.error('Error fetching orders:', error);
      }
    };

    fetchOrders();
  }, [token]);

  return (
    <div>
      <h2>Moje zamówienia</h2>
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
              <Link to={`/user/orders/${order.order_id}`}>Szczegóły zamówienia</Link>
              {order.payment_type === "online" && !order.is_paid && (
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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default UserOrders;