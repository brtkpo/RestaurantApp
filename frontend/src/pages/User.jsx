import React, { useEffect, useState, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { setUserToken } from '../redux/actions';
import AddressList from '../components/AddressList';  
import AddAddressForm from '../components/AddAddressForm';
import UserOrders from '../components/UserOrders';
import ArchivedUserOrders from '../components/ArchivedUserOrders';
import axios from 'axios';
import loadingGif from '../assets/200w.gif'; 
import Modal from 'react-modal';
import { NotificationContext } from '../components/NotificationContext'; 

import Notifications from '../components/Notifications';

const User = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const token = useSelector((state) => state.token);
  const [userData, setUserData] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [noAddresses, setNoAddresses] = useState(false);
  const [error, setError] = useState(null);
  const [isAddAddressModalOpen, setIsAddAddressModalOpen] = useState(false);
  const { clearNotifications } = useContext(NotificationContext); 

  const [isLoading, setIsLoading] = useState(true); // Dodano flagę isLoading


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
    clearNotifications(); 
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

  const handleDeleteAddress = async (addressId) => {
    //const confirmDelete = window.confirm('Czy na pewno chcesz usunąć ten adres?');
    //if (confirmDelete) {
      try {
        const response = await axios.delete(`http://localhost:8000/api/addresses/${addressId}/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.status === 204) {
          setAddresses(addresses.filter((address) => address.id !== addressId));
          //alert('Adres usunięty pomyślnie!');
        }
      } catch (error) {
        //alert('Błąd podczas usuwania adresu');
      }
    //}
  };

  const openAddAddressModal = () => {
    setIsAddAddressModalOpen(true);
  };

  const closeAddAddressModal = () => {
    setIsAddAddressModalOpen(false);
  };

  const refreshAddresses = () => {
    fetchAddresses();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center">
        <img src={loadingGif} alt="Loading..." />
      </div>
    );
  }

  return (
    <div>
      {/*<Notifications token={sessionStorage.getItem('authToken')} userRole={'client'} />*/}
      <h3 className="mt-10 text-xl font-medium text-center text-gray-800 dark:text-gray-700">Panel użytkownika</h3>

      <div className="font-[sans-serif] w-full max-w-xl mx-auto overflow-hidden bg-white rounded-lg shadow-md dark:bg-gray-800 px-6 py-4">
        <ul className=" text-gray-800 list-disc list-inside dark:text-gray-700">
          <li>Imię: {userData.first_name}</li>
          <li>Nazwisko: {userData.last_name}</li>
          <li>Email: {userData.email}</li>
        </ul>

      </div>

      <UserOrders />
      <ArchivedUserOrders />

      <div className="mt-2 text-center font-[sans-serif]">
                  <button onClick={handleLogout} className="px-6 py-2 text-sm font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-gray-800 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring focus:ring-gray-300 focus:ring-opacity-50">
                    Wyloguj
                  </button>
                </div>
                
      <AddressList key={addresses.map(address => address.id).join('-')} onAddAddress={refreshAddresses} addresses={addresses} onDeleteAddress={handleDeleteAddress} />
      
      <div className='flex justify-center'>
        <button onClick={openAddAddressModal} className="mt-2 px-6 py-2 text-sm font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-gray-800 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring focus:ring-gray-300 focus:ring-opacity-50">
          Dodaj nowy adres
        </button>
      </div> 
      <AddAddressForm isOpen={isAddAddressModalOpen} onRequestClose={closeAddAddressModal} onAddAddress={refreshAddresses} />
      <br />
      <button onClick={handleDeleteAccount} style={{ color: 'red', marginTop: '30px' }}>
        Usuń konto
      </button>
    </div>
  );
};

export default User;
