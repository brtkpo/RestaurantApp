import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ManageTags = ({ restaurantId }) => {
  const [allTags, setAllTags] = useState([]);
  const [assignedTags, setAssignedTags] = useState([]);
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

  return (
    <div>
      <h3>Zarządzaj tagami</h3>
      {error && <p>{error}</p>}
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
