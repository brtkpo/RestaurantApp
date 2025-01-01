import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Notifications = ({ onNotificationCountChange }) => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = sessionStorage.getItem('authToken');
        const response = await axios.get('http://localhost:8000/api/notifications/', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setNotifications(response.data);
        onNotificationCountChange(response.data.length); // Update notification count
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };

    fetchNotifications();
  }, [onNotificationCountChange]);

  const deleteNotification = async (id) => {
    try {
      const token = sessionStorage.getItem('authToken');
      await axios.delete(`http://localhost:8000/api/notifications/${id}/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const updatedNotifications = notifications.filter(notification => notification.id !== id);
      setNotifications(updatedNotifications);
      onNotificationCountChange(updatedNotifications.length); // Update notification count
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  return (
    <div>
      <h2>Notifications</h2>
      <ul>
        {notifications.length === 0 ? (
          <li>No notifications</li>
        ) : (
          notifications.map(notification => (
            <li key={notification.id}>
              <p>{notification.message}</p>
              <p>{new Date(notification.timestamp).toLocaleString()}</p>
              <button onClick={() => deleteNotification(notification.id)}>Delete</button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default Notifications;