import React, { useState } from "react";
import axios from "axios";
import Modal from 'react-modal';

const AddProduct = ({ restaurantId , onProductAdded}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    is_available: true,
  });
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    if(isSubmitting) return;
    setIsSubmitting(true);
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const token = sessionStorage.getItem("authToken");
    if (!token) {
      setError(true)
      setModalMessage("Brak tokenu. Zaloguj się ponownie.");
      return;
    }

    try {
      const response = await axios.post(
        `http://localhost:8000/api/restaurant/add-product/`,
        {
          ...formData,
          restaurant: restaurantId, // Dodajemy ID restauracji
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 201) {
        setSuccess(true);
        setModalMessage("Produkt został dodany pomyślnie!");
        setFormData({ name: "", description: "", price: "", is_available: true });
        onProductAdded();
      }
    } catch (error) {
      setError(true)
      setModalMessage(error.response?.data?.detail || "Wystąpił błąd podczas dodawania produktu.");
    }
  };

  const openModal = () => {
    setModalIsOpen(true);
  }

  const handleCancel = () => {
    setModalIsOpen(false)
  };

  const handleModalClose = () => {
    setIsSubmitting(false);
    setModalIsOpen(false);
    setError(false);
    setSuccess(false);
    setModalMessage("");
  };

  if(error || success) {
    return(
      <Modal
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
    )
  }


  return (
    <div>
      <div className="mt-2 text-center font-[sans-serif]">
        <button onClick={() => {openModal();}} className=" px-6 py-2 text-sm font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-gray-800 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring focus:ring-gray-300 focus:ring-opacity-50">
          Dodaj Produkt
        </button>
      </div>

      <Modal
            isOpen={modalIsOpen}
            onRequestClose={() => setModalIsOpen(false)}
            contentLabel="Error Modal"
            className="fixed inset-0 z-10 overflow-y-auto flex items-center justify-center transition duration-300 ease-out transform"
            overlayClassName="fixed inset-0 bg-black bg-opacity-50 transition duration-300 ease-out"
      >
        <div className="relative inline-block px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl rtl:text-right dark:bg-gray-900 sm:my-8 sm:align-middle sm:max-w-sm sm:w-full sm:p-6">
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
                className="resize-none h-36 block w-full px-4 py-2 mt-2 text-gray-700 placeholder-gray-500 bg-white border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 focus:border-gray-400 dark:focus:border-gray-300 focus:ring-opacity-40 focus:outline-none focus:ring focus:ring-gray-300"
              ></textarea>
            </div>
            <div>
              <label>Cena (PLN):</label>
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
              <label>
                Dostępny:
                <input
                  type="checkbox"
                  name="is_available"
                  checked={formData.is_available}
                  onChange={handleChange}
                  class="accent-gray-500"
                />
                
              </label>
            </div>
            <div className="mt-4 sm:flex sm:items-center sm:justify-between sm:mt-6 sm:-mx-2">
              <button onClick={handleCancel} type="button" className="px-4 sm:mx-2 w-full py-2.5 text-sm font-medium dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-800 tracking-wide text-gray-700 capitalize transition-colors duration-300 transform border border-gray-200 rounded-md hover:bg-gray-100 focus:outline-none focus:ring focus:ring-gray-300 focus:ring-opacity-40">
                Anuluj
              </button>
              <button type="submit" className="px-4 sm:mx-2 w-full py-2.5 text-sm font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-gray-800 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring focus:ring-gray-300 focus:ring-opacity-50">
                Dodaj Produkt
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default AddProduct;