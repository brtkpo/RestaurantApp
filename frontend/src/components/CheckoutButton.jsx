import React from 'react';
import { loadStripe } from '@stripe/stripe-js';

// Załaduj Stripe.js z Twoim publicznym kluczem
const stripePromise = loadStripe('pk_test_51QXLuJGugFGFgbLMyn8AWC8qBVTPEqJLfVP6UaVzBoo5A4JEaX0fkMOtXPUxtO5oXgrYffico8r3eBZ8ZWHZ2FA000UeHqshND');

const CheckoutButton = ({ email, orderId, restaurant, totalAmount }) => {
    const handleCheckout = async () => {
        try {
            // Wyślij zapytanie do backendu, aby utworzyć sesję płatności
            console.log('Sending data:', { email, orderId, restaurant, totalAmount });  // Logowanie danych przed wysłaniem
            const response = await fetch('http://localhost:8000/api/create-checkout-session/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    orderId,
                    restaurant,
                    totalAmount,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to create checkout session');
            }

            const session = await response.json();
            console.log('Received session:', session);

            // Załaduj Stripe.js i przekieruj na stronę płatności
            const stripe = await stripePromise;
            const { error } = await stripe.redirectToCheckout({ sessionId: session.id });

            if (error) {
                console.error('Error redirecting to checkout:', error);
            }
        } catch (error) {
            console.error('Error during checkout process:', error);
        }
    };

    return <button onClick={handleCheckout} className=" px-6 py-2 text-sm font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-gray-800 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring focus:ring-gray-300 focus:ring-opacity-50">Zapłać Online</button>;
};

export default CheckoutButton;

