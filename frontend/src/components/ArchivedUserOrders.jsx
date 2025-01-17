import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { Link } from 'react-router-dom';

const ArchivedUserOrders = () => {
  const token = useSelector((state) => state.token);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/user/archived-orders/', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setOrders(response.data);
      } catch (error) {
        console.error('Error fetching orders:', error);
      }
    };

    fetchOrders();
  }, [token]);

  return (
    <div>
      <h2>Zarchiwizowane zamówienia</h2>
      {orders.length === 0 ? (
        <p>Brak zarchiwizowanych zamówień.</p>
      ) : (
        <ul>
          {orders.map((order) => (
            <li key={order.order_id}>
              <h3>Zamówienie nr.{order.order_id}</h3>
              <p>Status: {order.status}</p>
              <p>Data: {new Date(order.created_at).toLocaleString()}</p>
              <Link to={`/user/orders/${order.order_id}`}>Szczegóły zamówienia</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ArchivedUserOrders;