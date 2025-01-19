import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setUserToken } from '../redux/actions';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import '../App.css';

const LoginForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [usernameError, setUsernameError] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    
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
    }


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
      data.role === 'client' ? navigate('/user') : navigate('/restaurant/user');
      alert('Zalogowano pomyślnie!');
    } else {
      alert('Błąd logowania!');
    }

    setIsSubmitting(false);
  };

  return (
    <div className="centered-container form-container">
      <Box
        component="form"
        onSubmit={handleSubmit}

        sx={{ '& .MuiTextField-root': { m: 1, width: '25ch' } }}
        noValidate
        autoComplete="on"
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <TextField
            required
            id="username"
            label="Email"
            type="text"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setUsernameError(false);
            }}
            helperText={usernameError ? 'Email jest wymagany' : ''}
            className="custom-text-field"
          />
          <TextField
            id="password"
            label="Hasło"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setPasswordError(false);
            }}
            required
            InputProps={{
              style: {
                color: 'black',
              },
            }}
            helperText={passwordError ? 'Hasło jest wymagane' : ''}
            className="custom-text-field"
          />
        </div>
        <Button
          variant="contained"
          type="submit"
          className="custom-button"
        >
          {isSubmitting ? 'Logowanie...' : 'Zaloguj'}
        </Button>
      </Box>
      <div>
        <p>
          Nie masz konta? <Link to="/register" className="custom-link">Zarejestruj się</Link>
        </p>
        <p>
          Jesteś Restauratorem? <Link to="/restaurant/register" className="custom-link">Zarejestruj restaurację</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;