import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { setUserToken } from '../redux/actions';
import AddressList from '../components/AddressList';  
import AddAddressForm from '../components/AddAddressForm';
import UserOrders from '../components/UserOrders';
import ArchivedUserOrders from '../components/ArchivedUserOrders';
import axios from 'axios';

import Notifications from '../components/Notifications';

const User = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const token = useSelector((state) => state.token);
  const [userData, setUserData] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [noAddresses, setNoAddresses] = useState(false);
  const [error, setError] = useState(null);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [showPaymentFail, setShowPaymentFail] = useState(false);

  const [isLoading, setIsLoading] = useState(true); // Dodano flagę isLoading

  const location = useLocation();
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    if (query.get('payment') === 'success') {
      setShowPaymentSuccess(true);
      setTimeout(() => setShowPaymentSuccess(false), 3000);
    } else if (query.get('payment') === 'fail') {
      setShowPaymentFail(true);
      setTimeout(() => setShowPaymentFail(false), 3000);
    }
  }, [location]);

  const fetchAddresses = async () => {
    const token = sessionStorage.getItem('authToken');
    try {
      const response = await axios.get('http://localhost:8000/api/addresses/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data.length === 0) {
        setNoAddresses(true);
        setError('Brak adresów');
      } else {
        setAddresses(response.data);
      }
    } catch (error) {
      setError('Błąd podczas ładowania adresów');
    }
  };

  useEffect(() => {
    const token = sessionStorage.getItem('authToken');
    if (token) {
      dispatch(setUserToken(token));
    }

    const fetchUserData = async () => {
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const response = await fetch('http://localhost:8000/api/user/', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('Błąd podczas pobierania danych użytkownika');
        }

        const data = await response.json();
        setUserData(data);
        if (data.role === 'restaurateur') {
          navigate('/restaurant/user');
        }
      } catch (error) {
        dispatch(setUserToken(null));
        sessionStorage.removeItem('authToken');
        setError(error.message);
        navigate('/login');
      }
    };

    const fetchAllData = async () => {
      await fetchUserData();
      await fetchAddresses();
      setIsLoading(false); // Dane załadowane
    };

    fetchAllData();
  }, [dispatch, navigate]);

  const handleLogout = () => {
    dispatch(setUserToken(null));
    sessionStorage.removeItem('authToken');
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    const confirm = window.confirm('Czy na pewno chcesz usunąć swoje konto?');
    if (!confirm) return;

    try {
      const response = await fetch('http://localhost:8000/api/delete-user/', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Nie udało się usunąć konta');
      }

      alert('Konto zostało pomyślnie usunięte');
      handleLogout();
    } catch (error) {
      alert(`Błąd: ${error.message}`);
    }
  };

  const handleAddAddress = async (newAddress) => {
    try {
      const response = await axios.post('http://localhost:8000/api/addresses/', newAddress, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 201) {
        setAddresses([...addresses, response.data]);
        alert('Adres dodany pomyślnie!');
      }
    } catch (error) {
      alert('Błąd podczas dodawania adresu');
    }
  };

  const handleDeleteAddress = async (addressId) => {
    const confirmDelete = window.confirm('Czy na pewno chcesz usunąć ten adres?');
    if (confirmDelete) {
      try {
        const response = await axios.delete(`http://localhost:8000/api/addresses/${addressId}/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.status === 204) {
          setAddresses(addresses.filter((address) => address.id !== addressId));
          alert('Adres usunięty pomyślnie!');
        }
      } catch (error) {
        alert('Błąd podczas usuwania adresu');
      }
    }
  };

  if (isLoading) {
    return <p>Ładowanie danych...</p>; // Wyświetl komunikat, dopóki dane się ładują
  }

  return (
    <div>
      <Notifications token={sessionStorage.getItem('authToken')} userRole={'client'} />
      <h1>Panel użytkownika</h1>
      {showPaymentSuccess && <div style={styles.popup_success}>Płatność zakończona sukcesem!</div>}
      {showPaymentFail && <div style={styles.popup_fail}>Płatność nie powiodła się!</div>}
      {userData ? (
        <div>
          <h2>Witaj, {userData.first_name} {userData.last_name}</h2>
          <p>Email: {userData.email}</p>
          <p>Telefon: {userData.phone_number || 'Brak numeru telefonu'}</p>
        </div>
      ) : (
        <p>Ładowanie danych...</p>
      )}
      <UserOrders />
      <ArchivedUserOrders />
      <button onClick={handleLogout}>Wyloguj</button>
      <AddressList key={addresses.map(address => address.id).join('-')} addresses={addresses} onDeleteAddress={handleDeleteAddress} />
      <AddAddressForm onAddAddress={handleAddAddress} />
      <br />
      <button onClick={handleDeleteAccount} style={{ color: 'red', marginTop: '30px' }}>
        Usuń konto
      </button>
    </div>
  );
};

const styles = {
  popup_success: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    backgroundColor: '#4caf50',
    color: 'white',
    padding: '10px',
    borderRadius: '5px',
    boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
    zIndex: 1000,
  },

  popup_fail: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    backgroundColor: '#ed4337',
    color: 'white',
    padding: '10px',
    borderRadius: '5px',
    boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
    zIndex: 1000,
  }
};

export default User;
