import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { useSelector } from 'react-redux'; 
import { CartContext } from './CartContext';
import axios from "axios";
import DeleteProductFromCart from './DeleteProductFromCart';
import Notifications from './Notifications';

const Navbar = () => {
  const token = useSelector((state) => state.token);  // Pobieramy token z Redux
  const { cartItems, setCartItems, refreshCart } = useContext(CartContext);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  let ws; // Define the ws variable in the appropriate scope

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = sessionStorage.getItem('authToken');
        const response = await axios.get('http://localhost:8000/api/notifications/', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setNotificationCount(response.data.length);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };

    fetchNotifications();
  }, []);

  const connectWebSocket = (url) => {
    return new Promise((resolve, reject) => {
      ws = new WebSocket(url);

      ws.onopen = () => {
        console.log('WebSocket connection established');
        resolve(ws);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };

      ws.onclose = (event) => {
        console.warn('WebSocket connection closed:', event.code, event.reason);
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setNotificationCount((prevCount) => prevCount + 1);
      };
    });
  };

  useEffect(() => {
    const token = sessionStorage.getItem('authToken');
    if (!token) return;

    const wsUrl = `ws://localhost:8000/ws/notifications/?token=${token}`;
    connectWebSocket(wsUrl).catch((error) => {
      console.error('Failed to establish WebSocket connection:', error);
    });

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  const fetchCart = async () => {
    const sessionId = sessionStorage.getItem('session_id');
    console.log('session Id:', sessionId); // Debugging
    if (sessionId) {
      try {
        const response = await axios.get(`http://localhost:8000/api/cart/${sessionId}/`);
        setCartItems(response.data[0].items);
      } catch (error) {
        console.error('Error fetching cart:', error);
      }
    }
  };

  useEffect(() => {
    refreshCart();
  }, []);

  const toggleCart = () => {
    setIsCartOpen(!isCartOpen);
  };

  const toggleNotifications = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
  };

  const handleNotificationCountChange = (count) => {
    setNotificationCount(count);
  };

  const groupedCartItems = cartItems ? cartItems.reduce((acc, item) => {
    const { name, restaurant, price } = item.product;
    if (!acc[restaurant]) {
      acc[restaurant] = [];
    }
    acc[restaurant].push({ ...item, name, price });
    return acc;
  }, {}) : {};

  const totalSum = cartItems.reduce((sum, item) => {
    const price = parseFloat(item.product.price);
    return sum + (price * item.quantity);
  }, 0);

  return (
    <>
      <nav style={styles.navbar}>
        <ul style={styles.ul}>
          <li style={styles.li}>
            <Link to="/" style={styles.link}>Home</Link>
          </li>
          <li style={styles.li}>
            {token  ? (
              <Link to="/user" style={styles.link}>User</Link>  // Jeśli zalogowany, pokazujemy "User"
            ) : (
              <Link to="/login" style={styles.link}>Login</Link>  // Jeśli nie, pokazujemy "Login"
            )}
          </li>
          <li style={styles.li}>
            <div style={styles.notificationIcon} onClick={toggleNotifications}>
              Notifications {notificationCount > 0 && <span style={styles.notificationBadge}>{notificationCount}</span>}
            </div>
            {isNotificationsOpen && (
              <div style={styles.notificationsDropdown}>
                <Notifications onNotificationCountChange={handleNotificationCountChange} />
              </div>
            )}
          </li>
          <li style={styles.li}>
            <div style={styles.cartIcon} onClick={toggleCart}>
              Cart
            </div>
            {isCartOpen && (
              <div style={styles.cartDropdown}>
                {Object.keys(groupedCartItems).map(restaurant => (
                  <div key={restaurant}>
                    <h3>{restaurant}</h3>
                    <ul>
                      {groupedCartItems[restaurant].map(item => (
                        <li key={item.id}>
                          {item.name} - {item.quantity} szt. x {item.price} PLN
                          <DeleteProductFromCart itemId={item.id} />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                <div>Total: {totalSum} PLN</div>
              </div>
            )}
          </li>
        </ul>
      </nav>
    </>
  );
};

const styles = {
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px',
    backgroundColor: '#333',
    color: '#fff',
  },
  ul: {
    listStyleType: 'none',
    display: 'flex',
    margin: 0,
    padding: 0,
  },
  li: {
    margin: '0 10px',
  },
  link: {
    color: '#fff',
    textDecoration: 'none',
  },
  notificationIcon: {
    position: 'relative',
    cursor: 'pointer',
  },
  notificationBadge: {
    position: 'absolute',
    top: '-10px',
    right: '-10px',
    backgroundColor: 'red',
    color: 'white',
    borderRadius: '50%',
    padding: '5px 10px',
  },
  cartIcon: {
    cursor: 'pointer',
  },
  cartDropdown: {
    position: 'absolute',
    top: '40px',
    right: '10px',
    backgroundColor: '#fff',
    color: '#000',
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '5px',
    zIndex: 1000,
  },
  notificationsDropdown: {
    position: 'absolute',
    top: '40px',
    right: '10px',
    backgroundColor: '#fff',
    color: '#000',
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '5px',
    zIndex: 1000,
  },
};

export default Navbar;