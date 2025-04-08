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
      console.log('Product to add:', productToAdd);
      const response = await axios.delete(`http://localhost:8000/api/cart/${sessionId}/clear/${productToAdd.restaurant}/`);
      //alert('Produkty z innych restauracji zostały usunięte z koszyka.');
      //refreshCart();
      console.log('Products removed from cart:', response.data);
      handleAddToCart(productToAdd);
      if (modalResolve) {
        modalResolve(true); 
      }
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

    if (cartItems.length > 0) {
      const cartRestaurantId = cartItems[0].product.restaurant;
      if (cartRestaurantId !== product.restaurant) {
        const result = await openModal(product);
        console.log(result);
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
      <ul className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3 list-none p-0 mx-4">
        {availableProducts.map((product) => (
          <li key={product.id} className="cursor-pointer border border-gray-300 rounded-lg pt-2 pb-4 px-4 transition duration-200 ease-in-out transform hover:bg-gray-100 dark:hover:bg-gray-700 w-full md:w-auto">
            <div>
              <h3 className="text-xl font-medium text-center text-gray-800 dark:text-gray-700">{product.name}</h3>
              <ul className="text-gray-800 list-disc list-inside dark:text-gray-700">
                <li>{product.description || "Brak opisu"}</li>
                <li>Cena: {product.price} PLN</li>
              </ul>
              <div className="justify-center items-center flex">
              <img
                class="h-auto rounded-lg"
                src={product.image ? `${cloudinaryBaseUrl}${product.image}` : placeholderImage}
                alt={product.name}
                className="h-auto rounded-lg my-2 mx-auto"
                style={{ width: "300px", height: "auto" }}
              />
              </div>
            </div>
            <AddToCartButton product={product} handleAddToCart={handleAddToCart} />
          </li>
        ))}
      </ul>

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Potwierdzenie usunięcia"
        className="fixed inset-0 z-10 overflow-y-auto flex items-center justify-center transition duration-300 ease-out transform"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 transition duration-300 ease-out"
      >
        <div className="relative inline-block px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl rtl:text-right dark:bg-gray-900 sm:my-8 sm:align-middle sm:max-w-sm sm:w-full sm:p-6">
        <h3 className="text-lg font-medium leading-6 text-red-800 capitalize dark:text-white text-center" id="modal-title">W koszyku mogą być produkty tylko z jednej restauracji</h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 text-center">Usunąć niepasujące produkty?</p>
        <div className="mt-4 sm:flex sm:items-center sm:justify-between sm:mt-6 sm:-mx-2 h-auto">
          <button onClick={closeModal} className="px-4 sm:mx-2 w-full py-2.5 h-full text-sm font-medium dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-800 tracking-wide text-gray-700 capitalize transition-colors duration-300 transform border border-gray-200 rounded-md hover:bg-gray-100 focus:outline-none focus:ring focus:ring-gray-300 focus:ring-opacity-40">
            Anuluj
          </button>
          <button onClick={handleRemoveAndAdd} className="px-4 sm:mx-2 w-full py-2.5 h-full text-sm font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-gray-800 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring focus:ring-gray-300 focus:ring-opacity-50">
            Usuń 
          </button>
        </div>
        </div>
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
    <div className="mt-4 ml-2 flex justify-center items-center space-x-2">
      <button onClick={handleDecrease} disabled={quantity === 1} className="w-8 px-2 py-1.5 text-sm font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-gray-800 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring focus:ring-gray-300 focus:ring-opacity-50">
        -
      </button>
      <span>{quantity}</span>
      <button onClick={handleIncrease} disabled={quantity === 99} className="w-8 px-2 py-1.5 text-sm font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-gray-800 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring focus:ring-gray-300 focus:ring-opacity-50">
        +
      </button>
      <button 
        onClick={() => (handleAddToCart(product, quantity), setQuantity(1))}
        className="w-50 px-2 py-1.5 text-sm font-medium dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-800 tracking-wide text-gray-700 capitalize transition-colors duration-300 transform border border-gray-200 rounded-md hover:bg-gray-100 focus:outline-none focus:ring focus:ring-gray-300 focus:ring-opacity-40"
      >
          Dodaj do koszyka</button>
    </div>
  );
};

export default UserListProducts;