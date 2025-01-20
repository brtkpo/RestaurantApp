import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setUserToken } from '../redux/actions';
import Modal from 'react-modal';

const Login = () => {
  const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [passwordError, setPasswordError] = useState(false);
    const [usernameError, setUsernameError] = useState(false);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [error, setError] = useState(false);
    const [role, setRole] = useState('');
    const dispatch = useDispatch();
    const navigate = useNavigate();
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      if(isSubmitting) return;
      setIsSubmitting(true);
  
      /*
      if(password === '' || username === '') {
        setIsSubmitting(false);
        if (username === '') {
          await setUsernameError(true);
        }
        if (password === '') {
          await setPasswordError(true);
        }
        return;
      }

      if(password === '' || username === '') {
        setIsSubmitting(false);
        if (username === '') {
          await setUsernameError(true);
        }
        if (password === '') {
          await setPasswordError(true);
        }
        return;
      }*/
  
      const response = await fetch('http://localhost:8000/api/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
  
      if (response.ok) {
        const data = await response.json();
        const token = data.access;
        sessionStorage.setItem('authToken', token);
        dispatch(setUserToken(token));
        setRole(data.role);
        //data.role === 'client' ? navigate('/user') : navigate('/restaurant/user');
        //alert('Zalogowano pomyślnie!');
      } else {
        setError(true);
      }
      setModalIsOpen(true);
      setIsSubmitting(false);
    };

    const handleModalClose = () => {
      setModalIsOpen(false);
      setError(false);
      role === 'client' ? navigate('/user') : navigate('/restaurant/user');
    };
  
return (
    <div className="font-[sans-serif] w-full max-w-sm mx-auto overflow-hidden bg-white rounded-lg shadow-md dark:bg-gray-800 px-6 py-4 mt-10">
      <h3 className="mt-3 text-xl font-medium text-center text-gray-800 dark:text-gray-700">Zaloguj się!</h3>
      <form onSubmit={handleSubmit}>
        <div className="w-full mt-4">
          <label htmlFor="username">Email:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="block w-full px-4 py-2 mt-2 text-gray-700 placeholder-gray-500 bg-white border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 focus:border-gray-400 dark:focus:border-gray-300 focus:ring-opacity-40 focus:outline-none focus:ring focus:ring-gray-300"
          />
        </div>
        <div className="w-full mt-4">
          <label htmlFor="password">Hasło:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="block w-full px-4 py-2 mt-2 text-gray-700 placeholder-gray-500 bg-white border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 focus:border-gray-400 dark:focus:border-gray-300 focus:ring-opacity-40 focus:outline-none focus:ring focus:ring-gray-300"
          />
        </div>
        <div className="flex items-center mt-4 justify-center">
          <button type="submit" className="px-6 py-2 text-sm font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-gray-800 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring focus:ring-gray-300 focus:ring-opacity-50">
            {isSubmitting ? 'Logowanie' : 'Zaloguj'}
          </button>
        </div>
        <div class="flex items-center justify-center pt-4 text-center">
          <span class="text-sm text-gray-600 dark:text-gray-200">Nie masz konta?</span>
          <Link to="/register" href="#" class="mx-2 text-sm font-bold text-gray-800 dark:text-gray-700 hover:underline">Zarejestruj się!</Link>
        </div>
        <div>
          <span class="text-sm text-gray-600 dark:text-gray-200">Jesteś Restauratorem?</span>
          <Link to="/restaurant/register" href="#" class="mx-2 text-sm font-bold text-gray-800 dark:text-gray-700 hover:underline">Zarejestruj restaurację!</Link>
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
            {(error) ? (
                <h3 className="text-lg font-medium leading-6 text-red-800 capitalize dark:text-white" id="modal-title">Błąd logowania!</h3>
              ) : (<h3 className="text-lg font-medium leading-6 text-gray-800 capitalize dark:text-white" id="modal-title">Zalogowano pomyślnie!</h3>)}
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

export default Login;