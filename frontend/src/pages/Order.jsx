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
  const [isAddAddressModalOpen, setIsAddAddressModalOpen] = useState(false);
  const [restaurantSettings, setRestaurantSettings] = useState({});
  const [isRestaurantSettingsLoaded, setIsRestaurantSettingsLoaded] = useState(false);
  const [isAddressesLoaded, setIsAddressesLoaded] = useState(false);
  const { setIsCartOpen } = useContext(CartContext);

  const cloudinaryBaseUrl = "https://res.cloudinary.com/dljau5sfr/";

  useEffect(() => {
    if (!token) {
      navigate('/login'); // Przekierowanie na stronę logowania, jeśli użytkownik nie jest zalogowany
    }
  }, [token, navigate]);

  useEffect(() => {
    setIsCartOpen(false); // Zamknij koszyk, gdy użytkownik jest na stronie zamówienia
  }, [setIsCartOpen]);

  useEffect(() => {
    const fetchRestaurantSettings = async () => {
      const parsedCartId = parseInt(cartId, 10);
      console.log('Parsed cartId:', parsedCartId);
      if (parsedCartId && !isNaN(parsedCartId)) {
        try {
          const response = await axios.get(`http://localhost:8000/api/cart/${parsedCartId}/restaurant-info/`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (response.data && Object.keys(response.data).length > 0) {
            setRestaurantSettings(response.data);
            console.log("Restaurant settings:", response.data);
          } else {
            console.error("Received empty restaurant settings");
          }
        } catch (error) {
          console.error("Error fetching restaurant settings:", error);
        }
        finally {

          setIsRestaurantSettingsLoaded(true); // Ustawienie flagi na true
          console.log("isRestaurantSettingsLoaded:", isRestaurantSettingsLoaded);
          console.log("isAddressesLoaded:", isAddressesLoaded);
        }
      } else {
        //console.error("Invalid cartId:", parsedCartId);
      }
    };
    fetchRestaurantSettings();
  }, [cartId, token]);

  useEffect(() => {
      console.log(restaurantSettings);
      console.log(restaurantSettings.allows_online_payment);
  }, [restaurantSettings]);

  const handleAddressSelect = (address) => {
    setSelectedAddress(address);
    setUser(address.user);
  };

  const handleAddAddress = (newAddress) => {
    setAddresses([...addresses, newAddress]);
    setIsAddAddressModalOpen(false);
    setSelectedAddress(newAddress);
  };

  const openAddAddressModal = () => {
    setIsAddAddressModalOpen(true);
  };

  const closeAddAddressModal = () => {
    setIsAddAddressModalOpen(false);
  };

  const refreshAddresses = () => {
    // Funkcja do odświeżenia adresów
    fetchAddresses();
  };

  const fetchAddresses = async () => {
    const token = sessionStorage.getItem('authToken');
    try {
      const response = await axios.get('http://localhost:8000/api/addresses/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data.length === 0) {
        setAddresses([]);
      } else {
        setAddresses(response.data);
      }
    } catch (error) {
      console.error('Błąd podczas ładowania adresów', error);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

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
      const orderId = response.data.order_id;

      await refreshCart(); // Opróżnij koszyk po złożeniu zamówienia
      setIsCartOpen(false);
      alert("Zamówienie zostało złożone pomyślnie!");
      navigate(`/user/orders/${orderId}`);
    } catch (error) {
      console.error("Error creating order:", error);
      if (error.response && error.response.data) {
        console.error("Error details:", error.response.data);
      }
    }
  };

  const groupedCartItems = cartItems ? cartItems.reduce((acc, item) => {
    console.log(cartItems);
    const { name, restaurant, price } = item.product;
    if (!acc[restaurant]) {
      acc[restaurant] = [];
    }
    acc[restaurant].push({ ...item, name, price });
    return acc;
  }, {}) : {};

  const calculateTotalPrice = () => {
    return cartItems.reduce((total, item) => total + item.quantity * item.product.price, 0);
  };

  const isMinimumOrderAmountMet = calculateTotalPrice() >= restaurantSettings.minimum_order_amount;
  const isCityInDeliveryCities = deliveryType === 'delivery' && selectedAddress && restaurantSettings.delivery_cities.some(city => city.name === selectedAddress.city);

  if (!isRestaurantSettingsLoaded) {
    return <div>Ładowanie danych...</div>; // Możesz tu wstawić spinner lub komunikat ładowania
  }

  return (
    <div>
      <h3 className="mt-10 text-xl font-medium text-center text-gray-800 dark:text-gray-700">Dokończ zamówienie!</h3>
      {token ? (
        <div className="font-[sans-serif] w-full max-w-xl mx-auto overflow-hidden bg-white rounded-lg shadow-md dark:bg-gray-800 px-6 py-4">
          <AddressSelector onSelect={handleAddressSelect} onAddAddress={refreshAddresses} /> 
          <div className='flex justify-center'>
            <button onClick={openAddAddressModal} className=" px-6 py-2 text-sm font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-gray-800 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring focus:ring-gray-300 focus:ring-opacity-50">
              Dodaj nowy adres
            </button>
          </div> 
          <AddAddressForm isOpen={isAddAddressModalOpen} onRequestClose={closeAddAddressModal} onAddAddress={refreshAddresses} />
          {selectedAddress && (
            <div className="text-center">
              <h3 className="mt-2 text-xl font-medium text-center text-gray-800 dark:text-gray-700">Wybrany adres:</h3>
              <span className="ml-2 text-slate-600 text-sm ">
                {selectedAddress.first_name} {selectedAddress.last_name} - {selectedAddress.street} {selectedAddress.building_number} {selectedAddress.apartment_number}, {selectedAddress.postal_code} {selectedAddress.city}, tel. {selectedAddress.phone_number}
              </span>
            </div>
          )}
        </div>
      ) : (
        <p className="mt-10 px-6 py-2 text-sm font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-gray-800 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring focus:ring-gray-300 focus:ring-opacity-50">Proszę się zalogować, aby zobaczyć listę adresów.</p>
      )}
      {Object.keys(groupedCartItems).map((restaurantName) => (
        <div key={restaurantName}>
          <h3>{restaurantSettings.name}</h3>
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
          <div>
            <h3>Łączna cena: {calculateTotalPrice()} PLN</h3>
          </div>
        </div>
      ))}
      <div>
        <h3>Wybierz typ płatności:</h3>
        <label style={{ color: restaurantSettings.allows_online_payment ? 'black' : 'gray' }}>
          <input
            type="radio"
            value="online"
            checked={paymentType === 'online'}
            onChange={(e) => restaurantSettings.allows_online_payment && setPaymentType(e.target.value)}
            disabled={!restaurantSettings.allows_online_payment}
          />
          Online
        </label>
        <label style={{ color: restaurantSettings.allows_cash_payment ? 'black' : 'gray' }}>
          <input
            type="radio"
            value="cash"
            checked={paymentType === 'cash'}
            onChange={(e) => restaurantSettings.allows_cash_payment && setPaymentType(e.target.value)}
            disabled={!restaurantSettings.allows_cash_payment}
          />
          Przy odbiorze
        </label>
      </div>
      <div>
        <h3>Wybierz typ dostawy:</h3>
        <label style={{ color: restaurantSettings.allows_delivery ? 'black' : 'gray' }}>
          <input
            type="radio"
            value="delivery"
            checked={deliveryType === 'delivery'}
            onChange={(e) => restaurantSettings.allows_delivery && setDeliveryType(e.target.value)}
            disabled={!restaurantSettings.allows_delivery}
          />
          Dostawa kurierem
        </label>
        <label style={{ color: restaurantSettings.allows_pickup ? 'black' : 'gray' }}>
          <input
            type="radio"
            value="pickup"
            checked={deliveryType === 'pickup'}
            onChange={(e) => restaurantSettings.allows_pickup && setDeliveryType(e.target.value)}
            disabled={!restaurantSettings.allows_pickup}
          />
          Odbiór osobisty
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
      <div>
        {!selectedAddress && deliveryType === 'delivery' ? (
          <p>Proszę wybrać adres dostawy.</p>
        ) : (
          <>
            {isMinimumOrderAmountMet ? (
              deliveryType === 'pickup' || isCityInDeliveryCities ? (
                <button onClick={handleCreateOrder}>Złóż zamówienie</button>
              ) : (
                <p>Restauracja {restaurantSettings.name} nie dostarcza do miasta {selectedAddress.city}</p>
              )
            ) : (
              <p>Minimalna kwota zamówienia dla {restaurantSettings.name} to: {restaurantSettings.minimum_order_amount} PLN</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Order;