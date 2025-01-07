import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { useSelector } from 'react-redux'; 
import { CartContext } from './CartContext';
import axios from "axios";
import DeleteProductFromCart from './DeleteProductFromCart';

const Navbar = () => {
  const token = useSelector((state) => state.token);  // Pobieramy token z Redux
  const { cartItems, restaurant, isCartOpen, setIsCartOpen, refreshCart } = useContext(CartContext);

  const toggleCart = () => {
    setIsCartOpen(!isCartOpen);
  };

  const totalSum = cartItems.reduce((sum, item) => {
    const price = parseFloat(item.product.price);
    return sum + (price * item.quantity);
  }, 0);

  const handleOrderClick = () => {
    setIsCartOpen(false); // Zamknij koszyk
  };

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
            <button onClick={toggleCart} style={styles.link}>Koszyk</button>
          </li>
        </ul>
        {isCartOpen && (
          <div style={styles.cartDropdown}>
            {restaurant && (
              <div>
                <h3>{restaurant.name}</h3>
              </div>
            )}
            <ul>
              {cartItems.map((item) => (
                <li key={item.id}>
                  {item.product.name} - {item.quantity} szt. x {item.product.price} PLN
                  <DeleteProductFromCart 
                    productId={item.product.id} 
                    cartItemId={item.id} 
                    quantity={item.quantity}
                    refreshCart={refreshCart} 
                  />
                </li>
              ))}
            </ul>
            {totalSum === 0 ? (
              <p>Brak produktów w koszyku.</p>
            ) : totalSum < restaurant.minimum_order_amount ? (
              <div style={styles.totalSum}>
                <strong>Suma: {totalSum.toFixed(2)} PLN</strong>
                <p>Minimalna kwota zamówienia to {restaurant.minimum_order_amount} PLN. Dodaj więcej produktów do koszyka.</p>
              </div>
            ) : (
              <div style={styles.totalSum}>
                <strong>Suma: {totalSum.toFixed(2)} PLN</strong>
                <li style={styles.li}>
                  {token  ? (
                    <Link to="/order" style={styles.link2} onClick={handleOrderClick}>Złóż zamówienie</Link>  // Jeśli zalogowany, pokazujemy "Złóż zamówienie"
                  ) : (
                    <Link to="/login" style={styles.link2} onClick={handleOrderClick}>Zaloguj się, by złożyć zamówienie</Link>  // Jeśli nie, pokazujemy "Login"
                  )}
                </li>
              </div>
            )}
          </div>
        )}
      </nav>
      <div style={styles.spacer} /> {/* Element odstępu */}
    </>
  );
};

const styles = {
  navbar: {
    backgroundColor: '#333',
    padding: '10px',
    position: "fixed", // Navbar "przyklejony" do okna przeglądarki
    top: 0, // Pozycja od góry
    width: "100%", // Rozciąga się na całą szerokość
    zIndex: 1000, // Ustawia z-index, by navbar był nad innymi elementami
  },
  spacer: {
    height: "30px", // Wysokość dopasowana do navbaru
  },
  ul: {
    listStyleType: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    justifyContent: 'space-around',
  },
  li: {
    margin: '0 15px',
  },
  link: {
    color: 'white',
    textDecoration: 'none',
    fontSize: '18px',
  },
  link2: {
    color: 'black',
    textDecoration: 'none',
    fontSize: '18px',
  },
  cartDropdown: {
    position: 'absolute',
    right: 0,
    top: '50px',
    backgroundColor: 'white',
    border: '1px solid #ddd',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
    width: '400px',
    zIndex: 1000,
  },
};

export default Navbar;
