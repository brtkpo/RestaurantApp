import React, { useState, useEffect } from "react";
import axios from "axios";
import EditProduct from "./EditProduct";
import placeholderImage from '../assets/Placeholder.png';

const RestaurantProducts = ({ restaurantId }) => {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [currentPage, setCurrentPage] = useState(1); // Bieżąca strona
  const [pageSize] = useState(2); // Liczba produktów na stronie
  const token = sessionStorage.getItem('authToken');

  const cloudinaryBaseUrl = "https://res.cloudinary.com/dljau5sfr/";

  // Funkcja do pobrania produktów
  const fetchProducts = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8000/api/restaurant/${restaurantId}/all-products/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      
      //console.log("Odpowiedź z API:", response.data);
      setProducts(response.data);
    } catch (err) {
      setError(err.message || "Nieoczekiwany błąd.");
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [restaurantId]);

  // Funkcja do obliczenia produktów na danej stronie
  const paginateProducts = (products, currentPage, pageSize) => {
    const startIndex = (currentPage - 1) * pageSize;
    return products.slice(startIndex, startIndex + pageSize);
  };

  // Funkcja do zmiany strony
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const deleteProduct = async (productId, productName) => {
    const confirm = window.confirm(`Czy na pewno chcesz usunąć produkt: ${productName}?`);
    if (!confirm) return;

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
    fetchProducts(); // Po edycji pobierz produkty ponownie
  };

  // Zmienne do paginacji
  const paginatedProducts = paginateProducts(products, currentPage, pageSize);
  const totalPages = Math.ceil(products.length / pageSize); // Oblicz liczbę stron

  if (error) {
    return <div>Błąd: {error}</div>;
  }

  return (
    <div>
      <h2>Produkty</h2>
      <ul>
        {paginatedProducts.map((product) => (
          <li key={product.id}>
            <h3>{product.name}</h3>
            <p>{product.description || "Brak opisu"}</p>
            <p>Cena: {product.price} PLN</p>
            <p>{product.is_available ? "Dostępny" : "Niedostępny"}</p>
            <p>

            </p>
            <img
                src={product.image ? `${cloudinaryBaseUrl}${product.image}` : placeholderImage}
                alt={product.name}
                style={{ width: "300px", height: "auto" }}
              />
              <div style={{ marginTop: "2px" }}>
                <button onClick={() => deleteProduct(product.id, product.name)}>Usuń</button>
                <button onClick={() => handleEdit(product.id)}>Edytuj</button>
              </div>
            
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

      {/* Przyciski nawigacji */}
      <div>
        <button 
          onClick={() => handlePageChange(currentPage - 1)} 
          disabled={currentPage === 1} // Wyłącz przycisk, jeśli jesteśmy na pierwszej stronie
        >
          Poprzednia strona
        </button>
        <span>{`Strona ${currentPage} z ${totalPages}`}</span>
        <button 
          onClick={() => handlePageChange(currentPage + 1)} 
          disabled={currentPage === totalPages} // Wyłącz przycisk, jeśli jesteśmy na ostatniej stronie
        >
          Następna strona
        </button>
      </div>
    </div>
  );
};

export default RestaurantProducts;
