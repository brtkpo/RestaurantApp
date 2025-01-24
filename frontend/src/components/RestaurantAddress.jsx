import React, { useState, useEffect } from 'react';
import axios from 'axios';
import loadingGif from '../assets/200w.gif'; 

const RestaurantAddress = ({ profileData }) => {
  const [address, setAddress] = useState(null);
  const [formData, setFormData] = useState({
    street: '',
    building_number: '',
    apartment_number: '',
    postal_code: '',
    city: '',
  });
  const [error, setError] = useState('');
  const [globalError, setGlobalError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    const fetchAddress = async () => {
      try {
        const token = sessionStorage.getItem('authToken');
        const response = await axios.get('http://localhost:8000/api/addresses/', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data.length > 0) {
          setAddress(response.data[0]);
        } else {
          setAddress(null);
        }
        console.log('Adres:', response.data);
        console.log('ProfileData:', profileData);
      } catch (error) {
        console.error('Błąd podczas pobierania adresu:', error);
        setGlobalError('Błąd podczas pobierania adresu. Spróbuj ponownie później.');
      } finally {
        setIsLoading(false); // Ustaw isLoading na false po zakończeniu ładowania
      }
    };

    fetchAddress();
  }, [profileData]);

  const validateField = (name, value) => {
    switch (name) {
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
      case 'apartment_number':
        if (value && (isNaN(value) || value <= 0)) {
          return 'Numer mieszkania powinien być liczbą większą od 0.';
        }
        break;
      case 'postal_code':
        if (!/^\d{2}-\d{3}$/.test(value)) {
          return 'Kod pocztowy powinien mieć format XX-XXX.';
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
    setFormData({ ...formData, [name]: value });

    const validationError = validateField(name, value);
    setError(validationError);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = sessionStorage.getItem('authToken');
    const data = {
      ...formData,
      first_name: profileData.first_name,
      last_name: profileData.last_name,
      phone_number: profileData.restaurant.phone_number,
      user: profileData.id,
      owner_role: 'restaurateur',
      restaurant: profileData.restaurant.id,
    };

    const hasError = Object.entries(formData).some(
      ([key, value]) => validateField(key, value) !== ''
    );

    if (hasError) {
      setError('Popraw wszystkie błędy przed wysłaniem formularza.');
      return;
    }

    try {
      const response = await axios.post('http://localhost:8000/api/add-address/', data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 201) {
        setAddress(data);
        alert('Adres dodany pomyślnie!');
        setError('');
        setGlobalError(null);
      }
    } catch (error) {
      console.error('Błąd podczas dodawania adresu:', error);
      setGlobalError('Błąd podczas dodawania adresu. Spróbuj ponownie później.');
    }
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
      {error && <p style={{ color: 'red', marginBottom: '10px' }}>{error}</p>}
      {globalError && <p style={{ color: 'red' }}>{globalError}</p>}
      {address ? (
        <ul className=" text-gray-800 list-disc list-inside dark:text-gray-700">
          <li>Adres: {address.street} {address.building_number}{address.apartment_number > 0 ? `/${address.apartment_number}` : ''}, {address.postal_code} {address.city}</li>
          <li>Telefon: {address.phone_number}</li>
        </ul>
      ) : (
        <form onSubmit={handleSubmit}>
          <div>
            <label>Ulica:</label>
            <input type="text" name="street" value={formData.street} onChange={handleChange} required />
          </div>
          <div>
            <label>Numer budynku:</label>
            <input type="text" name="building_number" value={formData.building_number} onChange={handleChange} required />
          </div>
          <div>
            <label>Numer mieszkania/lokalu:</label>
            <input type="text" name="apartment_number" value={formData.apartment_number} onChange={handleChange} />
          </div>
          <div>
            <label>Kod pocztowy:</label>
            <input type="text" name="postal_code" value={formData.postal_code} onChange={handleChange} required />
          </div>
          <div>
            <label>Miasto:</label>
            <input type="text" name="city" value={formData.city} onChange={handleChange} required />
          </div>
          <button type="submit">Dodaj adres</button>
        </form>
      )}
    </div>
  );
};

export default RestaurantAddress;