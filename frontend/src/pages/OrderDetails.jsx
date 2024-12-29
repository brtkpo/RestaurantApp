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
        const response = await axios.get(`http://localhost:8000/api/orders/${orderId}/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setOrder(response.data);
        setStatus(response.data.status);
        setLoading(false);
        console.log(response.data);
      } catch (err) {
        setError('Błąd podczas ładowania szczegółów zamówienia');
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  const handleStatusChange = async () => {
    if (status === 'cancelled' && !description.trim()) {
        alert('Podaj w opisie powód anulowania zamówienia.');
        //setError('Opis jest wymagany przy anulowaniu zamówienia.');
        return;
    }

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
      //navigate('/restaurant/user');
    } catch (err) {
      setError('Błąd podczas aktualizacji statusu zamówienia');
    }
  };

  const getStatusOptions = () => {
    if (order.delivery_type === 'delivery') {
      return [
        { value: 'pending', label: 'Złożone' },
        { value: 'confirmed', label: 'Potwierdzone' },
        { value: 'shipped', label: 'Wydane do dostarczenia' },
        { value: 'delivered', label: 'Dostarczone' },
        { value: 'cancelled', label: 'Anulowane' },
      ];
    } else if (order.delivery_type === 'pickup') {
      return [
        { value: 'pending', label: 'Złożone' },
        { value: 'confirmed', label: 'Potwierdzone' },
        { value: 'ready_for_pickup', label: 'Gotowe do odbioru' },
        { value: 'picked_up', label: 'Odebrane' },
        { value: 'cancelled', label: 'Anulowane' },
      ];
    }
    return [];
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
      <button onClick={() => navigate('/restaurant/user')}>Powrót</button>
      <div>
        <h2>Aktualizuj status:</h2>
        <label>
          Status:
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {getStatusOptions().map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
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
      <button onClick={() => navigate('/restaurant/user')}>Powrót</button>
    </div>
  );
};

export default OrderDetails;