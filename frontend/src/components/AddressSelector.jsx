import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AddressSelector = ({ onSelect, onAddAddress }) => {
  const [addresses, setAddresses] = useState([]);
  const [error, setError] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const token = sessionStorage.getItem('authToken');
        const response = await axios.get('http://localhost:8000/api/addresses/', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.data.length === 0) {
          setError('Brak adresów');
        } else {
          setAddresses(response.data); // Ustawiamy adresy, jeśli są
        }
      } catch (err) {
        setError('Błąd podczas ładowania adresów');
        navigate('/login');
      }
    };

    fetchAddresses();
  }, [onAddAddress]);

  const handleSelect = (address) => {
    setSelectedAddress(address);
    onSelect(address);
  };

  return (
    <div>
      <h3 className="text-xl font-medium text-center text-gray-800 dark:text-gray-700">Wybierz adres:</h3>
      {error && <p className=" text-xl font-medium text-center text-red-600 dark:text-red-500">{error}</p>}
      <ul>
        {addresses.map((address) => (
          <li key={address.id}>
            <label>
              <input
                type="radio"
                name="address"
                value={address.id}
                checked={selectedAddress && selectedAddress.id === address.id}
                onChange={() => handleSelect(address)}
              />
              {address.first_name} {address.last_name} - {address.street} {address.building_number} {address.apartment_number}, {address.postal_code} {address.city}, tel. {address.phone_number}
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AddressSelector;