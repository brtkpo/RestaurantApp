import React, { useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Provider, useDispatch } from 'react-redux';
import store from './redux/store';
import { setUserToken } from './redux/actions';

import Navbar from "./components/Navbar";  
import Home from "./pages/Home";           
import Login from "./pages/Login";         
import Register from "./pages/Register"; 
import User from "./pages/User";    
import RestaurantUser from "./pages/RestaurantUser";  
import RestaurantRegister from "./pages/RestaurantRegister";    
import Order from "./pages/Order"; 
import OrderDetails from "./pages/OrderDetails";
import UserOrderDetails from "./pages/UserOrderDetails";  
import { CartProvider } from './components/CartContext';  

// Zmiana - Provider teraz obejmuje cały komponent App
function App() {
  const dispatch = useDispatch();

  // Sprawdzenie tokena w sessionStorage przy załadowaniu aplikacji
  useEffect(() => {
    const token = sessionStorage.getItem('authToken');
    if (token) {
      dispatch(setUserToken(token));  // Ustawiamy token w Redux
    }
  }, [dispatch]);

  return (
    <CartProvider>
      <div>
        <Navbar />   {/* Navbar jest teraz widoczny dla wszystkich komponentów */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} /> 
          <Route path="/user" element={<User />} /> 
          <Route path="/restaurant/user" element={<RestaurantUser />} /> 
          <Route path="/restaurant/register" element={<RestaurantRegister />} /> 
          <Route path="/order" element={<Order />} />
          <Route path="/order/:orderId" element={<OrderDetails />} />
          <Route path="/user/orders/:orderId" element={<UserOrderDetails />} />
        </Routes>
      </div>
    </CartProvider>
    
  );
}

// Cała aplikacja w Provider
function AppWrapper() {
  return (
    <Provider store={store}>
      <Router>
        <App />
      </Router>
    </Provider>
  );
}

export default AppWrapper;