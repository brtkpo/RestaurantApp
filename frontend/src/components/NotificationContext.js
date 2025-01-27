import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const navigate = useNavigate();
  const token = sessionStorage.getItem('authToken');

  const fetchUserDetails = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/user/details/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUserRole(response.data.role);
      console.log(response.data.role);
      setUserId(response.data.id);
      console.log(response.data.id);
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/notifications/unread/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    fetchUserDetails();
    fetchNotifications();

    const ws = new WebSocket(`ws://localhost:8000/ws/notifications/?token=${token}`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'notification') {
        setNotifications((prev) => [...prev, { id: data.id, message: data.message, timestamp: data.timestamp, order: data.order }]);
      }
    };

    return () => {
      ws.close();
    };
  }, [token]);

  const markAsRead = async (id) => {
    try {
      await axios.patch(`http://localhost:8000/api/notifications/${id}/mark_as_read/`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      setNotifications((prev) => prev.filter((notification) => notification.id !== id));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markNotificationsAsReadByOrder = async (orderId) => {
    try {
      await axios.patch(`http://localhost:8000/api/notifications/mark_as_read_by_order/${orderId}/`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      setNotifications((prev) => prev.filter((notification) => notification.order !== orderId));
    } catch (error) {
      console.error('Error marking notifications as read by order:', error);
    }
  };

  const handleGoToOrder = (orderId) => {
    if (userRole === 'restaurateur') {
      navigate(`/order/${orderId}`);
    } else {
      navigate(`/user/orders/${orderId}`);
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUserRole(null);
    setUserId(null);
  };

  return (
    <NotificationContext.Provider value={{ notifications, markAsRead, markNotificationsAsReadByOrder, handleGoToOrder, userRole, userId, fetchUserDetails, clearNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};