import React, { useState } from 'react';
import { Link, useNavigate  } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setUserToken } from '../redux/actions';
import { AuthContext } from '../components/AuthProvider'; 

const LoginForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();  // Hook do dispatchowania akcji
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Przesyłanie danych do backendu Django
    const response = await fetch('http://localhost:8000/api/login/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log(data);
      const token = data.access;
      console.log(token);
      sessionStorage.setItem('authToken', token);
      dispatch(setUserToken(token));

      navigate('/user');
      // Zalogowany - możesz np. przekierować użytkownika
      alert('Zalogowano pomyślnie!');
    } else {
      alert('Błąd logowania!');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="username">Email:</label>
        <input
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="password">Hasło:</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <button type="submit">Zaloguj</button>

      <div>
        <p>
          Nie masz konta? <Link to="/register">Zarejestruj się</Link>
        </p>
      </div>
    </form>
  );
};

export default LoginForm;