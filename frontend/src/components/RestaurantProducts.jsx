import React, { useState, useEffect } from "react";
import axios from "axios";

const RestaurantProducts = ({ restaurantId }) => {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8000/api/restaurant/${restaurantId}/products/`
        );
        setProducts(response.data);
      } catch (err) {
        setError(err.message || "Nieoczekiwany błąd.");
      }
    };

    fetchProducts();
  }, [restaurantId]);

  const deleteProduct = async (productId) => {
    try {
      const token = localStorage.getItem("access_token") || sessionStorage.getItem("authToken");
      if (!token) {
        throw new Error("Brak tokena uwierzytelniającego");
      }

      await axios.delete(`http://localhost:8000/api/restaurant/delete-product/${productId}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setProducts(products.filter((product) => product.id !== productId));
    } catch (err) {
      setError(err.message || "Nieoczekiwany błąd.");
    }
  };

  if (error) {
    return <div>Błąd: {error}</div>;
  }

  return (
    <div>
      <h2>Produkty</h2>
      <ul>
        {products.map((product) => (
          <li key={product.id}>
            <h3>{product.name}</h3>
            <p>{product.description || "Brak opisu"}</p>
              <p>Cena: {product.price} PLN</p>
              <p>{product.is_available ? "Dostępny" : "Niedostępny"}</p>
              <button onClick={() => deleteProduct(product.id)}>Usuń</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RestaurantProducts;