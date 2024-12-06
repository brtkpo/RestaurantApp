import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { setUserToken } from '../redux/actions';
import UploadImage from '../components/UploadImage';
import ManageTags from '../components/ManageTags';
import AddProduct from '../components/AddProduct';

const RestaurantProfile = () => {
  const dispatch = useDispatch();
  const [profileData, setProfileData] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

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
      } catch (error) {
        setError('Błąd podczas ładowania danych.');
        console.error(error);
      }
    };

    fetchProfileData();
  }, [navigate]);

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
          <UploadImage
            onUploadSuccess={handleUploadSuccess}
            metadata={{ id: restaurant.id, name: 'main' }}
          />
        </div>
      ) : (
        // Jeśli nie ma zdjęcia, umożliwiamy załadowanie nowego
        <UploadImage
          onUploadSuccess={handleUploadSuccess}
          metadata={{ id: restaurant.id, name: 'main' }}
        />
      )}

      <br />
      <ManageTags restaurantId={restaurant.id} />
      <AddProduct restaurantId={restaurant.id} />
      <button onClick={handleLogout}>Wyloguj</button>
    </div>
  );
};

export default RestaurantProfile;
