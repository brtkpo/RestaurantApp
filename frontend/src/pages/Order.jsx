import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import AddressSelector from '../components/AddressSelector';
import AddAddressForm from '../components/AddAddressForm';
import { CartContext } from '../components/CartContext';
import DeleteProductFromCart from '../components/DeleteProductFromCart';
import placeholderImage from '../assets/Placeholder.png';
import axios from 'axios';
import loadingGif from '../assets/200w.gif'; 
import Modal from 'react-modal';
import { NotificationContext } from '../components/NotificationContext';  

const Order = () => {
  const token = useSelector((state) => state.token); // Pobieramy token z Redux
  const navigate = useNavigate();
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const { cartId, cartItems, setCartItems, refreshCart } = useContext(CartContext);
  const [paymentType, setPaymentType] = useState('');
  const [deliveryType, setDeliveryType] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [user, setUser] = useState('');
  const [isAddAddressModalOpen, setIsAddAddressModalOpen] = useState(false);
  const [restaurantSettings, setRestaurantSettings] = useState({});
  const [isRestaurantSettingsLoaded, setIsRestaurantSettingsLoaded] = useState(false);
  const [isAddressesLoaded, setIsAddressesLoaded] = useState(false);
  const [isAddressSelectorLoaded, setIsAddressSelectorLoaded] = useState(false); 
  const { setIsCartOpen } = useContext(CartContext);
  const [orderId, setOrderId] = useState(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [error, setError] = useState(false);
  const [isOrdered, setIsOrdered] = useState(false);

  const cloudinaryBaseUrl = "https://res.cloudinary.com/dljau5sfr/";

  const {userRole } = useContext(NotificationContext);

  if(userRole === 'restaurateur') {
    navigate('/restaurant/user'); 
  }

  if(userRole === null) {
    navigate('/login'); 
  }

  useEffect(() => {
    if (!token) {
      navigate('/login'); // moze dodac modal z info nwm
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
      setOrderId(response.data.order_id);

      await refreshCart(); // Opróżnij koszyk po złożeniu zamówienia
      setIsCartOpen(false);
      setModalMessage("Zamówienie zostało złożone pomyślnie!");
      
      //alert("Zamówienie zostało złożone pomyślnie!");
      setIsOrdered(true);
      //navigate(`/user/orders/${orderId}`);
    } catch (error) {
      setModalMessage(error);
      console.error("Error creating order:", error);
      if (error.response && error.response.data) {
        setModalMessage(error.response.data);
      }
    }
    setModalIsOpen(true);
  };

  const groupedCartItems = cartItems ? cartItems.reduce((acc, item) => {
    console.log("cartItems: ",cartItems);
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

  const handleModalClose = () => {
    setModalIsOpen(false);
    setError(false);
    if (isOrdered) {
      navigate(`/user/orders/${orderId}`); // Przekierowanie po zamknięciu modala
    }
  };

  const isMinimumOrderAmountMet = calculateTotalPrice() >= restaurantSettings.minimum_order_amount;
  const isCityInDeliveryCities = deliveryType === 'delivery' && selectedAddress && restaurantSettings.delivery_cities.some(city => city.name === selectedAddress.city);

  if (!isRestaurantSettingsLoaded ) {
    return (
      <div className="flex justify-center items-center h-screen">
        <img src={loadingGif} alt="Loading..." />
      </div>
    );
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

      <div className="mt-10 font-[sans-serif] w-full max-w-xl mx-auto overflow-hidden bg-white rounded-lg shadow-md dark:bg-gray-800 px-6 py-4">
      {Object.keys(groupedCartItems).map((restaurantName) => (
        <div key={restaurantName}>
          <h3 className="mt-2 text-xl font-medium text-center text-gray-800 dark:text-gray-700">{restaurantSettings.name}</h3>
          <ul>
            {groupedCartItems[restaurantName].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).map((item) => (
              <li key={item.id}>
                <img 
                  class="h-auto rounded-lg my-2 mx-auto"
                  src={item.product.image ? `${cloudinaryBaseUrl}${item.product.image}` : placeholderImage}
                  alt={item.product.name}
                  style={{ width: "300px", height: "auto" }}
                />
                <ul className="space-y-4 text-gray-800 list-disc list-inside dark:text-gray-700">
                  <li className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-2">
                      <span className="list-item">{item.name} - {item.quantity} szt. x {item.price} PLN</span>
                    </div>
                    <DeleteProductFromCart 
                      productId={item.product.id} 
                      cartItemId={item.id} 
                      quantity={item.quantity}
                      refreshCart={refreshCart} 
                    />
                  </li>
                </ul>
              </li>
            ))}
          </ul>
          <div>
            <h3 className="mt-2 text-xl font-medium text-center text-gray-800 dark:text-gray-700">Łączna cena: {calculateTotalPrice()} PLN</h3>
          </div>
        </div>
      ))}
      </div>  
      
      <div className="mt-10 mb-10 font-[sans-serif] w-full max-w-xl mx-auto overflow-hidden bg-white rounded-lg shadow-md dark:bg-gray-800 px-6 py-4">
        <div>
          <h3 className="mt-2 text-xl font-medium text-center text-gray-800 dark:text-gray-700">Wybierz typ płatności:</h3>
          <div className="flex justify-around w-full">
            <label style={{ color: restaurantSettings.allows_online_payment ? 'black' : 'gray' }} className="flex items-center">
              <input
                type="radio"
                value="online"
                checked={paymentType === 'online'}
                onChange={(e) => restaurantSettings.allows_online_payment && setPaymentType(e.target.value)}
                disabled={!restaurantSettings.allows_online_payment}
                className="w-4 h-4 accent-gray-600 text-gray-600 bg-gray-100 border-gray-300 focus:ring-gray-500 dark:focus:ring-gray-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <span className="ml-2">Online</span>
            </label>
            <label style={{ color: restaurantSettings.allows_cash_payment ? 'black' : 'gray' }} className="flex items-center">
              <input
                type="radio"
                value="cash"
                checked={paymentType === 'cash'}
                onChange={(e) => restaurantSettings.allows_cash_payment && setPaymentType(e.target.value)}
                disabled={!restaurantSettings.allows_cash_payment}
                className="w-4 h-4 accent-gray-600 text-gray-600 bg-gray-100 border-gray-300 focus:ring-gray-500 dark:focus:ring-gray-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <span className="ml-2">Przy odbiorze</span>
            </label>
          </div>
        </div>
        <div>
          <h3 className="mt-2 text-xl font-medium text-center text-gray-800 dark:text-gray-700">Wybierz typ dostawy:</h3>
          <div className="flex justify-around w-full">
          <label style={{ color: restaurantSettings.allows_delivery ? 'black' : 'gray' }}>
            <input
              type="radio"
              value="delivery"
              checked={deliveryType === 'delivery'}
              onChange={(e) => restaurantSettings.allows_delivery && setDeliveryType(e.target.value)}
              disabled={!restaurantSettings.allows_delivery}
              class="w-4 h-4 accent-gray-600 text-gray-600 bg-gray-100 border-gray-300 focus:ring-gray-500 dark:focus:ring-gray-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
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
              class="w-4 h-4 accent-gray-600 text-gray-600 bg-gray-100 border-gray-300 focus:ring-gray-500 dark:focus:ring-gray-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            Odbiór osobisty
          </label>
          </div>
        </div>
        <div>
          <h3 className="mt-2 text-xl font-medium text-center text-gray-800 dark:text-gray-700">Notatki do zamówienia (opcjonalne):</h3>
          <textarea
            value={orderNotes}
            onChange={(e) => setOrderNotes(e.target.value)}

            className="resize-none h-36 block w-full px-4 py-2 mt-2 text-gray-700 placeholder-gray-500 bg-white border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 focus:border-gray-400 dark:focus:border-gray-300 focus:ring-opacity-40 focus:outline-none focus:ring focus:ring-gray-300"
          />
        </div>
        <div className="pt-2 flex flex-col items-center justify-center text-center">
          {!selectedAddress ? (
            <div>
              {deliveryType === 'delivery' ? (
                <p>Proszę wybrać adres dostawy.</p>
              ) : (
                <p>Proszę wybrać adres.</p>
              )}
            </div>
          ) : (
            <>
              {!paymentType ? (
                <p>Proszę wybrać metodę płatności.</p>
              ) : !deliveryType ? (
                <p>Proszę wybrać metodę dostawy.</p>
              ) : isMinimumOrderAmountMet ? (
                deliveryType === 'pickup' || isCityInDeliveryCities ? (
                  <button 
                    onClick={handleCreateOrder}
                    className="mt-2 px-6 py-2 text-sm font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-gray-800 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring focus:ring-gray-300 focus:ring-opacity-50"
                    >Złóż zamówienie</button>
                ) : (
                  <p className="pt-2 mt-2 text-xl font-medium text-center text-gray-800 dark:text-gray-700">Restauracja {restaurantSettings.name} nie dostarcza do miasta {selectedAddress.city}</p>
                )
              ) : (
                <p className="pt-2 mt-2 text-xl font-medium text-center text-gray-800 dark:text-gray-700">Minimalna kwota zamówienia dla {restaurantSettings.name} to: {restaurantSettings.minimum_order_amount} PLN</p>
              )}
            </>
          )}
        </div>
      </div>
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={() => setModalIsOpen(false)}
        contentLabel="Error Modal"
        className="fixed inset-0 z-10 overflow-y-auto flex items-center justify-center transition duration-300 ease-out transform"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 transition duration-300 ease-out"
      >
        <div className="relative inline-block px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl rtl:text-right dark:bg-gray-900 sm:my-8 sm:align-middle sm:max-w-sm sm:w-full sm:p-6">
          <div className="mt-2 text-center">
            {(error) ? (
                <h3 className="text-lg font-medium leading-6 text-red-800 capitalize dark:text-white" id="modal-title">Błąd</h3>
              ) : (<h3 className="text-lg font-medium leading-6 text-gray-800 capitalize dark:text-white" id="modal-title">Sukces!</h3>)}
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{modalMessage}</p>
          </div>
          <div className="mt-5 sm:flex sm:items-center sm:justify-center">
            <div className="sm:flex sm:items-center">
              <button
                onClick={handleModalClose}
                className="w-full px-4 py-2 mt-2 text-sm font-medium tracking-wide text-gray-700 capitalize transition-colors duration-300 transform border border-gray-200 rounded-md sm:mt-0 sm:w-auto sm:mx-2 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-800 hover:bg-gray-100 focus:outline-none focus:ring focus:ring-gray-300 focus:ring-opacity-40"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Order;