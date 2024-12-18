import React, { useEffect, useState } from "react";
import UserListProducts from "../components/UserListProducts.jsx";
import placeholderImage from '../assets/Placeholder.png';

const Home = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isRendered, setIsRendered] = useState(false); //userlist
  const [products, setProducts] = useState(null);
  const [error, setError] = useState(null);

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

  const handleRestaurantClick = (restaurant) => {
    console.log("handleRestaurantClick");
    //const currentScroll = window.scrollY;
    //console.log("Zapisuję pozycję scrolla:", currentScroll);
    // Zapisz aktualną pozycję scrolla przed przejściem
    //setScrollPosition(window.scrollY);
    setSelectedRestaurant(restaurant);
    setScrollPosition(window.scrollY);
  };

  const handleBackClick = () => {
    console.log("handleBackClick");
    //console.log("Przywracam pozycję scrolla:", scrollPosition);
    setSelectedRestaurant(null);
    setScrollPosition(window.scrollY);
    
    console.log("scrollFun");
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
      <h2>Restaurant List</h2>
      <ul style={{ listStyleType: "none", padding: 0 }}>
        {restaurants.map((restaurant) => (
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
            <p>{restaurant.address}</p>

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