import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Modal from 'react-modal';
import loadingGif from '../assets/200w.gif'; 

const ManageTags = ({ restaurantId }) => {
  const [allTags, setAllTags] = useState([]);
  const [assignedTags, setAssignedTags] = useState([]);
  const [newTagName, setNewTagName] = useState('');
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(true); 

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/tags/');
        setAllTags(response.data);
      } catch (error) {
        setError(true);
        setModalMessage('Błąd podczas ładowania tagów.');
        setModalIsOpen(true);
      }
    };

    const fetchAssignedTags = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/api/restaurant/${restaurantId}/tags/list`);
        setAssignedTags(response.data.map(tag => tag.id));
      } catch (error) {
        setError(true);
        setModalMessage('Błąd podczas ładowania przypisanych tagów.');
        setModalIsOpen(true);
      }
    };

    fetchTags();
    fetchAssignedTags();
    setIsLoading(false);
  }, [restaurantId]);

  const handleTagChange = (tagId) => {
    const newAssignedTags = assignedTags.includes(tagId)
      ? assignedTags.filter(id => id !== tagId)
      : [...assignedTags, tagId];
    
    setAssignedTags(newAssignedTags);

    // Pobierz token z sessionStorage
    const token = sessionStorage.getItem('authToken');
    
    if (!token) {
      setError(true);
      setModalMessage('Brak tokenu uwierzytelniającego. Zaloguj się ponownie.');
      setModalIsOpen(true);
      return;
    }

    // Wysyłamy zapytanie do backendu, aby zaktualizować przypisane tagi
    axios.post(
      `http://localhost:8000/api/restaurant/${restaurantId}/tags/update`, 
      { tag_ids: newAssignedTags },
      {
        headers: {
          Authorization: `Bearer ${token}`,  // Upewnij się, że token jest dodany do nagłówka
        }
      }
    )
    .catch(error => {
      if (error.response && error.response.status === 401) {
        setError(true);
        setModalMessage('Brak uprawnień. Proszę się zalogować.');
      } else {
        setError(true);
        setModalMessage('Błąd podczas aktualizacji tagów.');
      }
      setModalIsOpen(true);
    });
  };

  const handleAddTag = async () => {
    if (!newTagName.trim()) {
      setError(true);
      setModalMessage('Nazwa tagu nie może być pusta.');
      setModalIsOpen(true);
      return;
    }

    const token = sessionStorage.getItem('authToken');
    if (!token) {
      setError(true);
      setModalMessage('Brak tokenu uwierzytelniającego. Zaloguj się ponownie.');
      setModalIsOpen(true);
      return;
    }

    try {
      // Wyślij żądanie POST do backendu w celu dodania nowego tagu
      const response = await axios.post(
        'http://localhost:8000/api/tag/add/',
        { name: newTagName },
        {
          headers: {
            Authorization: `Bearer ${token}`,  // Upewnij się, że token jest dodany do nagłówka
          }
        }
      );
      
      // Po dodaniu tagu, zaktualizuj wszystkie tagi i przypisane tagi
      setAllTags([...allTags, response.data]);  // Dodaj nowy tag do listy tagów
      handleTagChange(response.data.id);
      setAssignedTags([...assignedTags, response.data.id]);  // Dodaj nowy tag do przypisanych tagów restauracji
      setNewTagName('');  // Wyczyść pole wejściowe
    } catch (error) {
      setError('Błąd podczas dodawania tagu.');
    }
  };

  const handleModalClose = () => {
    setModalIsOpen(false);
    setIsSubmitting(false);
    setError(false);
  };

  if (isLoading) {
    return (
      <div>
        <h3 className="mt-2 text-xl font-medium text-center text-gray-800 dark:text-gray-700">Zarządzaj tagami</h3>
        <div className="flex justify-center items-center">
          <img src={loadingGif} alt="Loading..." />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="mt-2 text-xl font-medium text-center text-gray-800 dark:text-gray-700">Zarządzaj tagami</h3>
      {/*error && <p>{error}</p>*/}

      <div className="font-[sans-serif] w-full max-w-xl mx-auto overflow-hidden bg-white rounded-lg shadow-md dark:bg-gray-800 px-6 py-4">
        <div>
          {allTags.map(tag => (
            <div key={tag.id}>
              <input
                type="checkbox"
                checked={assignedTags.includes(tag.id)}
                onChange={() => handleTagChange(tag.id)}
                class="accent-gray-500"
              />
              <label>{tag.name}</label>
            </div>
          ))}
        </div>

        <div className="flex items-center space-x-2 mt-2 pr-2">
          <input
            placeholder="Wpisz nazwę nowego tagu"
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            className="flex-grow px-4 py-2 text-gray-700 placeholder-gray-500 bg-white border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 focus:border-gray-400 dark:focus:border-gray-300 focus:ring-opacity-40 focus:outline-none focus:ring focus:ring-gray-300"
          />
          <button type="button" onClick={handleAddTag} className="px-6 py-2 text-sm font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-gray-800 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring focus:ring-gray-300 focus:ring-opacity-50">Dodaj tag</button>
        </div>
      </div>

      

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={() => setModalIsOpen(false)}
        contentLabel="error Modal"
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

export default ManageTags;
