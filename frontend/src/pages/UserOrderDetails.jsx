import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import CheckoutButton from '../components/CheckoutButton';
import Chat from '../components/Chat';
import loadingGif from '../assets/200w.gif'; 
import { NotificationContext } from '../components/NotificationContext'; 
import Modal from 'react-modal';

const UserOrderDetails = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const { notifications, markAsRead, markNotificationsAsReadByOrder } = useContext(NotificationContext);

  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [showPaymentFail, setShowPaymentFail] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const location = useLocation();
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    if (query.get('payment') === 'success') {
      setShowPaymentSuccess(true);
    } else if (query.get('payment') === 'fail') {
      setShowPaymentFail(true);
    }
    setIsModalOpen(true);
  }, [location]);
  
  useEffect(() => {
    const notification = notifications.find((n) => n.order === parseInt(orderId));
    if (notification) {
      markAsRead(notification.id);
    }
  }, [orderId, notifications, markAsRead]);

  useEffect(() => {
      const ws = new WebSocket(`ws://localhost:8000/ws/notifications/?token=${sessionStorage.getItem('authToken')}`);
  
      ws.onopen = () => {
        console.log('WebSocket connection opened');
      };
  
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', data);
        if (data.type === 'notification' && data.order === parseInt(orderId)) {
          console.log("mark " ,data.order);
          markNotificationsAsReadByOrder(data.order);
          fetchOrderDetails();
        }
      };
  
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
  
      ws.onclose = () => {
        console.log('WebSocket connection closed');
      };
  
      return () => {
        ws.close();
      };
    }, [orderId, markAsRead]);

  const statusLabels = {
    pending: 'Złożone',
    confirmed: 'Potwierdzone',
    shipped: 'Wydane do dostarczenia',
    delivered: 'Dostarczone',
    cancelled: 'Anulowane',
    ready_for_pickup: 'Gotowe do odbioru',
    picked_up: 'Odebrane',
    suspended: 'Wstrzymane',
    resumed: 'Wznowione',
  };

  const fetchOrderDetails = async () => {
    try {
      const token = sessionStorage.getItem('authToken');
      const response = await axios.get(`http://localhost:8000/api/user/orders/${orderId}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setOrder(response.data);
      setLoading(false);
      console.log('order',response.data);
      setUserId(response.data.user);
      console.log(response.data.archived);
    } catch (error) {
      setError('Błąd podczas ładowania szczegółów zamówienia');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  if (loading) {
    return (
    <div className="flex justify-center items-center h-screen">
      <img src={loadingGif} alt="Loading..." />
    </div>
    );
  }

  if (error) {
    return(
      <div>
        <div className="text-center mt-10  font-[sans-serif] w-full max-w-xl mx-auto overflow-hidden bg-white rounded-lg shadow-md dark:bg-gray-800 px-6 py-4">
          <p style={{ color: 'red' }}>{error}</p>
        </div>
         <div className="mt-2 mb-10 text-center">
          <button onClick={() => navigate('/user')} className=" px-6 py-2 text-sm font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-gray-800 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring focus:ring-gray-300 focus:ring-opacity-50">Powrót</button>
        </div>
      </div>);
  }

  return (
    <div>
      <h3 className="mt-10 text-xl font-medium text-center text-gray-800 dark:text-gray-700">Szczegóły zamówienia nr. {order.order_id}</h3>
      {order && (
        <div className="font-[sans-serif] w-full max-w-xl mx-auto overflow-hidden bg-white rounded-lg shadow-md dark:bg-gray-800 px-6 py-4">
          <ul className=" text-gray-800 list-disc list-inside dark:text-gray-700">
            <li>Status: {statusLabels[order.status]}</li>
            <li>Data: {new Date(order.created_at).toLocaleString()}</li>
            <li>Typ płatności: {order.payment_type}</li>
            <li>Typ dostawy: {order.delivery_type}</li>
            <li>Notatki: {order.order_notes ? order.order_notes : 'brak'}</li>
            <li>Adres: {order.address.first_name} {order.address.last_name}, {order.address.street} {order.address.building_number} {order.address.apartment_number}, {order.address.postal_code} {order.address.city}</li>
            <li>Restauracja: {order.restaurant.name}</li>
          </ul>
          
          <p className=" text-gray-800 dark:text-gray-700">Produkty:</p>
          <ul className="space-y-4 text-gray-800 list-disc list-inside dark:text-gray-700">
            {order.items.map((item) => (
              <li key={item.id}>
                {item.product.name} - {item.quantity} szt. x {item.product.price} PLN
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-center text-center space-x-2">
            <p className=" text-gray-800 dark:text-gray-700">Suma: {order.total_price} PLN</p>
          </div>
          {order.payment_type === "online" && !order.is_paid && !order.archived &&(
            <div className="mt-2 text-center">
              <CheckoutButton
                email={order.address.email}
                orderId={order.order_id}
                restaurant={order.restaurant.name}
                totalAmount={order.total_price}
              />
            </div>
            
          )}
          {order.payment_type === "online" && order.is_paid && (
            <div className="flex items-center justify-center text-center space-x-2 text-gray-800 dark:text-gray-700">
              <p>Zapłacono online</p>
            </div>
          )}
        </div>
      )}
      <div className="mt-2 text-center">
        <button onClick={() => navigate('/user')} className=" px-6 py-2 text-sm font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-gray-800 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring focus:ring-gray-300 focus:ring-opacity-50">Powrót</button>
      </div>
      
      <Chat roomName={order.order_id} archived={order.archived} mainUserId={userId} />
      <h3 className="mt-10 text-xl font-medium text-center text-gray-800 dark:text-gray-700">Historia zamówienia</h3>
      <div className="font-[sans-serif] w-full max-w-xl mx-auto overflow-hidden bg-white rounded-lg shadow-md dark:bg-gray-800 px-6 pt-4 pb-2">
        <ul className="text-gray-800 list-disc list-inside dark:text-gray-700">
          {order.history.length === 0 ? (
            <div className="flex items-center justify-center text-center space-x-2">
              <p>Brak historii</p>
            </div>
            
          ) : (
            order.history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map((entry) => (
              <li key={entry.id} className="flex flex-col items-center">
                <div className="flex items-center space-x-2">
                  <span className="list-item">Status: {statusLabels[entry.status]}</span>
                </div>
                <p>Data: {new Date(entry.timestamp).toLocaleString()}</p>
                {entry.description && <p>Opis: {entry.description}</p>}
              </li>
            ))
          )}
        </ul>
      </div>
      <div className="mt-2 mb-10 text-center">
        <button onClick={() => navigate('/user')} className="px-6 py-2 text-sm font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-gray-800 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring focus:ring-gray-300 focus:ring-opacity-50">
          Powrót
        </button>
      </div>
      {/*showPaymentSuccess && <div style={styles.popup_success}>Płatność zakończona sukcesem!</div>*/}
      {/*showPaymentFail && <div style={styles.popup_fail}>Płatność nie powiodła się!</div>*/}  
      {(showPaymentSuccess || showPaymentFail) && (
        <Modal
          isOpen={isModalOpen}
          onRequestClose={() => setIsModalOpen(false)}
          contentLabel="Error Modal"
          className="fixed inset-0 z-10 overflow-y-auto flex items-center justify-center transition duration-300 ease-out transform"
          overlayClassName="fixed inset-0 bg-black bg-opacity-50 transition duration-300 ease-out"
        >
          <div className="relative inline-block px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl rtl:text-right dark:bg-gray-900 sm:my-8 sm:align-middle sm:max-w-sm sm:w-full sm:p-6">
            <div className="mt-2 text-center">
              {(showPaymentFail) ? (
                  <h3 className="text-lg font-medium leading-6 text-red-800 capitalize dark:text-white" id="modal-title">Błąd płatności!</h3>
                ) : (<h3 className="text-lg font-medium leading-6 text-gray-800 capitalize dark:text-white" id="modal-title">Zapłacono pomyślnie!</h3>)}
            </div>
            <div className="mt-4 flex justify-center">
              <button
                onClick={handleModalClose}
                className="w-full px-4 py-2 mt-2 text-sm font-medium tracking-wide text-gray-700 capitalize transition-colors duration-300 transform border border-gray-200 rounded-md sm:mt-0 sm:w-auto sm:mx-2 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-800 hover:bg-gray-100 focus:outline-none focus:ring focus:ring-gray-300 focus:ring-opacity-40"
              >
                OK
              </button>
            </div>
          </div>
        </Modal>
      )}
      {!order.archived && (
      <footer class="bg-white dark:bg-gray-900">
        <div class="container flex flex-col items-center justify-center p-6 mx-auto space-y-4 sm:space-y-0 sm:flex-row">
          <p class="text-base text-gray-600 dark:text-gray-300 text-center">Masz problemy z zamówieniem? Skontaktuj się z Administratorem: admin@admin.com</p>
        </div>
      </footer>)}
    </div>
  );
};

export default UserOrderDetails;