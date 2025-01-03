import React, { useEffect, useState } from "react";
import UserListProducts from "../components/UserListProducts.jsx";
import placeholderImage from '../assets/Placeholder.png';

const Home = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isRendered, setIsRendered] = useState(false); //userlist
  const [products, setProducts] = useState(null);
  const [error, setError] = useState(null);

  const cloudinaryBaseUrl = "https://res.cloudinary.com/dljau5sfr/";

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/restaurant/list");
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        setRestaurants(data);
        setFilteredRestaurants(data);
        setLoading(false);

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
      }
    };

    fetchRestaurants();
  }, []);

  //useEffect(() => {
  //  if (selectedRestaurant !== null) {
  //    setScrollPosition(window.scrollY);
  //  }
    //if (selectedRestaurant === null) {
    //  setTimeout(() => {
    //    window.scrollTo(0, scrollPosition);
    //  }, 0);
    //}
  //}, [selectedRestaurant]); //scrollPosition

  const handleTagChange = (tagId) => {
    const newSelectedTags = selectedTags.includes(tagId)
      ? selectedTags.filter(id => id !== tagId)
      : [...selectedTags, tagId];
    setSelectedTags(newSelectedTags);

    if (newSelectedTags.length === 0) {
      setFilteredRestaurants(restaurants);
    } else {
      const filtered = restaurants.filter(restaurant =>
        restaurant.tags.some(tag => newSelectedTags.includes(tag.id))
      );
      setFilteredRestaurants(filtered);
    }
  };

  const handleRestaurantClick = (restaurant) => {
    console.log("handleRestaurantClick");
    //const currentScroll = window.scrollY;
    //console.log("Zapisuję pozycję scrolla:", currentScroll);
    // Zapisz aktualną pozycję scrolla przed przejściem
    //setScrollPosition(window.scrollY);
    setScrollPosition(window.scrollY);
    console.log("scrollPosition", scrollPosition);
    setSelectedRestaurant(restaurant);
    //setScrollPosition(window.scrollY);
    window.scrollTo(0, 0);
  };

  const handleBackClick = () => {
    console.log("handleBackClick");
    console.log("scrollPositionhandleBackClick", scrollPosition);
    //console.log("Przywracam pozycję scrolla:", scrollPosition);
    setSelectedRestaurant(null);
    setScrollPosition(window.scrollY);
    
    //console.log("scrollFun");
    if (scrollPosition > 0) {
      const scrollToPosition = () => {
        const currentScrollY = window.scrollY;
        const difference = scrollPosition - currentScrollY;
        const increment = Math.sign(difference) * Math.min(Math.abs(difference), 1000); // 10
        window.scrollTo(0, currentScrollY + increment);

        if (Math.abs(difference) > 0) {
          requestAnimationFrame(scrollToPosition);
        }
      };
      requestAnimationFrame(scrollToPosition);
    }
    console.log("scrollPositionfun", scrollPosition);
    setScrollPosition(0);
    //setSelectedRestaurant(null);
    // Przywróć pozycję scrolla
    //setTimeout(() => {
    //  window.scrollTo(0, scrollPosition);
    //}, 0); // Używamy timeoutu, aby upewnić się, że scrollowanie nastąpi po renderze
  };

  //useEffect(() => {
  //  console.log("useEffectScrollPosition");
  //  if (scrollPosition > 0) {
  //    const scrollToPosition = () => {
  //      const currentScrollY = window.scrollY;
  //      const difference = scrollPosition - currentScrollY;
  //      const increment = Math.sign(difference) * Math.min(Math.abs(difference), 100); // 10
  //      window.scrollTo(0, currentScrollY + increment);

  //      if (Math.abs(difference) > 0) {
  //        requestAnimationFrame(scrollToPosition);
  //      }
  //    };

  //    requestAnimationFrame(scrollToPosition);
  //  }
  //}, [scrollPosition]); // Update scroll only when scrollPosition changes

  //if (loading) {
    //return <p>Błąd połączenia, przepraszamy.</p>;
  //}

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
        {products && <UserListProducts products={products} onRendered={handleRendered} />}{/*<UserListProducts restaurantId={selectedRestaurant.id} onRendered={handleRendered}/>*/}
        <button onClick={handleBackClick}>Wróć</button>
      </div>
    );
  }

  return (
    <div>
      {/*<h1>Welcome to the Home Page!</h1>*/}
      
      <h2>Lista Restauracji:</h2>
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
            {/* Sprawdzamy, czy jest dostępne zdjęcie */}

            <img
              src={restaurant.image !== null ? `${cloudinaryBaseUrl}${restaurant.image}` : placeholderImage}
              alt={restaurant.name}
              style={{ width: "300px", height: "auto" }}
            />


            {/* Wyświetlanie tagów */}
            {restaurant.tags && restaurant.tags.length > 0 && (
              <div style={{ marginTop: "10px" }}>
                {/*<h3>Tags:</h3>*/}
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
    </div>
  );
};

export default Home;