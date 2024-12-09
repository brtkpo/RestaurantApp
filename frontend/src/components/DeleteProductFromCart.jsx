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
        refreshCart();  // Odświeżenie koszyka po usunięciu produktu
        alert('Produkt został usunięty z koszyka');
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
            await axios.put(`http://localhost:8000/api/cart/${sessionId}/items/${cartItemId}/`, {
                quantity: newQuantity
            });
            refreshCart();  // Odświeżenie koszyka po zmianie ilości produktu
        } catch (error) {
            console.error('Error updating product quantity in cart:', error);
        }
    };

    return (
    <div>
        <button onClick={handleDecrease} disabled={quantity === 1}>-</button>
        <span>{quantity}</span>
        <button onClick={handleIncrease} disabled={quantity === 9}>+</button>
        <button onClick={handleDelete}>Usuń</button>
    </div>
    );
};

export default DeleteProductFromCart;