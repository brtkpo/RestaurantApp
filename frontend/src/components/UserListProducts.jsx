import React, { useState, useContext } from "react";
import axios from "axios";
import { CartContext } from './CartContext';
import placeholderImage from '../assets/Placeholder.png';
import Modal from 'react-modal';

const UserListProducts = ({ products }) => {
  const { cartItems, refreshCart, setIsCartOpen } = useContext(CartContext);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [productToAdd, setProductToAdd] = useState(null);
  const [modalResolve, setModalResolve] = useState(null);

  const cloudinaryBaseUrl = "https://res.cloudinary.com/dljau5sfr/";

  const availableProducts = products.filter(product => product.is_available);

  const openModal = (product) => {
    setProductToAdd(product);
    setModalIsOpen(true);
    return new Promise((resolve) => {
      setModalResolve(() => resolve);
    });
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setProductToAdd(null);
    if (modalResolve) {
      modalResolve(false);
    }
  };

  const handleRemoveAndAdd = async () => {
    let sessionId = sessionStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('session_id', sessionId);
    }

    if (productToAdd) {
      await axios.delete(`http://localhost:8000/api/cart/${sessionId}/clear/${productToAdd.restaurant}/`);
      //alert('Produkty z innych restauracji zostały usunięte z koszyka.');
      //refreshCart();
      handleAddToCart(productToAdd);
      closeModal();
    }
  };

  const handleAddToCart = async (product, quantity) => {
    let sessionId = sessionStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('session_id', sessionId);
    }
    setIsCartOpen(true);

    // Sprawdź, czy w koszyku są produkty z innej restauracji
    if (cartItems.length > 0) {
      const cartRestaurantId = cartItems[0].product.restaurant;
      if (cartRestaurantId !== product.restaurant) {
        const result = await openModal(product);
        if (!result) {
          return;
        }
      }
    }
  
    try {
      const requestData = {
        product: product.id,
        quantity: quantity,
        price: product.price,
      };
  
      console.log("Sending data:", requestData);
  
      const response = await axios.post(
        `http://localhost:8000/api/cart/${sessionId}/items/`,
        requestData
      );
      setIsCartOpen(true);
      console.log('Product added to cart:', response.data);
      //alert(`Dodano do koszyka: Produkt ${product.name}, Ilość: ${quantity}`);
      refreshCart();
    } catch (error) {
      console.error('Error adding product to cart:', error);
      if (error.response && error.response.data) {
        console.error('Error details:', error.response.data);
      }
    }
  };

  return (
    <div>
      <h1>Lista produktów</h1>
      <ul>
        {availableProducts.map((product) => (
          <li key={product.id} style={{ marginBottom: "20px" }}>
            <div>
              <h3>{product.name}</h3>
              <p>{product.description || "Brak opisu"}</p>
              <p>Cena: {product.price} PLN</p>
              {/*<p>{product.is_available ? "Dostępny" : "Niedostępny"}</p>*/}
              <img
                src={product.image ? `${cloudinaryBaseUrl}${product.image}` : placeholderImage}
                alt={product.name}
                style={{ width: "300px", height: "auto" }}
              />
            </div>
            <AddToCartButton product={product} handleAddToCart={handleAddToCart} />
          </li>
        ))}
      </ul>

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Potwierdzenie usunięcia"
      >
        <h2>W koszyku mogą być produkty tylko z jednej restauracji</h2>
        <button onClick={handleRemoveAndAdd}>Usuń niepasujące produkty</button>
        <button onClick={closeModal}>Anuluj</button>
      </Modal>
    </div>
  );
};

const AddToCartButton = ({ product, handleAddToCart }) => {
  const [quantity, setQuantity] = useState(1);

  const handleIncrease = () => {
    if (quantity < 99) {
      setQuantity(quantity + 1);
    }
  };

  const handleDecrease = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <button onClick={handleDecrease} disabled={quantity === 1}>
        -
      </button>
      <span>{quantity}</span>
      <button onClick={handleIncrease} disabled={quantity === 99}>
        +
      </button>
      <button onClick={() => (handleAddToCart(product, quantity), setQuantity(1))}>Dodaj do koszyka</button>
    </div>
  );
};

export default UserListProducts;