import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartId, setCartId] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [restaurant, setRestaurant] = useState(null);

  const fetchCart = async () => {
    const sessionId = sessionStorage.getItem('session_id');
    console.log('session Id:', sessionId); // Debugging
    if (sessionId) {
      try {
        const response = await axios.get(`http://localhost:8000/api/cart/${sessionId}/`);
        //console.log(response);
        const cartData = response.data[0];
        setCartId(cartData.id);
        setCartItems(cartData.items);
        setRestaurant(cartData.restaurant);
        //console.log('response:', response);
        //console.log('Fetched cart:', response.data[0].items);
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
    //setIsCartOpen(false);
  };

  return (
    <CartContext.Provider value={{ cartId, cartItems, restaurant, isCartOpen, setIsCartOpen, refreshCart }}>
      {children}
    </CartContext.Provider>
  );
};