import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Notifications = ({ token, userRole }) => {
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotifications = async () => {
      const response = await fetch('http://localhost:8000/api/notifications/unread/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setNotifications(data);
    };

    fetchNotifications();

    const ws = new WebSocket(`ws://localhost:8000/ws/notifications/?token=${token}`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'notification') {
        setNotifications((prev) => [...prev, { message: data.message, timestamp: data.timestamp }]);
      }
    };

    return () => {
      ws.close();
    };
  }, [token]);

  const handleMarkAsRead = async (id) => {
    await fetch(`http://localhost:8000/api/notifications/${id}/mark_as_read/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  };

  const handleGoToOrder = (orderId) => {
    if (userRole === 'restaurateur') {
      navigate(`/order/${orderId}`);
    } else {
      navigate(`/user/orders/${orderId}`);
    }
  };

  return (
    <div>
      <h2>Powiadomienia</h2>
      <ul>
        {notifications.map((notification) => (
          <li key={notification.id}>
            {notification.message} - {new Date(notification.timestamp).toLocaleString()}
            <button onClick={() => handleMarkAsRead(notification.id)}>Usuń</button>
            <button onClick={() => handleGoToOrder(notification.order)}>Idź</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Notifications;