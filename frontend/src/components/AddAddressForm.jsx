import React, { useState, useEffect } from 'react';
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

  const [error, setError] = useState(''); // Jeden błąd do wyświetlenia
  const [globalError, setGlobalError] = useState(null); // Błąd globalny (np. serwerowy)
  const [typingTimeout, setTypingTimeout] = useState(null); // Timeout dla debouncingu

  const validateField = (name, value) => {
    switch (name) {
      case 'first_name':
        if (!/^[a-zA-Z\s]+$/.test(value)) {
          return 'Imię powinno zawierać tylko litery.';
        }
        break;
      case 'last_name':
        if (!/^[a-zA-Z\s]+$/.test(value)) {
          return 'Nazwisko powinno zawierać tylko litery.';
        }
        break;
      case 'phone_number':
        if (value.length !== 9 || isNaN(value)) {
          return 'Numer telefonu powinien zawierać dokładnie 9 cyfr.';
        }
        break;
      case 'postal_code':
        if (!/^\d{2}-\d{3}$/.test(value)) {
          return 'Kod pocztowy powinien mieć format XX-XXX.';
        }
        break;
      case 'street':
        if (!/^[a-zA-Z\s]+$/.test(value)) {
          return 'Ulica powinna zawierać tylko litery.';
        }
        break;
      case 'building_number':
        if (isNaN(value) || value <= 0) {
          return 'Numer budynku powinien być liczbą większą od 0.';
        }
        break;
      case 'city':
        if (!/^[a-zA-Z\s]+$/.test(value)) {
          return 'Miasto powinno zawierać tylko litery.';
        }
        break;
      default:
        break;
    }
    return ''; // Brak błędów
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Aktualizuj dane formularza
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));

    // Anuluj poprzedni timeout i ustaw nowy
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    const newTimeout = setTimeout(() => {
      const validationError = validateField(name, value);
      setError(validationError); // Wyświetl tylko jeden błąd
    }, 500); // Wywołaj walidację po 500ms od zakończenia pisania

    setTypingTimeout(newTimeout);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Sprawdzanie, czy są błędy
    const hasError = Object.entries(formData).some(
      ([key, value]) => validateField(key, value) !== ''
    );

    if (hasError) {
      setError('Popraw wszystkie błędy przed wysłaniem formularza.');
      return;
    }

    try {
      const token = sessionStorage.getItem('authToken');
      await axios.post('http://localhost:8000/api/add-address/', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      alert('Adres dodany pomyślnie!');
      setFormData({
        first_name: '',
        last_name: '',
        phone_number: '',
        street: '',
        building_number: '',
        apartment_number: '',
        postal_code: '',
        city: '',
      });
      setError('');
      setGlobalError(null);
    } catch (err) {
      setGlobalError('Błąd podczas dodawania adresu. Spróbuj ponownie później.');
    }
  };

  return (
    <div>
      <h3>Dodaj nowy adres</h3>
      {/* Wyświetlanie błędu */}
      {error && <p style={{ color: 'red', marginBottom: '10px' }}>{error}</p>}
      {globalError && <p style={{ color: 'red' }}>{globalError}</p>}

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
