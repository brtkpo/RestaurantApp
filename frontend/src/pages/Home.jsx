import React, { useEffect, useState, useRef } from "react";
import UserListProducts from "../components/UserListProducts.jsx";
import placeholderImage from '../assets/Placeholder.png';
import loadingGif from '../assets/200w.gif'; 


const Home = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const scrollPositionRef = useRef(0);
  const [isRendered, setIsRendered] = useState(false); //userlist
  const [products, setProducts] = useState(null);
  const [error, setError] = useState(null);
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');

  const cloudinaryBaseUrl = "https://res.cloudinary.com/dljau5sfr/";

  const fetchRestaurants = async (city = '') => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/restaurant/list?city=${city}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Network response was not ok");
      }
      const data = await response.json();
      setRestaurants(data);
      setFilteredRestaurants(data);
      setLoading(false);
      setError(null);
      //console.log("Restaurants:", data);

      // Extract unique tags from restaurants
      const uniqueTags = [];
      data.forEach(restaurant => {
        restaurant.tags.forEach(tag => {
          if (!uniqueTags.some(t => t.id === tag.id)) {
            uniqueTags.push(tag);
          }
        });
      });
      setTags(uniqueTags);
    } catch (error) {
      console.error("There was a problem with the fetch operation:", error);
      setError(error.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/cities/");
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        setCities(data);
      } catch (error) {
        console.error("There was a problem with the fetch operation:", error);
      }
    };

    fetchCities();
  }, []);

  const handleTagChange = (tagId) => {
    const newSelectedTags = selectedTags.includes(tagId)
      ? selectedTags.filter(id => id !== tagId)
      : [...selectedTags, tagId];
    setSelectedTags(newSelectedTags);

    filterRestaurants(selectedCity, newSelectedTags);
  };

  const handleCityChange = (e) => {
    setSelectedCity(e.target.value);
  };

  const handleCitySelect = () => {
    fetchRestaurants(selectedCity);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleCitySelect();
    }
  };

  const filterRestaurants = (city, tags) => {
    let filtered = restaurants;

    if (city) {
      filtered = filtered.filter(restaurant =>
        restaurant.address.some(addr => addr.city.toLowerCase() === city.toLowerCase())
      );
    }

    if (tags.length > 0) {
      filtered = filtered.filter(restaurant =>
        restaurant.tags.some(tag => tags.includes(tag.id))
      );
    }

    setFilteredRestaurants(filtered);
  };

  const handleRestaurantClick = (restaurant) => {
    //console.log("handleRestaurantClick");
    scrollPositionRef.current = window.scrollY; // Zapisz aktualną pozycję scrolla do useRef
    //console.log("scrollPositionRef.current", scrollPositionRef.current);
    //console.log("window.scrollY", window.scrollY);
    setSelectedRestaurant(restaurant);
    window.scrollTo(0, 0);
  };

  const handleBackClick = () => {
    //console.log("handleBackClick");
    setSelectedRestaurant(null);
  };

  useEffect(() => {
    if (!selectedRestaurant && scrollPositionRef.current > 0) {
      window.scrollTo(0, scrollPositionRef.current); // Przywróć pozycję scrolla z useRef
      scrollPositionRef.current = 0; // Resetuj pozycję scrolla
    }
  }, [selectedRestaurant, filteredRestaurants]);

  useEffect(() => {
    setIsRendered(true);
    if (selectedRestaurant) {
      const fetchProducts = async () => {
        try {
          const response = await fetch(
            `http://localhost:8000/api/restaurant/${selectedRestaurant.id}/products/`
          );
          if (!response.ok) {
            throw new Error("Nie udało się załadować produktów.");
          }
          const data = await response.json();
          setProducts(data);
        } catch (err) {
          console.error(err);
          setError(err.message || "Nieoczekiwany błąd.");
        } finally {
          setIsRendered(false);
        }
      };

      fetchProducts();
    }
  }, [selectedRestaurant]);

  const handleRendered = () => {
    setIsRendered(true);
  };

  if (selectedRestaurant && isRendered === false) {
    if (products && products.length === 0) {
      return (
        <div>
          <h3 className="mt-10 text-xl font-medium text-center text-gray-800 dark:text-gray-700">{selectedRestaurant.name}</h3>
          <div onRendered={handleRendered} className="mt-2 font-[sans-serif] w-full max-w-xl mx-auto overflow-hidden bg-white rounded-lg shadow-md dark:bg-gray-800 px-6 py-4 flex flex-col items-center justify-center">
              <div>Brak produktów do wyświetlenia.</div>
              <button onClick={handleBackClick} className="mt-2 px-6 py-2 text-sm font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-gray-800 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring focus:ring-gray-300 focus:ring-opacity-50">
                Wróć
              </button>
            </div>
        </div>
      );
    }
    return (
      <div>
        <h3 className="mb-4 mt-10 text-xl font-medium text-center text-gray-800 dark:text-gray-700">{selectedRestaurant.name}</h3>
        {products && <UserListProducts products={products} onRendered={handleRendered} />}

        <div className="mt-2 mb-10 text-center">
          <button onClick={handleBackClick} className="px-6 py-2 text-sm font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-gray-800 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring focus:ring-gray-300 focus:ring-opacity-50">
            Wróć
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="mt-10 text-xl font-medium text-center text-gray-800 dark:text-gray-700">Wyszukaj restaurację:</h3>
      <div className="font-[sans-serif] w-full max-w-xl mx-auto overflow-hidden bg-white rounded-lg shadow-md dark:bg-gray-800 px-6 py-4 flex items-center space-x-2">
        <input
          type="text"
          list="cities"
          value={selectedCity}
          onChange={handleCityChange}
          onKeyDown={handleKeyDown}
          placeholder="Wyszukaj miasto"
          className="flex-grow px-4 py-2 text-gray-700 placeholder-gray-500 bg-white border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 focus:border-gray-400 dark:focus:border-gray-300 focus:ring-opacity-40 focus:outline-none focus:ring focus:ring-gray-300"
        />
        <datalist id="cities">
          {cities.map(city => (
            <option key={city} value={city} />
          ))}
        </datalist>
        <button onClick={handleCitySelect} className="w-15 px-6 py-2 text-sm font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-gray-800 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring focus:ring-gray-300 focus:ring-opacity-50">
          Szukaj
        </button>
      </div>
      {loading && (
        <div className="flex justify-center items-center">
          <img src={loadingGif} alt="Loading..." />
        </div>
      )}
      {error && <p>{error}</p>}
      {!loading && !error && restaurants.length > 0 && (
        <>
          <div>
            <h3 className="mt-2 text-xl font-medium text-center text-gray-800 dark:text-gray-700">Filtruj według tagów:</h3>
            <div className="mb-4 font-[sans-serif] w-full max-w-xl mx-auto overflow-hidden bg-white rounded-lg shadow-md dark:bg-gray-800 px-6 py-4 flex items-center space-x-2">
              <ul style={{ listStyleType: 'none', padding: 0 }}>
                {tags.map(tag => (
                  <li key={tag.id}>
                    <label class="relative flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        value={tag.id}
                        onChange={() => handleTagChange(tag.id)}
                        class="mr-1 w-4 h-4 accent-gray-600 text-gray-600 bg-gray-100 border-gray-300 focus:ring-gray-500 dark:focus:ring-gray-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                      {tag.name}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <ul className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3 list-none pt-2 pb-4 px-4 mx-4">
            {filteredRestaurants.map((restaurant) => (
              <li
                key={restaurant.id}
                onClick={() => { handleRestaurantClick(restaurant); setIsRendered(true); }}
                className="cursor-pointer border border-gray-300 rounded-lg p-5 transition duration-200 ease-in-out transform hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <h3 className="mt-2 text-xl font-medium text-center text-gray-800 dark:text-gray-700">{restaurant.name}</h3>
                <ul className="text-gray-800 list-disc list-inside dark:text-gray-700">
                  <li>{restaurant.description}</li>
                  {restaurant.address && restaurant.address.map((addr) => (
                    <li key={addr.id}>
                      {addr.street} {addr.building_number}, {addr.apartment_number ? `${addr.apartment_number}, ` : ''}{addr.postal_code} {addr.city}
                    </li>
                  ))}
                  {(restaurant.allows_cash_payment || restaurant.allows_online_payment) && (
                    <li>
                      {restaurant.allows_cash_payment && "Płatność na miejscu/przy odbiorze"}
                      {restaurant.allows_cash_payment && restaurant.allows_online_payment && ", "}
                      {restaurant.allows_online_payment && "Płatność online"}
                    </li>
                  )}
                  {(restaurant.allows_delivery || restaurant.allows_pickup) && (
                    <li>
                      {restaurant.allows_delivery && "Dostawa"}
                      {restaurant.allows_delivery && restaurant.allows_pickup && ", "}
                      {restaurant.allows_pickup && "Odbiór osobisty"}
                    </li>
                  )}
                  {restaurant.minimum_order_amount > 0 && <li>Minimalna wartość zamówienia: {restaurant.minimum_order_amount} PLN</li>}
                  {restaurant.minimum_order_amount == 0 && <li>Brak minimalnej wartości zamówienia</li>}
                </ul>
                <img
                  src={restaurant.image !== null ? `${cloudinaryBaseUrl}${restaurant.image}` : placeholderImage}
                  alt={restaurant.name}
                  className="h-auto rounded-lg my-2 mx-auto"
                  style={{ width: "300px", height: "auto" }}
                />
                {restaurant.tags && restaurant.tags.length > 0 && (
                  <div className="mt-4">
                    <ul>
                      {restaurant.tags.map((tag) => (
                        <li key={tag.id} style={{ display: "inline" }}>
                          <span
                            className="mt-2 mr-1 px-4 sm:mx-2 w-full py-2.5 text-sm font-medium dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-800 tracking-wide text-gray-700 capitalize transition-colors duration-300 transform border border-gray-200 rounded-md hover:bg-gray-100 focus:outline-none focus:ring focus:ring-gray-300 focus:ring-opacity-40"
                          >
                            {tag.name}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default Home;