import React, { useState, useEffect } from "react";
import axios from "axios";

const EditProduct = ({ productId, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    is_available: true,
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const token = localStorage.getItem("access_token") || sessionStorage.getItem("authToken");
        if (!token) {
          throw new Error("Brak tokena uwierzytelniającego");
        }

        const response = await axios.get(`http://localhost:8000/api/restaurant/product/${productId}/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setFormData(response.data);
      } catch (err) {
        setError(err.message || "Nieoczekiwany błąd.");
      }
    };

    fetchProduct();
  }, [productId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("access_token") || sessionStorage.getItem("authToken");
      if (!token) {
        throw new Error("Brak tokena uwierzytelniającego");
      }

      await axios.put(`http://localhost:8000/api/restaurant/update-product/${productId}/`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      onUpdate();
      onClose();
    } catch (err) {
      setError(err.message || "Nieoczekiwany błąd.");
    }
  };

  if (error) {
    return <div>Błąd: {error}</div>;
  }

  return (
    <div>
      <h2>Edytuj Produkt</h2>
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
          <label>Cena:</label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Dostępny:</label>
          <input
            type="checkbox"
            name="is_available"
            checked={formData.is_available}
            onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
          />
        </div>
        <button type="submit">Zapisz</button>
        <button type="button" onClick={onClose}>Anuluj</button>
      </form>
    </div>
  );
};

export default EditProduct;