import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { setUserToken } from '../redux/actions';
import AddressList from '../components/AddressList';  
import AddAddressForm from '../components/AddAddressForm';
import UserOrders from '../components/UserOrders';
import axios from 'axios';

import CheckoutButton from '../components/CheckoutButton';

const User = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const token = useSelector((state) => state.token);
  const [userData, setUserData] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [noAddresses, setNoAddresses] = useState(false);
  const [error, setError] = useState(null);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);

  const location = useLocation();
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    if (query.get('payment') === 'success') {
      setShowPaymentSuccess(true);
      setTimeout(() => setShowPaymentSuccess(false), 5000); // Ukryj popup po 5 sekundach
    }
  }, [location]);

  const fetchAddresses = async () => {
    const token = sessionStorage.getItem('authToken'); // Pobierz token z sessionStorage
    try {
      const response = await axios.get('http://localhost:8000/api/addresses/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      //console.log(response);
      if (response.data.length === 0) {
        setNoAddresses(true); // Brak adresów
        setError('Brak adresów');
      } else {
        setAddresses(response.data); // Ustawiamy adresy, jeśli są
      }
    } catch (error) {
      setError('Błąd podczas ładowania adresów');
    }
  };

  // Funkcja do pobrania danych użytkownika
  useEffect(() => {
    const token = sessionStorage.getItem('authToken'); // Pobierz token z sessionStorage
    if (token) {
      dispatch(setUserToken(token)); // Ustaw token w Reduxie po załadowaniu strony
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
        console.log(data);
        console.log(data.role);
        if (data.role === 'restaurateur') {
          console.log('Bober');
          navigate('/restaurant/user'); // Przekierowanie do strony restauratora
        }
      } catch (error) {
        dispatch(setUserToken(null));
        sessionStorage.removeItem('authToken');
        setError(error.message);
        navigate('/login');
      }
    };
    

    
    fetchUserData();
    fetchAddresses();
  }, [dispatch, navigate]);
  // Funkcja wylogowania
  const handleLogout = () => {
    dispatch(setUserToken(null)); // Usuwamy token z Redux
    sessionStorage.removeItem('authToken'); // Usuwamy token z sessionStorage
    navigate('/login'); // Przekierowanie na stronę logowania
  };

  // Funkcja usuwania konta
  const handleDeleteAccount = async () => {
    const confirm = window.confirm('Czy na pewno chcesz usunąć swoje konto?'); // Alert z potwierdzeniem
    if (!confirm) return; // Jeśli użytkownik kliknie "Nie", przerywamy
    
    try {
      const response = await fetch('http://localhost:8000/api/delete-user/', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`, // Przesyłanie tokena w nagłówkach
        },
      });

      if (!response.ok) {
        throw new Error('Nie udało się usunąć konta');
      }

      // Po pomyślnym usunięciu konta
      alert('Konto zostało pomyślnie usunięte');
      handleLogout(); // Wylogowanie użytkownika
    } catch (error) {
      alert(`Błąd: ${error.message}`); // Wyświetlenie błędu
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
        //fetchAddresses();
      }
    } catch (error) {
      alert('Błąd podczas dodawania adresu');
    }
  };

  // Funkcja do usuwania adresu
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

  return (
    <div>
      <h1>Panel użytkownika</h1>
      {showPaymentSuccess && <div style={styles.popup}>Płatność zakończona sukcesem!</div>}
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
      <button onClick={handleLogout}>Wyloguj</button>
      <AddressList key={addresses.map(address => address.id).join('-')} addresses={addresses} onDeleteAddress={handleDeleteAddress} />
      <AddAddressForm onAddAddress={handleAddAddress} />
      <br/>
      <button onClick={handleDeleteAccount} style={{ color: 'red', marginTop: '30px' }}>
        Usuń konto
      </button>
    </div>
  );
};

const styles = {
  popup: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    backgroundColor: '#4caf50',
    color: 'white',
    padding: '10px',
    borderRadius: '5px',
    boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
    zIndex: 1000,
  }
};

export default User;
