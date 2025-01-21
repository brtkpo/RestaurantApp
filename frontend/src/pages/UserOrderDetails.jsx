import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import CheckoutButton from '../components/CheckoutButton';
import Chat from '../components/Chat';
import loadingGif from '../assets/200w.gif'; 

const UserOrderDetails = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);

  const statusLabels = {
    pending: 'Złożone',
    confirmed: 'Potwierdzone',
    shipped: 'Wydane do dostarczenia',
    delivered: 'Dostarczone',
    cancelled: 'Anulowane',
    ready_for_pickup: 'Gotowe do odbioru',
    picked_up: 'Odebrane',
  };

  useEffect(() => {
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

    fetchOrderDetails();
  }, [orderId]);

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
        <p style={{ color: 'red' }}>{error}</p>;
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
    </div>
  );
};

export default UserOrderDetails;