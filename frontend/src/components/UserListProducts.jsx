import React, { useState, useContext } from "react";
import axios from "axios";
import { CartContext } from './CartContext';

const UserListProducts = ({ products }) => {
  const { refreshCart } = useContext(CartContext);

  return (
    <div>
      <h1>Lista produktów</h1>
      <ul>
        {products.map((product) => (
          <li key={product.id} style={{ marginBottom: "20px" }}>
            <div>
              <h3>{product.name}</h3>
              <p>{product.description || "Brak opisu"}</p>
              <p>Cena: {product.price} PLN</p>
              <p>{product.is_available ? "Dostępny" : "Niedostępny"}</p>
            </div>
            <AddToCartButton product={product} refreshCart={refreshCart} />
          </li>
        ))}
      </ul>
    </div>
  );
};

const AddToCartButton = ({ product, refreshCart }) => {
  const [quantity, setQuantity] = useState(1);

  const handleIncrease = () => {
    if (quantity < 9) {
      setQuantity(quantity + 1);
    }
  };

  const handleDecrease = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleAddToCart = async () => {
    let sessionId = sessionStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('session_id', sessionId);
    }
  
    try {
      const requestData = {
        product: product.id, // Zamiast `product_id`, użyj `product`
        quantity,
      };
  
      console.log("Sending data:", requestData);
  
      const response = await axios.post(
        `http://localhost:8000/api/cart/${sessionId}/items/`,
        requestData
      );
      console.log('Product added to cart:', response.data);
      alert(`Dodano do koszyka: Produkt ${product.name}, Ilość: ${quantity}`);
      refreshCart();
    } catch (error) {
      console.error('Error adding product to cart:', error);
      if (error.response && error.response.data) {
        console.error('Error details:', error.response.data);
      }
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <button onClick={handleDecrease} disabled={quantity === 1}>
        -
      </button>
      <span>{quantity}</span>
      <button onClick={handleIncrease} disabled={quantity === 9}>
        +
      </button>
      <button onClick={handleAddToCart}>Dodaj do koszyka</button>
    </div>
  );
};

export default UserListProducts;
