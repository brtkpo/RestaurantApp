import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { setUserToken } from '../redux/actions';
import UploadImage from '../components/UploadImage';
import ManageTags from '../components/ManageTags';
import AddProduct from '../components/AddProduct';
import RestaurantProducts from "../components/RestaurantProducts";
import RestaurantOrders from "../components/RestaurantOrders";
import placeholderImage from '../assets/Placeholder.png';
import RestaurantAddress from '../components/RestaurantAddress';
import ArchivedRestaurantOrders from '../components/ArchivedRestaurantOrders';

import Notifications from '../components/Notifications';

const RestaurantProfile = () => {
  const dispatch = useDispatch();
  const [profileData, setProfileData] = useState(null);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null);
  const navigate = useNavigate();
  const [productsUpdated, setProductsUpdated] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone_number: '',
    description: '',
    allows_online_payment: false,
    allows_cash_payment: false,
    allows_delivery: false,
    allows_pickup: false,
    minimum_order_amount: 0.00,
  });
  const [deliveryCities, setDeliveryCities] = useState([]);
  const cloudinaryBaseUrl = "https://res.cloudinary.com/dljau5sfr/";

  // Ładowanie danych restauratora z backendu
  useEffect(() => {
    const token = sessionStorage.getItem('authToken');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchProfileData = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/restaurant/user', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setProfileData(response.data);
        setFormData({
          name: response.data.restaurant.name,
          phone_number: response.data.restaurant.phone_number,
          description: response.data.restaurant.description,
          allows_online_payment: response.data.restaurant.allows_online_payment,
          allows_cash_payment: response.data.restaurant.allows_cash_payment,
          allows_delivery: response.data.restaurant.allows_delivery,
          allows_pickup: response.data.restaurant.allows_pickup,
          minimum_order_amount: response.data.restaurant.minimum_order_amount,
          delivery_city: ''
        });
        setDeliveryCities(response.data.restaurant.delivery_cities);
        console.log(response.data);
      } catch (error) {
        setError('Błąd podczas ładowania danych.');
        console.error(error);
      }
    };
    fetchProfileData();
  }, [navigate]);

  /*const fetchProducts = async () => {
    console.log("fetchProducts");
    try {
      const response = await axios.get(
        `http://localhost:8000/api/restaurant/${profileData.restaurant.id}/products/`
      );
      setProfileData((prevData) => ({
        ...prevData,
        restaurant: {
          ...prevData.restaurant,
          products: response.data,
        },
      }));
    } catch (err) {
      setError(err.message || "Nieoczekiwany błąd.");
    }
  };*/

  const normalizeCityName = (cityName) => {
    return cityName
      .toLowerCase()
      .replace(/\s*-\s*/g, '-') // Usuwa dodatkowe spacje wokół myślników
      .replace(/-+/g, '-') // Zamienia wiele myślników na jeden
      .split(' ') // Dzieli na słowa przy spacji
      .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Pierwsza litera duża, reszta mała
      .join(' ') // Łączy słowa z powrotem w string
      .replace(/-\s/g, '-') // Usuwa spacje po myślnikach
      .replace(/\s-/g, '-'); // Usuwa spacje przed myślnikami
  };

  const handleAddCity = async () => {
    const token = sessionStorage.getItem('authToken');
    let cityName = formData.delivery_city.trim();
    console.log("1",cityName);

    // Sprawdzenie, czy nazwa miasta zawiera tylko litery, spacje lub myślniki
    const cityRegex = /^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s-]+$/;
    if (!cityRegex.test(cityName)) {
      alert('Nazwa miasta może zawierać tylko litery, spacje lub myślniki.');
      return;
    }
    console.log("2",cityName);
    cityName = await normalizeCityName(cityName);
    console.log("3",cityName);
    try {
      const response = await axios.post(
        `http://localhost:8000/api/restaurant/${profileData.restaurant.id}/add-delivery-city/`,
        { name: cityName },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setDeliveryCities([...deliveryCities, { id: response.data.id, name: cityName }]);
      setFormData({ ...formData, delivery_city: '' });
    } catch (error) {
      console.error('Error adding city:', error);
    }
  };

  const handleRemoveCity = async (cityId) => {
    const token = sessionStorage.getItem('authToken');
    try {
      await axios.delete(
        `http://localhost:8000/api/restaurant/${profileData.restaurant.id}/remove-delivery-city/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          data: { id: cityId }
        }
      );
      setDeliveryCities(deliveryCities.filter(city => city.id !== cityId));
    } catch (error) {
      console.error('Error removing city:', error);
    }
  };

  const handleProductsUpdated = () => {
    setProductsUpdated(!productsUpdated);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    // Walidacja: co najmniej jedna opcja płatności i jedna opcja dostawy musi być zaznaczona
    if (!formData.allows_online_payment && !formData.allows_cash_payment) {
      setFormError('Musisz wybrać co najmniej jedną opcję płatności.');
      return;
    }
    if (!formData.allows_delivery && !formData.allows_pickup) {
      setFormError('Musisz wybrać co najmniej jedną opcję dostawy.');
      return;
    }

    const token = sessionStorage.getItem('authToken');
    try {
      const response = await axios.patch(
        `http://localhost:8000/api/restaurant/update/${profileData.restaurant.id}/`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.data.message) {
        alert(response.data.message);
      } else {
        alert('Dane restauracji zostały zaktualizowane pomyślnie!');
      }
    } catch (error) {
      console.error('Error updating restaurant details:', error);
      if (error.response && error.response.data && error.response.data.message) {
        alert(error.response.data.message);
      } else {
        alert('Nie udało się zaktualizować danych restauracji.');
      }
    }
  };

  // Jeśli wystąpił błąd podczas ładowania danych
  if (error) {
    return <div>{error}</div>;
  }

  // Jeśli dane restauratora nie są jeszcze dostępne
  if (!profileData) {
    return <div>Ładowanie danych...</div>;
  }

  const { first_name, last_name, email, phone_number, restaurant } = profileData;

  const handleLogout = () => {
    dispatch(setUserToken(null)); // Usuwamy token z Redux
    sessionStorage.removeItem('authToken'); // Usuwamy token z sessionStorage
    navigate('/login'); // Przekierowanie na stronę logowania
  };

  // Funkcja po zakończeniu wgrywania obrazu na Cloudinary
  const handleUploadSuccess = async (uploadedImageData) => {
    try {
      const token = sessionStorage.getItem('authToken');
      
      // Przesyłamy żądanie PATCH do zaktualizowania obrazu restauracji
      const response = await axios.patch(
        `http://localhost:8000/api/restaurant/update/${restaurant.id}/`, // Endpoint do aktualizacji restauracji
        { image: uploadedImageData.path }, // Przekazanie nowej ścieżki do zdjęcia
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Aktualizowanie danych restauracji po dodaniu obrazu
      setProfileData((prevData) => ({
        ...prevData,
        restaurant: { ...prevData.restaurant, image: uploadedImageData.path },
      }));
    } catch (error) {
      console.error('Error updating restaurant image:', error);
      alert('Nie udało się zaktualizować zdjęcia.');
    }
  };

  return (
    <div>
      <Notifications token={sessionStorage.getItem('authToken')} userRole={'restaurateur'} />
      <h1>Panel Restauratora</h1>
      <h2>Twoje dane</h2>
      <p>Imię: {first_name}</p>
      <p>Nazwisko: {last_name}</p>
      <p>Email: {email}</p>
      <p>Numer telefonu: {phone_number || 'Brak numeru telefonu'}</p>

      <h2>Informacje o restauracji</h2>
      <p>Nazwa: {restaurant.name}</p>
      <p>Telefon lokalu: {restaurant.phone_number}</p>
      <p>Opis: {restaurant.description}</p>
      <RestaurantAddress profileData={profileData} />
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            <input
              type="checkbox"
              name="allows_online_payment"
              checked={formData.allows_online_payment}
              onChange={handleChange}
            />
            Płatność online
          </label>
        </div>
        <div>
          <label>
            <input
              type="checkbox"
              name="allows_cash_payment"
              checked={formData.allows_cash_payment}
              onChange={handleChange}
            />
            Płatność przy odbiorze
          </label>
        </div>
        <div>
          <label>
            <input
              type="checkbox"
              name="allows_delivery"
              checked={formData.allows_delivery}
              onChange={handleChange}
            />
            Dostawa kurierem
          </label>
        </div>
        <div>
          <label>
            <input
              type="checkbox"
              name="allows_pickup"
              checked={formData.allows_pickup}
              onChange={handleChange}
            />
            Odbiór osobisty
          </label>
        </div>
        <div>
        <label>
          Minimalna kwota zamówienia:
          <input
            type="number"
            name="minimum_order_amount"
            value={formData.minimum_order_amount}
            onChange={handleChange}
            min="0"
            max="10000"
          />
        </label>
      </div>
        {formError && <p style={{ color: 'red' }}>{formError}</p>}
        <button type="submit">Zapisz</button>
      </form>

      <div>
          <label>
            Miasto dostawy:
            <input
              type="text"
              name="delivery_city"
              value={formData.delivery_city}
              onChange={handleChange}
            />
          </label>
          <button type="button" onClick={handleAddCity}>Dodaj miasto</button>
        </div>

      <h3>Miasta dostawy</h3>
      {formData.allows_delivery && deliveryCities.length === 0 && (
        <p>Dodaj miasta, które dostawa obsługuje</p>
      )}
      <ul>
        {deliveryCities.map(city => (
          <li key={city.id}>
            {city.name}
            <button onClick={() => handleRemoveCity(city.id)}>Usuń</button>
          </li>
        ))}
        {deliveryCities.length === 0 && (
          <li>Brak miast</li>
        )}
      </ul>

      <h3>Zdjęcie restauracji</h3>
      {restaurant.image ? (
        // Jeśli zdjęcie istnieje, wyświetl je z Cloudinary
        <div>
          <img
            src={`${cloudinaryBaseUrl}${restaurant.image}`}
            alt={restaurant.name}
            style={{ width: '300px', height: 'auto' }}
          />
          <br />
          <h2>Upload Image</h2>
          <UploadImage
            onUploadSuccess={handleUploadSuccess}
            metadata={{ id: restaurant.id, name: 'main' }}
          />
        </div>
      ) : (
        // Jeśli nie ma zdjęcia, umożliwiamy załadowanie nowego
        <div>
          <img
            src={placeholderImage}
            alt={restaurant.name}
            style={{ width: '300px', height: 'auto' }}
          />
          <br />
          <h2>Upload Image</h2>
          <UploadImage
            onUploadSuccess={handleUploadSuccess}
            metadata={{ id: restaurant.id, name: 'main' }}
          />
        </div>
      )}

      <br />
      <RestaurantOrders restaurantId={profileData.restaurant.id} /> 
      <ArchivedRestaurantOrders restaurantId={profileData.restaurant.id} /> 
      <ManageTags restaurantId={restaurant.id} />
      <RestaurantProducts restaurantId={restaurant.id} key={productsUpdated} />
      <AddProduct restaurantId={restaurant.id} onProductAdded={handleProductsUpdated} />
      <button onClick={handleLogout}>Wyloguj</button>
    </div>
  );
};

export default RestaurantProfile;
