import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const OrderDetails = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('');
  const [description, setDescription] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const token = sessionStorage.getItem('authToken');
        const response = await axios.get(`http://localhost:8000/api/orders/${orderId}/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setOrder(response.data);
        console.log('Fetched order:', response.data);
        setStatus(response.data.status);
        setLoading(false);
      } catch (err) {
        setError('Błąd podczas ładowania szczegółów zamówienia');
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  const handleStatusChange = async () => {
    try {
      const token = sessionStorage.getItem('authToken');
      await axios.patch(`http://localhost:8000/api/orders/${orderId}/`, {
        status,
        description,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      alert('Status zamówienia został zaktualizowany');
      navigate('/restaurant/user');
    } catch (err) {
      setError('Błąd podczas aktualizacji statusu zamówienia');
    }
  };

  if (loading) {
    return <p>Ładowanie szczegółów zamówienia...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  return (
    <div>
      <h2>Szczegóły zamówienia nr.{order.order_id}</h2>
      <p>Status: {order.status}</p>
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
      <div>
        <label>
          Status:
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
      </div>
      <div>
        <label>
          Opis:
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
      </div>
      <button onClick={handleStatusChange}>Zaktualizuj status</button>
    </div>
  );
};

export default OrderDetails;