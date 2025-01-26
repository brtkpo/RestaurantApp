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
  const [isLoaded, setIsLoaded] = useState(false);

  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

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
        setModalIsOpen(true);
        setModalMessage(err.message || "Nieoczekiwany błąd.");
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
      setModalIsOpen(true);
      setModalMessage(err.message || "Nieoczekiwany błąd.");
    }
  };

  const handleUploadSuccess = (uploadedImageData) => {
    setFormData((prevData) => ({
      ...prevData,
      image: uploadedImageData.path
    }));
    setIsLoaded(false)
  };

  const handleCancel = () => {
    onClose();
  };

  const handleModalClose = () => {
    setModalIsOpen(false);
    setError(false);
    setModalMessage("");
  };

  if (error) {
    return <Modal
      isOpen={modalIsOpen}
      onRequestClose={() => setModalIsOpen(false)}
      contentLabel="Error Modal"
      className="fixed inset-0 z-10 overflow-y-auto flex items-center justify-center transition duration-300 ease-out transform"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50 transition duration-300 ease-out"
    >
      <div className="relative inline-block px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl rtl:text-right dark:bg-gray-900 sm:my-8 sm:align-middle sm:max-w-sm sm:w-full sm:p-6">
        <div className="mt-2 text-center">
          {(error) ? (
              <h3 className="text-lg font-medium leading-6 text-red-800 capitalize dark:text-white" id="modal-title">Błąd</h3>
            ) : (<h3 className="text-lg font-medium leading-6 text-gray-800 capitalize dark:text-white" id="modal-title">Sukces!</h3>)}
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{modalMessage}</p>
        </div>
        <div className="mt-5 sm:flex sm:items-center sm:justify-center">
          <div className="sm:flex sm:items-center">
            <button
              onClick={handleModalClose}
              className="w-full px-4 py-2 mt-2 text-sm font-medium tracking-wide text-gray-700 capitalize transition-colors duration-300 transform border border-gray-200 rounded-md sm:mt-0 sm:w-auto sm:mx-2 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-800 hover:bg-gray-100 focus:outline-none focus:ring focus:ring-gray-300 focus:ring-opacity-40"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </Modal>
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
          <h3 className="mt-3 text-xl font-medium text-center text-gray-800 dark:text-gray-700">Edytuj Produkt</h3>
          <form onSubmit={handleSubmit}>
            <div>
              <label>Nazwa:</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="block w-full px-4 py-2 mt-2 text-gray-700 placeholder-gray-500 bg-white border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 focus:border-gray-400 dark:focus:border-gray-300 focus:ring-opacity-40 focus:outline-none focus:ring focus:ring-gray-300"
              />
            </div>
            <div>
              <label>Opis:</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                placeholder="Tu podaj opis produktu"
                className="resize-none h-36 block w-full px-4 py-2 mt-2 text-gray-700 placeholder-gray-500 bg-white border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 focus:border-gray-400 dark:focus:border-gray-300 focus:ring-opacity-40 focus:outline-none focus:ring focus:ring-gray-300"
              />
            </div>
            <div>
              <label>Cena:</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                minValue="0"
                style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
                className="block w-full px-4 py-2 mt-2 text-gray-700 placeholder-gray-500 bg-white border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 focus:border-gray-400 dark:focus:border-gray-300 focus:ring-opacity-40 focus:outline-none focus:ring focus:ring-gray-300"
              />
            </div>
            <div>
              <label>Dostępny:</label>
              <input
                type="checkbox"
                name="is_available"
                checked={formData.is_available}
                class="accent-gray-500"
                onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
              />
            </div>
            <div className="flex justify-center items-center">
              <label>Zdjęcie</label>
            </div>
            <UploadImage
              onUploadSuccess={handleUploadSuccess}
              metadata={{ id: restaurantId, name: productId + "_" + formData.name }}
              isLoaded={isLoaded} 
              setIsLoaded={setIsLoaded} 
            />

            {!isLoaded && (<div className="mt-4 sm:flex sm:items-center sm:justify-between sm:mt-6 sm:-mx-2">
              <button onClick={handleCancel} type="button" className="px-4 sm:mx-2 w-full py-2.5 text-sm font-medium dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-800 tracking-wide text-gray-700 capitalize transition-colors duration-300 transform border border-gray-200 rounded-md hover:bg-gray-100 focus:outline-none focus:ring focus:ring-gray-300 focus:ring-opacity-40">
                Anuluj
              </button>
              <button type="submit" className="px-4 sm:mx-2 w-full py-2.5 text-sm font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-gray-800 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring focus:ring-gray-300 focus:ring-opacity-50">
                Zapisz 
              </button>
            </div>)}
            
            

          </form>
        </div>
      </Modal>
      
    </div>
  );
};

export default EditProduct;