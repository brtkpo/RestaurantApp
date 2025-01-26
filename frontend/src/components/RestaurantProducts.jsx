import React, { useState, useEffect } from "react";
import axios from "axios";
import EditProduct from "./EditProduct";
import placeholderImage from '../assets/Placeholder.png';
import Modal from 'react-modal';


const RestaurantProducts = ({ restaurantId }) => {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 2;
  const token = sessionStorage.getItem('authToken');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [confirmDeleteProduct, setConfirmDeleteProduct] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);

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

  const handleDelete = (productId) => {
    console.log('Product to deleteID:', productId);
    setProductToDelete(productId);
    setIsDeleteModalOpen(true);
    
    console.log('Product to delete:', productToDelete);
  };

  const deleteProduct = async (productToDelete) => {
    //if (!confirmDeleteProduct) return;
    //setConfirmDeleteProduct(false);
    console.log('Product to delete:', productToDelete);
    try {
      const token = localStorage.getItem("access_token") || sessionStorage.getItem("authToken");
      if (!token) {
        throw new Error("Brak tokena uwierzytelniającego");
      }

      await axios.delete(`http://localhost:8000/api/restaurant/delete-product/${productToDelete}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      const updatedProducts = products.filter((product) => product.id !== productToDelete);
      setProducts(updatedProducts);

      const totalPages = Math.ceil(updatedProducts.length / pageSize);
      if (currentPage > totalPages) {
        setCurrentPage(totalPages);
      }

    } catch (err) {
      setError(err.message || "Nieoczekiwany błąd.");
    }
    setIsDeleteModalOpen(false); 
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
    return( 
      <div>
        <h3 className="mt-2 text-xl font-medium text-center text-gray-800 dark:text-gray-700">Produkty</h3>
          <div className="font-[sans-serif] w-full max-w-xl mx-auto overflow-hidden bg-white rounded-lg shadow-md dark:bg-gray-800 px-6 py-4">
            <p>Brak produktów dla restauracji.</p>
          </div>
      </div>
     );
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
                <button onClick={() => handleDelete(product.id)} className="px-4 sm:mx-2 w-full py-2.5 text-sm font-medium dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-800 tracking-wide text-gray-700 capitalize transition-colors duration-300 transform border border-gray-200 rounded-md hover:bg-gray-100 focus:outline-none focus:ring focus:ring-gray-300 focus:ring-opacity-40">
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

      {isDeleteModalOpen && (
        <Modal
          isOpen={isDeleteModalOpen}
          onRequestClose={() => setIsDeleteModalOpen(false)}
          contentLabel="Error Modal"
          className="fixed inset-0 z-10 overflow-y-auto flex items-center justify-center transition duration-300 ease-out transform"
          overlayClassName="fixed inset-0 bg-black bg-opacity-50 transition duration-300 ease-out"
        >
          <div className="relative inline-block px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl rtl:text-right dark:bg-gray-900 sm:my-8 sm:align-middle sm:max-w-sm sm:w-full sm:p-6">
          <h3 className="mt-2 text-xl font-medium text-center text-gray-800 dark:text-gray-700">Usunąć produkt?</h3>
            <div className="mt-4 sm:flex sm:items-center sm:justify-between sm:mt-6 sm:-mx-2">
              <button onClick={() => {setProductToDelete(null); setIsDeleteModalOpen(false);}} className="px-4 sm:mx-2 w-full py-2.5 text-sm font-medium dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-800 tracking-wide text-gray-700 capitalize transition-colors duration-300 transform border border-gray-200 rounded-md hover:bg-gray-100 focus:outline-none focus:ring focus:ring-gray-300 focus:ring-opacity-40">
                Anuluj
              </button>
              <button onClick={() => {deleteProduct(productToDelete); setIsDeleteModalOpen(false); }} className="px-4 sm:mx-2 w-full py-2.5 text-sm font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-gray-800 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring focus:ring-gray-300 focus:ring-opacity-50">
                Usuń
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default RestaurantProducts;
