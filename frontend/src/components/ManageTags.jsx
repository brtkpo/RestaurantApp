import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ManageTags = ({ restaurantId }) => {
  const [allTags, setAllTags] = useState([]);
  const [assignedTags, setAssignedTags] = useState([]);
  const [newTagName, setNewTagName] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/tags/');
        setAllTags(response.data);
      } catch (error) {
        setError('Błąd podczas ładowania tagów.');
      }
    };

    const fetchAssignedTags = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/api/restaurant/${restaurantId}/tags/list`);
        setAssignedTags(response.data.map(tag => tag.id));
      } catch (error) {
        setError('Błąd podczas ładowania przypisanych tagów.');
      }
    };

    fetchTags();
    fetchAssignedTags();
  }, [restaurantId]);

  const handleTagChange = (tagId) => {
    const newAssignedTags = assignedTags.includes(tagId)
      ? assignedTags.filter(id => id !== tagId)
      : [...assignedTags, tagId];
    
    setAssignedTags(newAssignedTags);

    // Pobierz token z sessionStorage
    const token = sessionStorage.getItem('authToken');
    
    if (!token) {
      setError('Brak tokenu uwierzytelniającego. Zaloguj się ponownie.');
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
        setError('Brak uprawnień. Proszę się zalogować.');
      } else {
        setError('Błąd podczas aktualizacji tagów.');
      }
    });
  };

  const handleAddTag = async () => {
    if (!newTagName.trim()) {
      setError('Nazwa tagu nie może być pusta.');
      return;
    }

    const token = sessionStorage.getItem('authToken');
    if (!token) {
      setError('Brak tokenu uwierzytelniającego. Zaloguj się ponownie.');
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

  return (
    <div>
      <h3>Zarządzaj tagami</h3>
      {error && <p>{error}</p>}

      {/* Formularz do dodawania nowego tagu */}
      <div>
        <input
          type="text"
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          placeholder="Wpisz nazwę nowego tagu"
        />
        <button onClick={handleAddTag}>Dodaj tag</button>
      </div>

      {/* Lista tagów */}
      <div>
        {allTags.map(tag => (
          <div key={tag.id}>
            <input
              type="checkbox"
              checked={assignedTags.includes(tag.id)}
              onChange={() => handleTagChange(tag.id)}
            />
            <label>{tag.name}</label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManageTags;
