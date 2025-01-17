import React from 'react';
import LoginForm from '../components/LoginForm';
import Button from '@mui/material/Button';

const Login = () => {
  return (
    <div>
      <h1>Panel logowania</h1>
      <LoginForm />
      <Button variant="contained" color="primary">
        Zaloguj się
      </Button>
    </div>
  );
};

export default Login;
