import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from 'react-redux'; 

const Navbar = () => {
  const token = useSelector((state) => state.token);  // Pobieramy token z Redux
  //console.log('Token in Navbar:', token);

  return (
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
      </ul>
    </nav>
  );
};

const styles = {
  navbar: {
    backgroundColor: '#333',
    padding: '10px',
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
};

export default Navbar;
