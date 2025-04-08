import React, { useEffect, useState } from 'react';
import axios from 'axios';
import loadingGif from '../assets/200w.gif'; 

const AddressList = ({ onAddAddress }) => {
  const [addresses, setAddresses] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true); 

  const fetchAddresses = async () => {
    try {
      const token = sessionStorage.getItem('authToken');
      const response = await axios.get('http://localhost:8000/api/addresses/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data.length === 0) {
          //setError('Brak adresów');
        } else {
          setAddresses(response.data); 
        }
    } catch (err) {
      setError('Błąd podczas ładowania adresów');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAddresses();
  }, [onAddAddress]);

  const handleDelete = async (addressId) => {
    //const confirmDelete = window.confirm('Czy na pewno chcesz usunąć ten adres?');
    //if (confirmDelete) {
      try {
        const token = sessionStorage.getItem('authToken');
        await axios.delete(`http://localhost:8000/api/delete-address/${addressId}/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setAddresses(addresses.filter((address) => address.id !== addressId));  
      } catch (err) {
        setError('Błąd podczas usuwania adresu');
      }
    //}
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
      <h3 className="mt-2 text-xl font-medium text-center text-gray-800 dark:text-gray-700">Moje adresy</h3>
      <div className="font-[sans-serif] w-full max-w-2xl mx-auto overflow-hidden bg-white rounded-lg shadow-md dark:bg-gray-800 px-6 py-4">
  {error && <p style={{ color: 'red' }}>{error}</p>}
  <ul className="list-disc pl-4 text-gray-800 dark:text-gray-700">
    {addresses.map((address) => (
      <li
        key={address.id}
        className="flex items-center justify-between mb-2"
      >
        <span className="list-item">
          {address.first_name} {address.last_name} - {address.street} {address.building_number}{address.apartment_number > 0 ? `/${address.apartment_number}` : ''}, {address.postal_code} {address.city}, tel. {address.phone_number}
        </span>
        <button
          type="button"
          onClick={() => handleDelete(address.id)}
          className="ml-4 px-4 sm:mx-2 w-16 py-1.5 text-sm font-medium dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-800 tracking-wide text-gray-700 capitalize transition-colors duration-300 transform border border-gray-200 rounded-md hover:bg-gray-100 focus:outline-none focus:ring focus:ring-gray-300 focus:ring-opacity-40"
        >
          Usuń
        </button>
      </li>
    ))}
  </ul>
</div>
      
    </div>
  );
};

export default AddressList;