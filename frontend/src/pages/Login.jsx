import React from 'react';
import LoginForm from '../components/LoginForm';
import '../App.css';

const Login = () => {
return (
    <div className="centered-container padding-top form-container" >
      <h1>Zaloguj Się!</h1>
      <LoginForm />
    </div>
  );
};

export default Login;
