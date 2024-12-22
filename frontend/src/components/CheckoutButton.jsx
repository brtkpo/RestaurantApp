import React from 'react';
import { loadStripe } from '@stripe/stripe-js';

// Załaduj Stripe.js z Twoim publicznym kluczem
const stripePromise = loadStripe('pk_test_51QXLuJGugFGFgbLMyn8AWC8qBVTPEqJLfVP6UaVzBoo5A4JEaX0fkMOtXPUxtO5oXgrYffico8r3eBZ8ZWHZ2FA000UeHqshND');

const CheckoutButton = () => {
    const handleCheckout = async () => {
        try {
            // Wyślij zapytanie do backendu, aby utworzyć sesję płatności
            const response = await fetch('http://localhost:8000/api/create-checkout-session/', {
                method: 'POST',
            });

            if (!response.ok) {
                throw new Error('Failed to create checkout session');
            }

            const session = await response.json();

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

    return <button onClick={handleCheckout}>Zapłać Online</button>;
};

export default CheckoutButton;

