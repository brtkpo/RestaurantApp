import React, { useState } from "react";
import axios from "axios";

function RegisterRestaurant() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    phone_number: "",
    restaurant: {
      name: "",
      phone_number: "",
      description: "",
    },
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith("restaurant.")) {
      const field = name.split(".")[1]; // Pobierz nazwę pola restauracji
      setFormData((prevData) => ({
        ...prevData,
        restaurant: {
          ...prevData.restaurant,
          [field]: value,
        },
      }));
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:8000/api/restaurant/register/", formData);
      setSuccess("Restauracja została zarejestrowana pomyślnie!");
      setError(null);
      console.log(response.data);
    } catch (err) {
      if (err.response && err.response.data) {
        const errors = err.response.data;
        const errorMessages = Object.values(errors).flat().join(" ");
        setError(`Błąd rejestracji: ${errorMessages}`);
      } else {
        setError("Wystąpił problem z połączeniem z serwerem.");
      }
      setSuccess(null);
    }
  };

  return (
    <div>
      <h2>Rejestracja restauracji</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}
      <form onSubmit={handleSubmit}>
        <h3>Dane użytkownika</h3>
        <div>
          <label htmlFor="first_name">Imię:</label>
          <input
            type="text"
            id="first_name"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
          />
        </div>
        <div>
          <label htmlFor="last_name">Nazwisko:</label>
          <input
            type="text"
            id="last_name"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
          />
        </div>
        <div>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
          />
        </div>
        <div>
          <label htmlFor="password">Hasło:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
          />
        </div>
        <div>
          <label htmlFor="phone_number">Telefon:</label>
          <input
            type="text"
            id="phone_number"
            name="phone_number"
            value={formData.phone_number}
            onChange={handleChange}
          />
        </div>
        <h3>Dane restauracji</h3>
        <div>
          <label htmlFor="restaurant.name">Nazwa restauracji:</label>
          <input
            type="text"
            id="restaurant.name"
            name="restaurant.name"
            value={formData.restaurant.name}
            onChange={handleChange}
          />
        </div>
        <div>
          <label htmlFor="restaurant.phone_number">Telefon restauracji:</label>
          <input
            type="text"
            id="restaurant.phone_number"
            name="restaurant.phone_number"
            value={formData.restaurant.phone_number}
            onChange={handleChange}
          />
        </div>
        <div>
          <label htmlFor="restaurant.description">Opis restauracji:</label>
          <textarea
            id="restaurant.description"
            name="restaurant.description"
            value={formData.restaurant.description}
            onChange={handleChange}
          />
        </div>
        <button type="submit">Zarejestruj</button>
      </form>
    </div>
  );
}

export default RegisterRestaurant;
