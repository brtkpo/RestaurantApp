import React, { useState, useEffect } from "react";
import axios from "axios";
import EditProduct from "./EditProduct";

const RestaurantProducts = ({ restaurantId }) => {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const token = sessionStorage.getItem('authToken');

  const fetchProducts = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8000/api/restaurant/${restaurantId}/all-products/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      setProducts(response.data);
    } catch (err) {
      setError(err.message || "Nieoczekiwany błąd.");
    }
  };
    
  useEffect(() => {
    

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

  const handleEdit = (productId) => {
    setEditingProduct(productId);
  };

  const handleUpdate = () => {
    setEditingProduct(null);
    // Fetch products again to update the list
    fetchProducts();
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
              <button onClick={() => handleEdit(product.id)}>Edytuj</button>
          </li>
        ))}
      </ul>
      {editingProduct && (
        <EditProduct
          restaurantId={restaurantId}
          productId={editingProduct}
          onClose={() => setEditingProduct(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
};

export default RestaurantProducts;