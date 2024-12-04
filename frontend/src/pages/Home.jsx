import React, { useEffect, useState } from "react";

const Home = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  // Podstawowy URL do Cloudinary
  const cloudinaryBaseUrl = "https://res.cloudinary.com/dljau5sfr/";

  useEffect(() => {
    // Fetch restaurants from API
    fetch("http://localhost:8000/api/restaurant/list") // Upewnij się, że endpoint jest poprawny
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
  }, []);

  if (loading) {
    return <p>Błąd połączenia, przepraszamy.</p>;
  }

  return (
    <div>
      <h1>Welcome to the Home Page!</h1>
      <h2>Restaurant List</h2>
      <ul>
        {restaurants.map((restaurant) => (
          <li key={restaurant.id}>
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
                    <li key={tag.id} style={{ display: "inline", marginRight: "10px" }}>
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
