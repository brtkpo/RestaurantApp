import React from "react";
import axios from "axios";
import { CartContext } from './CartContext';

const DeleteProductFromCart = ({ productId, cartItemId, quantity, refreshCart }) => {
    //const { refreshCart } = useContext(CartContext);

    const handleDelete = async () => {
        const sessionId = sessionStorage.getItem('session_id');
        if (!sessionId) {
        console.error('Session ID not found');
        return;
        }

        try {
        await axios.delete(`http://localhost:8000/api/cart/${sessionId}/items/${cartItemId}/`);
        refreshCart();  
        } catch (error) {
        console.error('Error deleting product from cart:', error);
        }
    };

    const handleIncrease = async () => {
        if (quantity < 9) {
            await updateQuantity(quantity + 1);
        }
    };
    
      const handleDecrease = async () => {
        if (quantity > 1) {
            await updateQuantity(quantity - 1);
        }
    };

      const updateQuantity = async (newQuantity) => {
        const sessionId = sessionStorage.getItem('session_id');
        if (!sessionId) {
            console.error('Session ID not found');
            return;
        }
    
        try {
            console.log('Updating quantity:', newQuantity); 
            const response = await axios.put(`http://localhost:8000/api/cart/${sessionId}/items/${cartItemId}/`, {
                quantity: newQuantity
            });
            console.log('Response:', response.data);
            refreshCart();  
        } catch (error) {
            console.error('Error updating product quantity in cart:', error);
        }
    };

    return (
        <div className="ml-2 mr-2">
            <button onClick={handleDecrease} disabled={quantity === 1} className="w-8 px-2 py-1.5 text-sm font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-gray-800 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring focus:ring-gray-300 focus:ring-opacity-50">-</button>
            <span className="px-1">{quantity}</span>
            <button onClick={handleIncrease} disabled={quantity === 99} className="w-8 px-2 py-1.5 text-sm font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-gray-800 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring focus:ring-gray-300 focus:ring-opacity-50">+</button>
            <button onClick={handleDelete} className="ml-2 w-16 px-2 py-1.5 text-sm font-medium dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-800 tracking-wide text-gray-700 capitalize transition-colors duration-300 transform border border-gray-200 rounded-md hover:bg-gray-100 focus:outline-none focus:ring focus:ring-gray-300 focus:ring-opacity-40">Usuń</button>
        </div>
    );
};

export default DeleteProductFromCart;