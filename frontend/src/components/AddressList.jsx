import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AddressList = () => {
  const [addresses, setAddresses] = useState([]);
  const [error, setError] = useState(null);

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
            //setNoAddresses(true); // Brak adresów
            setError('Brak adresów');
          } else {
            setAddresses(response.data); // Ustawiamy adresy, jeśli są
          }
      } catch (err) {
        setError('Błąd podczas ładowania adresów');
      }
    };

    fetchAddresses();
  }, []);

  const handleDelete = async (addressId) => {
    const confirmDelete = window.confirm('Czy na pewno chcesz usunąć ten adres?');
    if (confirmDelete) {
      try {
        const token = sessionStorage.getItem('authToken');
        await axios.delete(`http://localhost:8000/api/delete-address/${addressId}/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setAddresses(addresses.filter((address) => address.id !== addressId));  // Usuwamy adres z listy
      } catch (err) {
        setError('Błąd podczas usuwania adresu');
      }
    }
  };

  return (
    <div>
      <h3>Moje adresy</h3>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <ul>
        {addresses.map((address) => (
          <li key={address.id}>
            {address.first_name} {address.last_name} - {address.street} {address.building_number} {address.apartment_number} , {address.postal_code} {address.city}, tel. {address.phone_number}
            <button onClick={() => handleDelete(address.id)}>Usuń</button>
            {/* Można dodać przycisk edytowania */}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AddressList;