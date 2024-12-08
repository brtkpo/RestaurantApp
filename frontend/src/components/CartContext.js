import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  const fetchCart = async () => {
    const sessionId = sessionStorage.getItem('session_id');
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
    fetchCart();
  }, []);

  const refreshCart = () => {
    fetchCart();
  };

  return (
    <CartContext.Provider value={{ cartItems, refreshCart }}>
      {children}
    </CartContext.Provider>
  );
};