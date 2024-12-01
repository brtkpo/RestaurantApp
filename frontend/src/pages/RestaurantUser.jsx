import React from 'react';
import UploadImage from '../components/UploadImage';

const Login = () => {
    const handleUploadSuccess = (data) => {
        console.log("Dane obrazu Cloudinary:", data);
        // Przykład użycia danych:
        // Dodanie do bazy danych
        // fetch("/api/images", {
        //   method: "POST",
        //   body: JSON.stringify(data),
        //   headers: { "Content-Type": "application/json" },
        // });
    };
  return (
    <div>
      <h1>Panel Restauratora</h1>
      <UploadImage onUploadSuccess={handleUploadSuccess} />
    </div>
  );
};

export default Login;