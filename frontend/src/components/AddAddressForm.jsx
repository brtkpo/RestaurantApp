import React, { useState } from 'react';
import axios from 'axios';

const AddAddressForm = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    street: '',
    building_number: '',
    apartment_number: '',
    postal_code: '',
    city: '',
  });
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = sessionStorage.getItem('authToken');
      const response = await axios.post('http://localhost:8000/api/add-address/', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      alert('Adres dodany pomyślnie!');
      setFormData({  // Resetowanie formularza po udanym dodaniu adresu
        first_name: '',
        last_name: '',
        phone_number: '',
        street: '',
        building_number: '',
        apartment_number: '',
        postal_code: '',
        city: '',
      });
    } catch (err) {
      setError('Błąd podczas dodawania adresu');
    }
  };

  return (
    <div>
      <h3>Dodaj nowy adres</h3>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="first_name"
          value={formData.first_name}
          onChange={handleChange}
          placeholder="Imię"
        />
        <input
          type="text"
          name="last_name"
          value={formData.last_name}
          onChange={handleChange}
          placeholder="Nazwisko"
        />
        <input
          type="text"
          name="phone_number"
          value={formData.phone_number}
          onChange={handleChange}
          placeholder="Numer telefonu"
        />
        <input
          type="text"
          name="street"
          value={formData.street}
          onChange={handleChange}
          placeholder="Ulica"
        />
        <input
          type="number"
          name="building_number"
          value={formData.building_number}
          onChange={handleChange}
          placeholder="Nr budynku"
        />
        <input
          type="number"
          name="apartment_number"
          value={formData.apartment_number}
          onChange={handleChange}
          placeholder="Nr mieszkania (opcjonalnie)"
        />
        <input
          type="text"
          name="postal_code"
          value={formData.postal_code}
          onChange={handleChange}
          placeholder="Kod pocztowy"
        />
        <input
          type="text"
          name="city"
          value={formData.city}
          onChange={handleChange}
          placeholder="Miasto"
        />
        <button type="submit">Dodaj adres</button>
      </form>
    </div>
  );
};

export default AddAddressForm;
