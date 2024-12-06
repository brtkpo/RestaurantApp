import React, { useEffect, useState } from "react";

const Home = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  const cloudinaryBaseUrl = "https://res.cloudinary.com/dljau5sfr/";

  useEffect(() => {
    //if (restaurants.length > 0) {
    //  setLoading(false);
    //  return;
    //}

    fetch("http://localhost:8000/api/restaurant/list") 
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        console.log(data);
        setRestaurants(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("There was a problem with the fetch operation:", error);
      });
  }, []); //[restaurants]

  useEffect(() => {
    if (selectedRestaurant === null) {
      // Przywróć scroll po renderze
      setTimeout(() => {
        window.scrollTo(0, scrollPosition);
      }, 0);
    }
  }, [selectedRestaurant]);

  const handleRestaurantClick = (restaurant) => {
    const currentScroll = window.scrollY;
    console.log("Zapisuję pozycję scrolla:", currentScroll);
    // Zapisz aktualną pozycję scrolla przed przejściem
    setScrollPosition(window.scrollY);
    setSelectedRestaurant(restaurant);
  };

  const handleBackClick = () => {
    console.log("Przywracam pozycję scrolla:", scrollPosition);
    setSelectedRestaurant(null);
    //setSelectedRestaurant(null);
    // Przywróć pozycję scrolla
    //setTimeout(() => {
    //  window.scrollTo(0, scrollPosition);
    //}, 0); // Używamy timeoutu, aby upewnić się, że scrollowanie nastąpi po renderze
  };

  if (loading) {
    //return <p>Błąd połączenia, przepraszamy.</p>;
  }

  if (selectedRestaurant) {
    return (
      <div>
        <h1>{selectedRestaurant.name}</h1>
        <button onClick={handleBackClick}>Wróć</button>
      </div>
    );
  }

  return (
    <div>
      <h1>Welcome to the Home Page!</h1>
      <h2>Restaurant List</h2>
      <ul style={{ listStyleType: "none", padding: 0 }}>
        {restaurants.map((restaurant) => (
          <li
            key={restaurant.id}
            onClick={() => handleRestaurantClick(restaurant)}
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
            <p>{restaurant.address}</p>

            {/* Sprawdzamy, czy jest dostępne zdjęcie */}
            {restaurant.image && (
              <img
                src={`${cloudinaryBaseUrl}${restaurant.image}`}
                alt={restaurant.name}
                style={{ width: "300px", height: "auto" }}
              />
            )}

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
