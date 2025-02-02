import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { useSelector } from 'react-redux'; 
import { CartContext } from './CartContext';
import { NotificationContext } from './NotificationContext';  
import axios from "axios";
import DeleteProductFromCart from './DeleteProductFromCart';

const Navbar = () => {
  const token = useSelector((state) => state.token);  // Pobieramy token z Redux
  const { cartItems, restaurant, isCartOpen, setIsCartOpen, refreshCart } = useContext(CartContext);
  const { notifications, markAsRead, handleGoToOrder, userRole } = useContext(NotificationContext);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false); 

  console.log("user role:", userRole);

  const toggleNotifications = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
    setIsCartOpen(false);
  };

  const toggleCart = () => {
    setIsCartOpen(!isCartOpen);
    setIsNotificationsOpen(false);
  };

  const totalSum = cartItems.reduce((sum, item) => {
    const price = parseFloat(item.product.price);
    return sum + (price * item.quantity);
  }, 0);

  const handleOrderClick = () => {
    setIsCartOpen(false); 
  };

  const statusLabels = {
    pending: 'Złożone',
    confirmed: 'Potwierdzone',
    shipped: 'Wydane do dostarczenia',
    delivered: 'Dostarczone',
    cancelled: 'Anulowane',
    ready_for_pickup: 'Gotowe do odbioru',
    picked_up: 'Odebrane',
  };

  const translateStatus = (message) => {
    for (const [key, value] of Object.entries(statusLabels)) {
      if (message.includes(key)) {
        return message.replace(key, value);
      }
    }
    return message;
  };

  return (
    <>
      <nav class="z-50 bg-white shadow dark:bg-gray-800">
        <div class="container flex items-center justify-center p-6 mx-auto text-gray-600 capitalize dark:text-gray-300">
          <ul style={styles.ul}>
            {userRole !== 'restaurateur'  && (
              <li style={styles.li}>
                <Link onClick={() => {setIsCartOpen(false); setIsNotificationsOpen(false);}} to="/" class="border-b-2 border-transparent hover:text-gray-800 transition-colors duration-300 transform dark:hover:text-gray-200 hover:border-gray-500 mx-1.5 sm:mx-6">Restauracje</Link>
              </li>
            )}
            <li style={styles.li}>
              {userRole === null  && (
                <Link onClick={() => {setIsCartOpen(false); setIsNotificationsOpen(false);}}  to="/login" class="border-b-2 border-transparent hover:text-gray-800 transition-colors duration-300 transform dark:hover:text-gray-200 hover:border-gray-500 mx-1.5 sm:mx-6">Zaloguj</Link>  
              )} 
              {userRole === 'client'  && (
                <Link onClick={() => {setIsCartOpen(false); setIsNotificationsOpen(false);}}  to="/user" class="border-b-2 border-transparent hover:text-gray-800 transition-colors duration-300 transform dark:hover:text-gray-200 hover:border-gray-500 mx-1.5 sm:mx-6">Konto</Link>  
              )} 
              {userRole === 'restaurateur'  && (
                <Link onClick={() => {setIsCartOpen(false); setIsNotificationsOpen(false);}}  to="/restaurant/user" class="border-b-2 border-transparent hover:text-gray-800 transition-colors duration-300 transform dark:hover:text-gray-200 hover:border-gray-500 mx-1.5 sm:mx-6">Konto</Link>  
              )}            
            </li>
            {userRole !== 'restaurateur'  && (
              <li style={styles.li}>
                <button onClick={toggleCart} class="border-b-2 border-transparent hover:text-gray-800 transition-colors duration-300 transform dark:hover:text-gray-200 hover:border-gray-500 mx-1.5 sm:mx-6">Koszyk</button>
              </li>
            )} 
            {userRole !== null  && (
              <li style={styles.li}>
                <button onClick={() => toggleNotifications()} class="border-b-2 border-transparent hover:text-gray-800 transition-colors duration-300 transform dark:hover:text-gray-200 hover:border-gray-500 mx-1.5 sm:mx-6">
                  Powiadomienia</button>
              </li>
            )} 
          </ul>
          {isCartOpen && (
            <div 
              class="w-2/5 absolute right-0 z-10 ml-2 py-2 origin-top-right bg-white rounded-md shadow-xl dark:bg-gray-800"
              style={{ top: '75px', textAlign: 'right'}}
            >
              {restaurant && (
                <div>
                  <h3 className="mb-2 text-xl font-medium text-center text-gray-800 dark:text-gray-700">{restaurant.name}</h3>
                </div>
              )}
              <ul class="list-disc pl-6">
                {cartItems.map((item) => (
                  <li key={item.id} className="flex justify-between items-center text-right">
                    <span className="list-item ">
                      {item.product.name} - {item.quantity} szt. x {item.product.price} PLN
                      
                    </span>
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
                <h3 className="mb-2 text-xl font-medium text-center text-gray-800 dark:text-gray-700">Brak produktów w koszyku.</h3>
              ) : totalSum < restaurant.minimum_order_amount ? (
                <div className="mb-2 text-lg font-medium text-center text-gray-800 dark:text-gray-700">
                  <strong>Suma: {totalSum.toFixed(2)} PLN</strong>
                  <p>Minimalna kwota zamówienia to {restaurant.minimum_order_amount} PLN. Dodaj więcej produktów do koszyka.</p>
                </div>
              ) : (
                <div className="mb-2 text-lg font-medium text-center text-gray-800 dark:text-gray-700">
                  <strong className="text-center">Suma: {totalSum.toFixed(2)} PLN</strong>
                  <li className="list-none">
                    {token  ? (
                      <Link to="/order" class="mx-2 text-xl font-bold text-gray-800 dark:text-gray-700 hover:underline flex items-center justify-center text-center" onClick={handleOrderClick}>Złóż zamówienie</Link>  // Jeśli zalogowany, pokazujemy "Złóż zamówienie"
                    ) : (
                      <Link to="/login" class="mx-2 text-xl font-bold text-gray-800 dark:text-gray-700 hover:underline flex items-center justify-center text-center" onClick={handleOrderClick}>Zaloguj się, by złożyć zamówienie</Link>  // Jeśli nie, pokazujemy "Login"
                    )}
                  </li>
                </div>
              )}
            </div>
          )}
          {isNotificationsOpen && (
            <div  
            class="w-2/5 absolute right-0 z-10 ml-2 py-2 origin-top-right bg-white rounded-md shadow-xl dark:bg-gray-800"
            style={{ top: '75px', textAlign: 'right'}}
            >
              {notifications.length === 0 ? (
                <h3 className="mb-2 text-xl font-medium text-center text-gray-800 dark:text-gray-700">Brak powiadomień.</h3>
              ) : (
                <ul className="list-disc pl-6">
                  {notifications.map((notification) => (
                    <li key={notification.id}>
                      <span className="list-item">
                        {translateStatus(notification.message)} - {new Date(notification.timestamp).toLocaleString()}
                        <button onClick={() => markAsRead(notification.id)} className="mx-2 px-2 py-1.5 text-sm font-medium dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-800 tracking-wide text-gray-700 capitalize transition-colors duration-300 transform border border-gray-200 rounded-md hover:bg-gray-100 focus:outline-none focus:ring focus:ring-gray-300 focus:ring-opacity-40">
                          Usuń
                        </button>
                        <button onClick={() => {toggleNotifications(); handleGoToOrder(notification.order)}} className="mr-4 px-2 py-1.5 text-sm font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-gray-800 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring focus:ring-gray-300 focus:ring-opacity-50">
                          Idź
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </nav>
      <div class="mt-2" /> {/* Element odstępu */}
    </>
  );
};

const styles = {
  navbar: {
    backgroundColor: '#333', //#f2f2f2
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
    top: '74px',
    backgroundColor: 'white',
    border: '1px solid #ddd',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
    width: '400px',
    zIndex: 1000,
  },
};

export default Navbar;
