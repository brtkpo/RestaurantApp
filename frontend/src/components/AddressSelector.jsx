import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import loadingGif from '../assets/200w.gif'; 

const AddressSelector = ({ onSelect, onAddAddress }) => {
  const [addresses, setAddresses] = useState([]);
  const [error, setError] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
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
          setAddresses(response.data); 
        }
      } catch (err) {
        setError('Błąd podczas ładowania adresów');
        navigate('/login');
        
      } 
      setIsLoading(false); 
      console.log('Addresses loaded');
    };

    fetchAddresses();
  }, [onAddAddress]);

  const handleSelect = (address) => {
    setSelectedAddress(address);
    onSelect(address);
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
      <h3 className="text-xl font-medium text-center text-gray-800 dark:text-gray-700">Wybierz adres:</h3>
      {error && <p className=" text-xl font-medium text-center text-red-600 dark:text-red-500">{error}</p>}
      <ul class="list-disc">
        {addresses.map((address) => (
          <li key={address.id} class="flex items-center mb-4">
            <label class="relative flex items-center cursor-pointer">
              <input
                type="radio"
                name="address"
                value={address.id}
                checked={selectedAddress && selectedAddress.id === address.id}
                onChange={() => handleSelect(address)}
                class="w-4 h-4 accent-gray-600 text-gray-600 bg-gray-100 border-gray-300 focus:ring-gray-500 dark:focus:ring-gray-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <span className="ml-2 text-slate-600 text-sm">
                {address.first_name} {address.last_name} - {address.street} {address.building_number} {address.apartment_number}, {address.postal_code} {address.city}, tel. {address.phone_number}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AddressSelector;