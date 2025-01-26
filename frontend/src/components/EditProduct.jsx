import React, { useState, useEffect } from "react";
import axios from "axios";
import UploadImage from './UploadImage';
import Modal from 'react-modal';

const EditProduct = ({ isOpen, restaurantId, productId, onClose, onUpdate, onRequestClose }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    is_available: true,
    image: "",
  });
  const [error, setError] = useState(null);
  const [imageBlob, setImageBlob] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const token = localStorage.getItem("access_token") || sessionStorage.getItem("authToken");
        if (!token) {
          throw new Error("Brak tokena uwierzytelniającego");
        }

        const response = await axios.get(`http://localhost:8000/api/restaurant/product/${productId}/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setFormData(response.data);
      } catch (err) {
        setError(err.message || "Nieoczekiwany błąd.");
      }
    };

    fetchProduct();
  }, [productId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("access_token") || sessionStorage.getItem("authToken");
      if (!token) {
        throw new Error("Brak tokena uwierzytelniającego");
      }

      await axios.put(`http://localhost:8000/api/restaurant/update-product/${productId}/`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      onUpdate();
      onClose();
    } catch (err) {
      setError(err.message || "Nieoczekiwany błąd.");
    }
  };

  const handleUploadSuccess = (uploadedImageData) => {
    setFormData((prevData) => ({
      ...prevData,
      image: uploadedImageData.path
    }));
  };

  if (error) {
    return <div>Błąd: {error}</div>;
  }

  return (
    <div>
      <Modal 
          isOpen={isOpen} 
          onRequestClose={onRequestClose} 
          contentLabel="Dodaj nowy adres" 
          shouldCloseOnOverlayClick={false}
          className="fixed inset-0 flex items-center justify-center overflow-auto"
          overlayClassName="fixed inset-0 bg-black bg-opacity-50"
          >
        <div className="font-[sans-serif] w-full max-w-sm mx-auto bg-white rounded-lg shadow-md dark:bg-gray-800 px-6 py-4 max-h-full overflow-y-auto">
          <h2>Edytuj Produkt</h2>
          <form onSubmit={handleSubmit}>
            <div>
              <label>Nazwa:</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label>Opis:</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
              ></textarea>
            </div>
            <div>
              <label>Cena:</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label>Dostępny:</label>
              <input
                type="checkbox"
                name="is_available"
                checked={formData.is_available}
                onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
              />
            </div>
            <UploadImage
                onUploadSuccess={handleUploadSuccess}
                metadata={{ id: restaurantId, name: productId + "_" + formData.name }}
              />
            
            <div className="mt-4 sm:flex sm:items-center sm:justify-between sm:mt-6 sm:-mx-2">
              <button type="button" className="px-4 sm:mx-2 w-full py-2.5 text-sm font-medium dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-800 tracking-wide text-gray-700 capitalize transition-colors duration-300 transform border border-gray-200 rounded-md hover:bg-gray-100 focus:outline-none focus:ring focus:ring-gray-300 focus:ring-opacity-40">
                Anuluj
              </button>
              <button type="submit" className="px-4 sm:mx-2 w-full py-2.5 text-sm font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-gray-800 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring focus:ring-gray-300 focus:ring-opacity-50">
                Zapisz
              </button>
            </div>
            <button type="submit">Zapisz</button>
            <button type="button" onClick={onClose}>Anuluj</button>
          </form>
        </div>
      </Modal>
      
    </div>
  );
};

export default EditProduct;