import React, { useEffect, useState, useContext } from 'react';
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
import loadingGif from '../assets/200w.gif'; 
import Modal from 'react-modal';
import { NotificationContext } from '../components/NotificationContext';

import Notifications from '../components/Notifications';

const RestaurantProfile = () => {
  const dispatch = useDispatch();
  const [profileData, setProfileData] = useState(null);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(false);
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  const { clearNotifications } = useContext(NotificationContext); 

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
    //console.log("1",cityName);

    // Sprawdzenie, czy nazwa miasta zawiera tylko litery, spacje lub myślniki
    const cityRegex = /^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s-]+$/;
    if (!cityRegex.test(cityName)) {
      alert('Nazwa miasta może zawierać tylko litery, spacje lub myślniki.');
      return;
    }
    //console.log("2",cityName);
    cityName = await normalizeCityName(cityName);
    //console.log("3",cityName);
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
    setFormError(false);

    // Walidacja: co najmniej jedna opcja płatności i jedna opcja dostawy musi być zaznaczona
    if (!formData.allows_online_payment && !formData.allows_cash_payment) {
      setFormError(true);
      setModalMessage('Musisz wybrać co najmniej jedną opcję płatności.');
      setModalIsOpen(true);
      return;
    }
    if (!formData.allows_delivery && !formData.allows_pickup) {
      setFormError(true);
      setModalMessage('Musisz wybrać co najmniej jedną opcję dostawy.');
      setModalIsOpen(true);
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
        setModalMessage(response.data.message);
        setModalIsOpen(true);
        //alert(response.data.message);
      } else {
        //alert('Dane restauracji zostały zaktualizowane pomyślnie!');
        setModalMessage('Dane restauracji zostały zaktualizowane pomyślnie!');
        setModalIsOpen(true);
      }
    } catch (error) {
      //console.error('Error updating restaurant details:', error);
      if (error.response && error.response.data && error.response.data.message) {
        setFormError(true);
        setModalMessage(error.response.data.message);
        //alert(error.response.data.message);
      } else {
        setFormError(true);
        setModalMessage('Nie udało się zaktualizować danych restauracji.');
        //alert('Nie udało się zaktualizować danych restauracji.');
      }
      setModalIsOpen(true);
    }
  };

  // Jeśli wystąpił błąd podczas ładowania danych
  if (error) {
    return <div>{error}</div>;
  }

  // Jeśli dane restauratora nie są jeszcze dostępne

  if (!profileData) {
    return (
      <div className="flex justify-center items-center">
        <img src={loadingGif} alt="Loading..." />
      </div>
    );
  }

  const { first_name, last_name, email, phone_number, restaurant } = profileData;

  const handleLogout = () => {
    dispatch(setUserToken(null)); // Usuwamy token z Redux
    sessionStorage.removeItem('authToken'); // Usuwamy token z sessionStorage
    clearNotifications();
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

  const handleModalClose = () => {
    setModalIsOpen(false);
    setIsSubmitting(false);
    setError(false);
  };

  return (
    <div>
      {/*<Notifications token={sessionStorage.getItem('authToken')} userRole={'restaurateur'} />*/}
      <h3 className="mt-10 text-xl font-medium text-center text-gray-800 dark:text-gray-700">Panel restauratora</h3>
      <div className="font-[sans-serif] w-full max-w-xl mx-auto overflow-hidden bg-white rounded-lg shadow-md dark:bg-gray-800 px-6 py-4">
        <h3 className="mt-10 text-xl font-medium text-center text-gray-800 dark:text-gray-700">Restaurator</h3>
        <ul className=" text-gray-800 list-disc list-inside dark:text-gray-700">
          <li>Imię: {first_name}</li>
          <li>Nazwisko: {last_name}</li>
          <li>Email: {email}</li>
        </ul>
        <h3 className="mt-2 text-xl font-medium text-center text-gray-800 dark:text-gray-700">Restauracja</h3>
        <ul className=" text-gray-800 list-disc list-inside dark:text-gray-700">
        <li>Nazwa: {restaurant.name}</li>
        <li>Telefon lokalu: {restaurant.phone_number}</li>
        <li>Opis: {restaurant.description}</li>
        <RestaurantAddress profileData={profileData} />
        </ul>
      </div>
      
      <h3 className="mt-2 text-xl font-medium text-center text-gray-800 dark:text-gray-700">Ustawienia restauracji</h3>
      <div className="font-[sans-serif] w-full max-w-xl mx-auto overflow-hidden bg-white rounded-lg shadow-md dark:bg-gray-800 px-6 py-4">
        <form onSubmit={handleSubmit} className="text-gray-800 dark:text-gray-700">
        <div>
          <label>
            <input
              type="checkbox"
              name="allows_online_payment"
              checked={formData.allows_online_payment}
              onChange={handleChange}
              class="accent-gray-500"
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
              class="accent-gray-500"
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
              class="accent-gray-500"
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
              class="accent-gray-500"
            />
            Odbiór osobisty
          </label>
        </div>
        <div>
          <label className="flex items-center justify-between w-full">
            <span>Minimalna kwota zamówienia:</span>
            <input
              type="number"
              name="minimum_order_amount"
              value={formData.minimum_order_amount}
              onChange={handleChange}
              min="0"
              max="10000"
              className="appearance-none block w-32 px-4 py-1.5 text-gray-700 placeholder-gray-500 bg-white border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 focus:border-gray-400 dark:focus:border-gray-300 focus:ring-opacity-40 focus:outline-none focus:ring focus:ring-gray-300"
              style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
            />
          </label>
        </div>
          {/*formError && <p style={{ color: 'red' }}>{formError}</p>*/}
          <div className="mt-2 text-center font-[sans-serif]">
            <button type="submit" className=" px-6 py-2 text-sm font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-gray-800 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring focus:ring-gray-300 focus:ring-opacity-50">
              Zapisz
            </button>
          </div>
        </form>

        <Modal
          isOpen={modalIsOpen}
          onRequestClose={() => setModalIsOpen(false)}
          contentLabel="formError Modal"
          className="fixed inset-0 z-10 overflow-y-auto flex items-center justify-center transition duration-300 ease-out transform"
          overlayClassName="fixed inset-0 bg-black bg-opacity-50 transition duration-300 ease-out"
        >
          <div className="relative inline-block px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl rtl:text-right dark:bg-gray-900 sm:my-8 sm:align-middle sm:max-w-sm sm:w-full sm:p-6">
            <div className="mt-2 text-center">
              {(formError || error) ? (
                  <h3 className="text-lg font-medium leading-6 text-red-800 capitalize dark:text-white" id="modal-title">Błąd</h3>
                ) : (<h3 className="text-lg font-medium leading-6 text-gray-800 capitalize dark:text-white" id="modal-title">Sukces!</h3>)}
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{modalMessage}</p>
            </div>
            <div className="mt-5 sm:flex sm:items-center sm:justify-center">
              <div className="sm:flex sm:items-center">
                <button
                  onClick={handleModalClose}
                  className="w-full px-4 py-2 mt-2 text-sm font-medium tracking-wide text-gray-700 capitalize transition-colors duration-300 transform border border-gray-200 rounded-md sm:mt-0 sm:w-auto sm:mx-2 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-800 hover:bg-gray-100 focus:outline-none focus:ring focus:ring-gray-300 focus:ring-opacity-40"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </Modal>

        <h3 className="mt-2 text-xl font-medium text-center text-gray-800 dark:text-gray-700">Miasta z dostawą:</h3>
        {formData.allows_delivery && deliveryCities.length === 0 && (
          <p>Dodaj miasta, które dostawa obsługuje</p>
        )}
        <ul className="list-disc pl-4 text-gray-800 dark:text-gray-700">
          {deliveryCities.map(city => (
            <li key={city.id}
            className="flex items-center justify-between mb-2">
              <span className="list-item">
              {city.name}
              </span>
              <button onClick={() => handleRemoveCity(city.id)}
                className="ml-4 px-4 sm:mx-2 w-16 py-1.5 text-sm font-medium dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-800 tracking-wide text-gray-700 capitalize transition-colors duration-300 transform border border-gray-200 rounded-md hover:bg-gray-100 focus:outline-none focus:ring focus:ring-gray-300 focus:ring-opacity-40"
                >Usuń</button>
            </li>
          ))}
          {deliveryCities.length === 0 && (
            <li>Brak miast z dostawą</li>
          )}
        </ul>

        <div className="flex items-center space-x-2 mt-2 pr-2">
          <input
            placeholder='Nowe miasto'
            type="text"
            name="delivery_city"
            value={formData.delivery_city}
            onChange={handleChange}
            className="flex-grow px-4 py-2 text-gray-700 placeholder-gray-500 bg-white border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 focus:border-gray-400 dark:focus:border-gray-300 focus:ring-opacity-40 focus:outline-none focus:ring focus:ring-gray-300"
          />
          <button type="button" onClick={handleAddCity} className="px-6 py-2 text-sm font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-gray-800 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring focus:ring-gray-300 focus:ring-opacity-50">Dodaj miasto</button>
        </div>
      </div>

      <h3 className="mt-2 text-xl font-medium text-center text-gray-800 dark:text-gray-700">Zdjęcie profilowe restauracji</h3>
      <div className="font-[sans-serif] w-full max-w-xl mx-auto overflow-hidden bg-white rounded-lg shadow-md dark:bg-gray-800 px-6 py-4">
        {restaurant.image ? (
          // Jeśli zdjęcie istnieje, wyświetl je z Cloudinary
          <div>
            <img
              src={`${cloudinaryBaseUrl}${restaurant.image}`}
              alt={restaurant.name}
              style={{ width: '300px', height: 'auto' }}
              className="h-auto rounded-lg mt-2 mx-auto"
            />
            <h3 className="mt-2 text-xl font-medium text-center text-gray-800 dark:text-gray-700">Zmień zdjęcie</h3>
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
              className="h-auto rounded-lg mt-2 mx-auto"
            />
            <h3 className="mt-2 text-xl font-medium text-center text-gray-800 dark:text-gray-700">Dodaj zdjęcie</h3>
            <UploadImage
              onUploadSuccess={handleUploadSuccess}
              metadata={{ id: restaurant.id, name: 'main' }}
            />
          </div>
        )}
      </div>
      
      <RestaurantOrders restaurantId={profileData.restaurant.id} /> 
      <ArchivedRestaurantOrders restaurantId={profileData.restaurant.id} /> 
      <RestaurantProducts restaurantId={restaurant.id} key={productsUpdated} />
      <AddProduct restaurantId={restaurant.id} onProductAdded={handleProductsUpdated} />

      <ManageTags restaurantId={restaurant.id} />

      <div className="mt-4 mb-10 text-center font-[sans-serif]">
        <button onClick={handleLogout} className=" px-6 py-2 text-sm font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-gray-800 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring focus:ring-gray-300 focus:ring-opacity-50">
        Wyloguj
        </button>
      </div>
    </div>
  );
};

export default RestaurantProfile;
