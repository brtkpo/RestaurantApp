import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from 'react-modal';

const AddAddressForm = ({ isOpen, onRequestClose, onAddAddress }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    street: '',
    building_number: '',
    apartment_number: '',
    postal_code: '',
    city: '',
  });

  const [error, setError] = useState('');
  const [globalError, setGlobalError] = useState(null); 
  const [typingTimeout, setTypingTimeout] = useState(null); 

  const [firstNameError, setFirstNameError] = useState(false);
  const [lastNameError, setLastNameError] = useState(false);
  const [phoneError, setPhoneError] = useState(false);
  const [postalCodeError, setPostalCodeError] = useState(false);
  const [cityError, setCityError] = useState(false);
  const [streetError, setStreetError] = useState(false);
  const [buildingNumberError, setBuildingNumberError] = useState(false);
  const [apartmentNumberError, setApartmentNumberError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));

    if (name === "first_name") {
      const firstNameRegex = /^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s-]+$/;
      setFirstNameError(!firstNameRegex.test(value) && value.length > 0);
    }

    if (name === "last_name") {
      const lastNameRegex = /^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s-]+$/;
      setLastNameError(!lastNameRegex.test(value) && value.length > 0);
    }

    if (name === "phone_number") {
      const phoneNumberRegex = /^\d{9}$/;
      setPhoneError(!phoneNumberRegex.test(value) && value.length > 0);
    }

    if (name === "postal_code") {
      const postalCodeRegex = /^\d{2}-\d{3}$/;
      setPostalCodeError(!postalCodeRegex.test(value) && value.length > 0);
    }

    if (name === "city") {
      const cityRegex = /^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s-]+$/;
      setCityError(!cityRegex.test(value) && value.length > 0);
    }

    if (name === "street") {
      const streetRegex = /^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s-]+$/;
      setStreetError(!streetRegex.test(value) && value.length > 0);
    }

    if (name === "building_number") {
      const buildingNumberRegex = /^\d+$/;
      setBuildingNumberError(!buildingNumberRegex.test(value) && value.length > 0);
    }

    if (name === "apatment_number") {
      const apatmentNumberRegex = /^\d+$/;
      setApartmentNumberError(!apatmentNumberRegex.test(value) && value.length > 0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(isSubmitting) return;
    setIsSubmitting(true);

    try {
      const token = sessionStorage.getItem('authToken');
      const response = await axios.post('http://localhost:8000/api/add-address/', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setFormData({
        first_name: '',
        last_name: '',
        phone_number: '',
        street: '',
        building_number: '',
        apartment_number: '',
        postal_code: '',
        city: '',
      });
      setError(false);
      setModalMessage('Adres dodany pomyślnie!');
      onRequestClose();
      onAddAddress(true);
    } catch (err) {
      setError(true);
      onAddAddress(false);
      setModalMessage('Błąd podczas dodawania adresu. Spróbuj ponownie później.');
    }
    setModalIsOpen(true);
  };

  const handleModalClose = () => {
    setModalIsOpen(false);
    setIsSubmitting(false);
    setError(false);
  };

  return (
  <div >
    <Modal 
      isOpen={isOpen} 
      onRequestClose={onRequestClose} 
      contentLabel="Dodaj nowy adres" 
      shouldCloseOnOverlayClick={false}
      className="fixed inset-0 flex items-center justify-center overflow-auto"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50"
      >
        <div className="font-[sans-serif] w-full max-w-sm mx-auto bg-white rounded-lg shadow-md dark:bg-gray-800 px-6 py-4 max-h-full overflow-y-auto">
          <h3 className="mt-3 text-xl font-medium text-center text-gray-800 dark:text-gray-700">Dodaj nowy adres!</h3>

          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="restaurant.name">Imię:</label>
              <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              required
              className="block w-full px-4 py-2 mt-2 text-gray-700 placeholder-gray-500 bg-white border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 focus:border-gray-400 dark:focus:border-gray-300 focus:ring-opacity-40 focus:outline-none focus:ring focus:ring-gray-300"
            />
            {firstNameError && <p className="mt-2 text-sm text-red-600 dark:text-red-500">Imię może zawierać tylko litery.</p>}
            </div>      
            <div>
              <label htmlFor="restaurant.name">Nazwisko:</label>
              <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              required
              className="block w-full px-4 py-2 mt-2 text-gray-700 placeholder-gray-500 bg-white border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 focus:border-gray-400 dark:focus:border-gray-300 focus:ring-opacity-40 focus:outline-none focus:ring focus:ring-gray-300"
            />
            {lastNameError && <p className="mt-2 text-sm text-red-600 dark:text-red-500">Nazwisko może zawierać tylko litery.</p>}
            </div>
            <div>
              <label htmlFor="phone_number">Telefon:</label>
              <input
              type="text"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              maxLength="9" 
              required
              className="block w-full px-4 py-2 mt-2 text-gray-700 placeholder-gray-500 bg-white border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 focus:border-gray-400 dark:focus:border-gray-300 focus:ring-opacity-40 focus:outline-none focus:ring focus:ring-gray-300 appearance-none"
              style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
            />
            {phoneError && <p className="mt-2 text-sm text-red-600 dark:text-red-500">Nr. telefonu powinien mieć 9 cyfr.</p>}
            </div>
            <div>
              <label htmlFor="street">Ulica:</label>
              <input
              type="text"
              name="street"
              value={formData.street}
              onChange={handleChange}
              required
              className="block w-full px-4 py-2 mt-2 text-gray-700 placeholder-gray-500 bg-white border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 focus:border-gray-400 dark:focus:border-gray-300 focus:ring-opacity-40 focus:outline-none focus:ring focus:ring-gray-300 appearance-none"
            />
            {streetError && <p className="mt-2 text-sm text-red-600 dark:text-red-500">Ulica może zawierać tylko litery.</p>}
            </div>
            <div>
              <label htmlFor="building_number">Nr. budynku:</label>
              <input
              type="number"
              name="building_number"
              value={formData.building_number}
              onChange={handleChange}
              required
              className="appearance-none block w-full px-4 py-2 mt-2 text-gray-700 placeholder-gray-500 bg-white border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 focus:border-gray-400 dark:focus:border-gray-300 focus:ring-opacity-40 focus:outline-none focus:ring focus:ring-gray-300"
              style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
            />
            {buildingNumberError && <p className="mt-2 text-sm text-red-600 dark:text-red-500">Nr. budynku może zawierać tylko cyfry.</p>}
            </div>
            <div>
              <label htmlFor="apartment_number">Nr. mieszkania (opcjonalnie):</label>
              <input
                type="number"
                name="apartment_number"
                value={formData.apartment_number}
                onChange={handleChange}
                className="block w-full px-4 py-2 mt-2 text-gray-700 placeholder-gray-500 bg-white border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 focus:border-gray-400 dark:focus:border-gray-300 focus:ring-opacity-40 focus:outline-none focus:ring focus:ring-gray-300"
                style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
            />
            {apartmentNumberError && <p className="mt-2 text-sm text-red-600 dark:text-red-500">Nr. mieszkania może zawierać tylko cyfry.</p>}
            </div>
            <div>
              <label htmlFor="postal_code">Kod pocztowy:</label>
              <input
              type="text"
              name="postal_code"
              value={formData.postal_code}
              onChange={handleChange}
              required
              maxLength="6" 
              className="block w-full px-4 py-2 mt-2 text-gray-700 placeholder-gray-500 bg-white border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 focus:border-gray-400 dark:focus:border-gray-300 focus:ring-opacity-40 focus:outline-none focus:ring focus:ring-gray-300"
            />
            {postalCodeError && <p className="mt-2 text-sm text-red-600 dark:text-red-500">Kod pocztowy powinien mieć format XX-XXX.</p>}
            </div>
            <div>
              <label htmlFor="city">Miasto:</label>
              <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              required
              className="block w-full px-4 py-2 mt-2 text-gray-700 placeholder-gray-500 bg-white border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 focus:border-gray-400 dark:focus:border-gray-300 focus:ring-opacity-40 focus:outline-none focus:ring focus:ring-gray-300"
            />
            {cityError && <p className="mt-2 text-sm text-red-600 dark:text-red-500">Miasto może zawierać tylko litery.</p>}
            </div>
            <div className="mt-4 sm:flex sm:items-center sm:justify-between sm:mt-6 sm:-mx-2">
              <button type="button" onClick={onRequestClose} className="px-4 sm:mx-2 w-full py-2.5 text-sm font-medium dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-800 tracking-wide text-gray-700 capitalize transition-colors duration-300 transform border border-gray-200 rounded-md hover:bg-gray-100 focus:outline-none focus:ring focus:ring-gray-300 focus:ring-opacity-40">
                Anuluj
              </button>
              <button type="submit" className="px-4 sm:mx-2 w-full py-2.5 text-sm font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-gray-800 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring focus:ring-gray-300 focus:ring-opacity-50">
              {isSubmitting ? 'Dodawanie' : 'Dodaj'}
              </button>
            </div>
          </form>
        </div>
    </Modal>
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
  </div>
  );
};

export default AddAddressForm;
