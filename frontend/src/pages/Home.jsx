import React, { useEffect, useState, useRef } from "react";
import UserListProducts from "../components/UserListProducts.jsx";
import placeholderImage from '../assets/Placeholder.png';

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
        <div onRendered={handleRendered}>
          <h1>{selectedRestaurant.name}</h1>
          <div>Brak produktów do wyświetlenia.</div>
          <button onClick={handleBackClick}>Wróć</button>
        </div>
      );
    }
    return (
      <div>
        <h1>{selectedRestaurant.name}</h1>
        {products && <UserListProducts products={products} onRendered={handleRendered} />}
        <button onClick={handleBackClick}>Wróć</button>
      </div>
    );
  }

  return (
    <div>
      
      <div>
        <h3>Restauracje w pobliżu:</h3>
        <input
          type="text"
          list="cities"
          value={selectedCity}
          onChange={handleCityChange}
          onKeyDown={handleKeyDown}
          placeholder="Wyszukaj miasto"
        />
        <datalist id="cities">
          {cities.map(city => (
            <option key={city} value={city} />
          ))}
        </datalist>
        <button onClick={handleCitySelect}>Szukaj</button>
      </div>
      {loading && <p>Ładowanie...</p>}
      {error && <p>{error}</p>}
      {!loading && !error && restaurants.length > 0 && (
        <>
          <div>
            <h3>Filtruj według tagów</h3>
            <ul style={{ listStyleType: 'none', padding: 0 }}>
              {tags.map(tag => (
                <li key={tag.id}>
                  <label>
                    <input
                      type="checkbox"
                      value={tag.id}
                      onChange={() => handleTagChange(tag.id)}
                    />
                    {tag.name}
                  </label>
                </li>
              ))}
            </ul>
          </div>
          <h2>Lista Restauracji:</h2>
          <ul style={{ listStyleType: "none", padding: 0 }}>
            {filteredRestaurants.map((restaurant) => (
              <li
                key={restaurant.id}
                onClick={() => {handleRestaurantClick(restaurant); setIsRendered(true);}}
                style={{
                  cursor: "pointer",
                  border: "1px solid #ddd",
                  borderRadius: "10px",
                  padding: "20px",
                  marginBottom: "10px",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f9f9f9")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
              >
                <h2>{restaurant.name}</h2>
                <p>{restaurant.description}</p>
                {restaurant.address && restaurant.address.map((addr) => (
                  <p key={addr.id}>
                    {addr.street} {addr.building_number}, {addr.apartment_number ? `${addr.apartment_number}, ` : ''}{addr.postal_code} {addr.city}
                  </p>
                ))}
                {(restaurant.allows_cash_payment || restaurant.allows_online_payment) && (
                  <p>
                    {restaurant.allows_cash_payment && "Płatność na miejscu/przy odbiorze"}
                    {restaurant.allows_cash_payment && restaurant.allows_online_payment && ", "}
                    {restaurant.allows_online_payment && "Płatność online"}
                  </p>
                )}
                {(restaurant.allows_delivery || restaurant.allows_pickup) && (
                  <p>
                    {restaurant.allows_delivery && "Dostawa"}
                    {restaurant.allows_delivery && restaurant.allows_pickup && ", "}
                    {restaurant.allows_pickup && "Odbiór osobisty"}
                  </p>
                )}
                {restaurant.minimum_order_amount > 0 && <p>Minimalna wartość zamówienia: {restaurant.minimum_order_amount} PLN</p>}
                {restaurant.minimum_order_amount == 0 && <p>Brak minimalnej wartości zamówienia</p>}
                <img
                  src={restaurant.image !== null ? `${cloudinaryBaseUrl}${restaurant.image}` : placeholderImage}
                  alt={restaurant.name}
                  style={{ width: "300px", height: "auto" }}
                />
                {restaurant.tags && restaurant.tags.length > 0 && (
                  <div style={{ marginTop: "10px" }}>
                    <ul>
                      {restaurant.tags.map((tag) => (
                        <li key={tag.id} style={{ display: "inline", marginRight: "10px"}}>
                          <span style={{ 
                            backgroundColor: "#f0f0f0", 
                            padding: "5px 10px", 
                            borderRadius: "5px" 
                          }}>
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