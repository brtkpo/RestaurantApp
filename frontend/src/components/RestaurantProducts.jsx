import React, { useState, useEffect } from "react";
import axios from "axios";
import EditProduct from "./EditProduct";
import placeholderImage from '../assets/Placeholder.png';

const RestaurantProducts = ({ restaurantId }) => {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 2;
  const token = sessionStorage.getItem('authToken');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const cloudinaryBaseUrl = "https://res.cloudinary.com/dljau5sfr/";

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
    fetchProducts();
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const indexOfLastProduct = currentPage * pageSize;
  const indexOfFirstProduct = indexOfLastProduct - pageSize;
  const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);

  const totalPages = Math.ceil(products.length / pageSize);

  const openEditModal = () => {
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
  };

  if (error) {
    return <div>Błąd: {error}</div>;
  }

  if (products.length === 0) {
    return <div>Brak produktów dla restauracji.</div>;
  }

  return (
    <div>
      <h3 className="mt-2 text-xl font-medium text-center text-gray-800 dark:text-gray-700">Produkty</h3>
      <div className="font-[sans-serif] w-full max-w-xl mx-auto overflow-hidden bg-white rounded-lg shadow-md dark:bg-gray-800 px-6 py-4">
        <ul>
          {currentProducts.map((product) => (
            <li key={product.id}>
              <h3 className="text-xl font-medium text-center text-gray-800 dark:text-gray-700">{product.name}</h3>
              <ul className="text-gray-800 list-disc list-inside dark:text-gray-700">
                <li>{product.description || "Brak opisu"}</li>
                <li>Cena: {product.price} PLN</li>
                <li>{product.is_available ? "Dostępny" : "Niedostępny"}</li>
              </ul>

              <img
                src={product.image ? `${cloudinaryBaseUrl}${product.image}` : placeholderImage}
                alt={product.name}
                style={{ width: "300px", height: "auto" }}
                className="h-auto rounded-lg mt-2 mx-auto"
              />
              <div className="mt-4 sm:flex sm:items-center sm:justify-between sm:mt-6 sm:-mx-2">
                <button onClick={() => deleteProduct(product.id, product.name)} className="px-4 sm:mx-2 w-full py-2.5 text-sm font-medium dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-800 tracking-wide text-gray-700 capitalize transition-colors duration-300 transform border border-gray-200 rounded-md hover:bg-gray-100 focus:outline-none focus:ring focus:ring-gray-300 focus:ring-opacity-40">
                  Usuń
                </button>
                <button onClick={() => {handleEdit(product.id); openEditModal();}} className="px-4 sm:mx-2 w-full py-2.5 text-sm font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-gray-800 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring focus:ring-gray-300 focus:ring-opacity-50">
                  Edytuj
                </button>
              </div>
            </li>
          ))}
        </ul>

        {editingProduct && (
          <EditProduct
            isOpen={isEditModalOpen}
            restaurantId={restaurantId}
            productId={editingProduct}
            onClose={() => setEditingProduct(null)}
            onRequestClose={closeEditModal}
            onUpdate={handleUpdate}
          />
        )}

        <div className="flex justify-center mt-4">
          {Array.from({ length: totalPages }, (_, index) => (
            <button
              key={index + 1}
              onClick={() => paginate(index + 1)}
              className={`px-4 py-2 mx-1 text-sm font-medium ${currentPage === index + 1 ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-800'} rounded-lg hover:bg-gray-700 focus:outline-none focus:ring focus:ring-gray-300 focus:ring-opacity-50`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RestaurantProducts;
