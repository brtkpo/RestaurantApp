import React, { useEffect, useState } from 'react';

const Notifications = ({ token }) => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
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

  return (
    <div>
      <h2>Powiadomienia</h2>
      <ul>
        {notifications.map((notification, index) => (
          <li key={index}>
            {notification.message} - {new Date(notification.timestamp).toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Notifications;