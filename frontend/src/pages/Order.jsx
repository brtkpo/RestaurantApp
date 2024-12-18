import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import AddressSelector from '../components/AddressSelector';
import AddAddressForm from '../components/AddAddressForm';
import { CartContext } from '../components/CartContext';
import DeleteProductFromCart from '../components/DeleteProductFromCart';
import placeholderImage from '../assets/Placeholder.png';
import axios from 'axios';

const Order = () => {
  const token = useSelector((state) => state.token); // Pobieramy token z Redux
  const navigate = useNavigate();
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const { cartId, cartItems, setCartItems, refreshCart } = useContext(CartContext);
  const [paymentType, setPaymentType] = useState('online');
  const [deliveryType, setDeliveryType] = useState('delivery');
  const [orderNotes, setOrderNotes] = useState('');
  const [user, setUser] = useState('');

  const cloudinaryBaseUrl = "https://res.cloudinary.com/dljau5sfr/";

  useEffect(() => {
    if (!token) {
      navigate('/login'); // Przekierowanie na stronę logowania, jeśli użytkownik nie jest zalogowany
    }
  }, [token, navigate]);

  const handleAddressSelect = (address) => {
    setSelectedAddress(address);
    setUser(address.user);
  };

  const handleAddAddress = async (newAddress) => {
    try {
      const response = await axios.post('http://localhost:8000/api/addresses/', newAddress, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 201) {
        setAddresses([...addresses, response.data]);
        alert('Adres dodany pomyślnie!');
        //fetchAddresses();
      }
    } catch (error) {
      alert('Błąd podczas dodawania adresu');
    }
  };

  const handleCreateOrder = async () => {
    if (!selectedAddress) {
      alert("Proszę wybrać adres.");
      return;
    }

    const orderItems = cartItems.map((item) => ({
      product: item.product.id,
      quantity: item.quantity,
    }));

    const orderData = {
      address: selectedAddress ? selectedAddress.id : null,
      cart: cartId,
      //items: orderItems,
      user: user,
      restaurant: cartItems[0].product.restaurant,
      payment_type: paymentType,
      delivery_type: deliveryType,
      order_notes: orderNotes,
    };

    console.log("Order data:", orderData);


    try {
      const response = await axios.post("http://localhost:8000/api/orders/", orderData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      alert("Zamówienie zostało złożone pomyślnie!");
      refreshCart(); // Opróżnij koszyk po złożeniu zamówienia
    } catch (error) {
      console.error("Error creating order:", error);
      if (error.response && error.response.data) {
        console.error("Error details:", error.response.data);
      }
    }
  };

  const groupedCartItems = cartItems ? cartItems.reduce((acc, item) => {
    console.log(cartItems[0].product.restaurant);
    const { name, restaurant, price } = item.product;
    if (!acc[restaurant]) {
      acc[restaurant] = [];
    }
    acc[restaurant].push({ ...item, name, price });
    return acc;
  }, {}) : {};

  return (
    <div>
      <h2>Order Page</h2>
      {token ? (
        <>
          <AddressSelector onSelect={handleAddressSelect} /> {/* Wyświetlanie listy adresów */}
          {selectedAddress && (
            <div>
              <h3>Wybrany adres:</h3>
              <p>{selectedAddress.first_name} {selectedAddress.last_name} - {selectedAddress.street} {selectedAddress.building_number} {selectedAddress.apartment_number}, {selectedAddress.postal_code} {selectedAddress.city}, tel. {selectedAddress.phone_number}</p>
            </div>
          )}
          <AddAddressForm onAddAddress={handleAddAddress} />

        </>
      ) : (
        <p>Proszę się zalogować, aby zobaczyć listę adresów.</p>
      )}
      {Object.keys(groupedCartItems).map((restaurantName) => (
              <div key={restaurantName}>
                <h3>{restaurantName}</h3>
                <ul>
                  {groupedCartItems[restaurantName].map((item) => (
                    <li key={item.id}>
                      <img
                        src={item.image ? `${cloudinaryBaseUrl}${item.image}` : placeholderImage}
                        alt={item.name}
                        style={{ width: "300px", height: "auto" }}
                      />
                      <br />
                      {item.name} - {item.quantity} szt. x {item.price} PLN
                      <DeleteProductFromCart 
                        productId={item.product.id} 
                        cartItemId={item.id} 
                        quantity={item.quantity}
                        refreshCart={refreshCart} 
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div>
            <h3>Wybierz typ płatności:</h3>
            <label>
              <input
                type="radio"
                value="online"
                checked={paymentType === 'online'}
                onChange={(e) => setPaymentType(e.target.value)}
              />
              Online
            </label>
          </div>
          <div>
            <h3>Wybierz typ dostawy:</h3>
            <label>
              <input
                type="radio"
                value="pickup"
                checked={deliveryType === 'pickup'}
                onChange={(e) => setDeliveryType(e.target.value)}
              />
              Odbiór osobisty
            </label>
            <label>
              <input
                type="radio"
                value="delivery"
                checked={deliveryType === 'delivery'}
                onChange={(e) => setDeliveryType(e.target.value)}
              />
              Dostawa
            </label>
          </div>
          <div>
            <h3>Notatki do zamówienia:</h3>
            <textarea
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              placeholder="Dodaj notatki do zamówienia"
            />
          </div>
          <button onClick={handleCreateOrder}>Złóż zamówienie</button>
    </div>
  );
};

export default Order;