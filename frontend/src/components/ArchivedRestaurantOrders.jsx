import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ArchivedRestaurantOrders = ({ restaurantId }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = sessionStorage.getItem('authToken');
        const response = await axios.get(`http://localhost:8000/api/restaurant/${restaurantId}/archived-orders/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setOrders(response.data);
        setLoading(false);
      } catch (err) {
        setError('Błąd podczas ładowania zamówień');
        setLoading(false);
      }
    };

    fetchOrders();
  }, [restaurantId]);

  if (loading) {
    return <p>Ładowanie zamówień...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  return (
    <div>
      <h2>Zarchiwizowane zamówienia dla restauracji</h2>
      {orders.length === 0 ? (
        <p>Brak zarchiwizowanych zamówień.</p>
      ) : (
        <ul>
          {orders.map((order) => (
            <li key={order.order_id}>
              <h3>Zamówienie nr.{order.order_id}</h3>
              <p>Status: {order.status}</p>
              <p>Data: {new Date(order.created_at).toLocaleString()}</p>
              <button onClick={() => navigate(`/order/${order.order_id}`)}>Szczegóły</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ArchivedRestaurantOrders;