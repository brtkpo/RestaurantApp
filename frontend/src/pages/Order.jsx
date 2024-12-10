import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import AddressSelector from '../components/AddressSelector';
import AddAddressForm from '../components/AddAddressForm';
import axios from 'axios';

const Order = () => {
  const token = useSelector((state) => state.token); // Pobieramy token z Redux
  const navigate = useNavigate();
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [addresses, setAddresses] = useState([]);

  useEffect(() => {
    if (!token) {
      navigate('/login'); // Przekierowanie na stronę logowania, jeśli użytkownik nie jest zalogowany
    }
  }, [token, navigate]);

  const handleAddressSelect = (address) => {
    setSelectedAddress(address);
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

  return (
    <div>
      <h2>Order Page</h2>
      {token ? (
        <>
          <AddressSelector onSelect={handleAddressSelect} /> {/* Wyświetlanie listy adresów */}
          {selectedAddress && (
            <div>
              <h3>Wybrany adres:</h3>
              <p>{selectedAddress.first_name} {selectedAddress.last_name} - {selectedAddress.street} {selectedAddress.building_number} {selectedAddress.apartment_number}, {selectedAddress.postal_code} {selectedAddress.city}, tel. {selectedAddress.phone_number}</p>
            </div>
          )}
          <AddAddressForm onAddAddress={handleAddAddress} />
        </>
      ) : (
        <p>Proszę się zalogować, aby zobaczyć listę adresów.</p>
      )}
    </div>
  );
};

export default Order;