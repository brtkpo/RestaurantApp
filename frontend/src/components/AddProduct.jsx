import React, { useState } from "react";
import axios from "axios";

const AddProduct = ({ restaurantId }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    is_available: true,
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const token = sessionStorage.getItem("authToken");
    if (!token) {
      setError("Brak tokenu. Zaloguj się ponownie.");
      return;
    }

    try {
      const response = await axios.post(
        `http://localhost:8000/api/restaurant/add-product/`,
        {
          ...formData,
          restaurant: restaurantId, // Dodajemy ID restauracji
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 201) {
        setSuccess("Produkt został dodany pomyślnie!");
        setFormData({ name: "", description: "", price: "", is_available: true });
      }
    } catch (error) {
      console.error(error);
      setError(error.response?.data?.detail || "Wystąpił błąd podczas dodawania produktu.");
    }
  };

  return (
    <div>
      <h2>Dodaj Produkt</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Nazwa:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Opis:</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
          ></textarea>
        </div>
        <div>
          <label>Cena (PLN):</label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            step="0.01"
            required
          />
        </div>
        <div>
          <label>
            <input
              type="checkbox"
              name="is_available"
              checked={formData.is_available}
              onChange={handleChange}
            />
            Dostępny
          </label>
        </div>
        <button type="submit">Dodaj Produkt</button>
      </form>
    </div>
  );
};

export default AddProduct;
