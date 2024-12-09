import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { useSelector } from 'react-redux'; 
import { CartContext } from './CartContext';
import axios from "axios";

const Navbar = () => {
  const token = useSelector((state) => state.token);  // Pobieramy token z Redux
  const { cartItems, setCartItems, refreshCart } = useContext(CartContext);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const fetchCart = async () => {
    const sessionId = sessionStorage.getItem('session_id');
    console.log('session Id:', sessionId); // Debugging
    if (sessionId) {
      try {
        const response = await axios.get(`http://localhost:8000/api/cart/${sessionId}/`);
        //console.log('response:', response);
        //console.log('Fetched cart:', response.data[0].items); // Debugging
        setCartItems(response.data[0].items);
      } catch (error) {
        console.error('Error fetching cart:', error);
      }
    }
  };

  useEffect(() => {
    refreshCart();
    //fetchCart();
  }, []);

  const toggleCart = () => {
    setIsCartOpen(!isCartOpen);
  };

  //const refreshCart = () => {
  //  fetchCart();
  //};

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
            <button onClick={toggleCart} style={styles.link}>Koszyk</button>
          </li>
        </ul>
        {isCartOpen && (
          <div style={styles.cartDropdown}>
            {Object.keys(groupedCartItems).map((restaurantName) => (
              <div key={restaurantName}>
                <h3>{restaurantName}</h3>
                <ul>
                  {groupedCartItems[restaurantName].map((item) => (
                    <li key={item.id}>
                      {item.name} - {item.quantity} szt. x {item.price} PLN
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div style={styles.totalSum}>
              <strong>Suma: {totalSum.toFixed(2)} PLN</strong>
            </div>
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
  cartDropdown: {
    position: 'absolute',
    right: 0,
    top: '50px',
    backgroundColor: 'white',
    border: '1px solid #ddd',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
    width: '300px',
    zIndex: 1000,
  },
};

export default Navbar;
