import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Modal from 'react-modal';
import { useDispatch } from 'react-redux';
import { setUserToken } from '../redux/actions';

//Modal.setAppElement('#root'); 

function Register() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
  });

  const [error, setError] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [firstNameError, setFirstNameError] = useState(false);
  const [lastNameError, setLastNameError] = useState(false);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));

    if (name === "email") {
      setEmailError(!value.includes("@") && value.length > 0);
    }

    if (name === "first_name") {
      const firstNameRegex = /^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s-]+$/;
      setFirstNameError(!firstNameRegex.test(value) && value.length > 0);
    }

    if (name === "last_name") {
      const lastNameRegex = /^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s-]+$/;
      setLastNameError(!lastNameRegex.test(value) && value.length > 0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(isSubmitting) return;
    setIsSubmitting(true);

    if (emailError || firstNameError || lastNameError) {
      setError(true);
      setModalMessage("Proszę poprawić błędy w formularzu.");
      setModalIsOpen(true);
      return;
    }

    try {
      const response = await axios.post("http://localhost:8000/api/register/", formData);
      setModalMessage("Zarejestrowano pomyślnie!");
      //setModalIsOpen(true);
      setIsRegistered(true);

      const data = response.data;
      console.log(data);
      const token = data.access;
      sessionStorage.setItem('authToken', token);
      dispatch(setUserToken(token));
      
    } catch (err) {
      if (err.response && err.response.data) {
        const serverMessage = err.response.data.message;
        if (serverMessage === "Email is already taken.") {
          setError(true);
          setModalMessage("Ten email jest już zajęty.");
        } else {
          setError(true);
          setModalMessage("Rejestracja nie powiodła się.");
        }
      } else {
        setError(true);
        setModalMessage("Wystąpił problem z połączeniem z serwerem.");
      }
      //setModalIsOpen(true);
    }
    setModalIsOpen(true);
    setIsSubmitting(false);
  };

  const handleModalClose = () => {
    setModalIsOpen(false);
    setError(false);
    if (isRegistered) {
      navigate('/user'); // Przekierowanie po zamknięciu modala
    }
  };

  return (
    <div className="font-[sans-serif] w-full max-w-sm mx-auto overflow-hidden bg-white rounded-lg shadow-md dark:bg-gray-800 px-6 py-4 mt-10">
      <h3 className="mt-3 text-xl font-medium text-center text-gray-800 dark:text-gray-700">Zarejestruj Się!</h3>
      {/*error && <p className="text-red-800">{error}</p>*/}
      <form onSubmit={handleSubmit}>
        <div className="w-full mt-4">
          <label htmlFor="first_name">Imię:</label>
          <input
            type="text"
            id="first_name"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            required
            className="block w-full px-4 py-2 mt-2 text-gray-700 placeholder-gray-500 bg-white border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 focus:border-gray-400 dark:focus:border-gray-300 focus:ring-opacity-40 focus:outline-none focus:ring focus:ring-gray-300"
          />
          {firstNameError && <p className="mt-2 text-sm text-red-600 dark:text-red-500">Imię może zawierać tylko litery.</p>}
        </div>
        <div className="w-full mt-4">
          <label htmlFor="last_name">Nazwisko:</label>
          <input
            type="text"
            id="last_name"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            required
            className="block w-full px-4 py-2 mt-2 text-gray-700 placeholder-gray-500 bg-white border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 focus:border-gray-400 dark:focus:border-gray-300 focus:ring-opacity-40 focus:outline-none focus:ring focus:ring-gray-300"
          />
          {lastNameError && <p className="mt-2 text-sm text-red-600 dark:text-red-500">Nazwisko może zawierać tylko litery.</p>}
        </div>
        <div className="w-full mt-4">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="block w-full px-4 py-2 mt-2 text-gray-700 placeholder-gray-500 bg-white border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 focus:border-gray-400 dark:focus:border-gray-300 focus:ring-opacity-40 focus:outline-none focus:ring focus:ring-gray-300"
          />
          {emailError && <p className="mt-2 text-sm text-red-600 dark:text-red-500">Proszę podać poprawny adres e-mail.</p>}
        </div>
        <div className="w-full mt-4">
          <label htmlFor="password">Hasło:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="block w-full px-4 py-2 mt-2 text-gray-700 placeholder-gray-500 bg-white border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 focus:border-gray-400 dark:focus:border-gray-300 focus:ring-opacity-40 focus:outline-none focus:ring focus:ring-gray-300"
          />
        </div>
        <div className="flex items-center mt-4 justify-center">
          <button type="submit" className="px-6 py-2 text-sm font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-gray-800 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring focus:ring-gray-300 focus:ring-opacity-50">
          {isSubmitting ? 'Rejestracja' : 'Zarejestruj'}
          </button>
        </div>
        <div class="flex items-center justify-center pt-4 text-center">
          <span class="text-sm text-gray-600 dark:text-gray-200">Masz już konto?</span>
          <Link to="/login" href="#" class="mx-2 text-sm font-bold text-gray-800 dark:text-gray-700 hover:underline">Zaloguj się!</Link>
        </div>
      </form>
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={() => setModalIsOpen(false)}
        contentLabel="Error Modal"
        className="fixed inset-0 z-10 overflow-y-auto flex items-center justify-center transition duration-300 ease-out transform"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 transition duration-300 ease-out"
      >
        <div className="relative inline-block px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl rtl:text-right dark:bg-gray-900 sm:my-8 sm:align-middle sm:max-w-sm sm:w-full sm:p-6">
          <div className="mt-2 text-center">
            {(emailError || firstNameError || lastNameError || error) ? (
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
}

export default Register;
