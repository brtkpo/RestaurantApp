import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import loadingGif from '../assets/200w.gif'; 

const RestaurantOrders = ({ restaurantId }) => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

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

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = sessionStorage.getItem('authToken');
        const response = await axios.get(`http://localhost:8000/api/restaurant/${restaurantId}/orders/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setOrders(response.data);
        console.log("orders: ", orders);
      } catch (err) {
        setError('Błąd podczas ładowania zamówień');
      }
      setIsLoading(false);
    };

    fetchOrders();
  }, [restaurantId]);

    if (isLoading) {
      return (
        <div>
          <h3 className="mt-2 text-xl font-medium text-center text-gray-800 dark:text-gray-700">Moje zamówienia</h3>
          <div className="font-[sans-serif] w-full max-w-xl mx-auto overflow-hidden bg-white rounded-lg shadow-md dark:bg-gray-800 px-6 py-4">
            <div className="flex justify-center items-center">
              <img src={loadingGif} alt="Loading..." />
            </div>
          </div>
        </div>
      );
    }

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  return (
    <div>
      <h3 className="mt-2 text-xl font-medium text-center text-gray-800 dark:text-gray-700">Zamówienia dla restauracji</h3>
      <div className="font-[sans-serif] w-full max-w-xl mx-auto overflow-hidden bg-white rounded-lg shadow-md dark:bg-gray-800 px-6 py-4">
        {orders.length === 0 ? (
          <p>Brak zamówień.</p>
        ) : (
          <ul>
            {orders.map((order) => (
              <li key={order.order_id}>
                <h3 className="mt-2 text-xl font-medium text-center text-gray-800 dark:text-gray-700">Zamówienie nr.{order.order_id}</h3>
                <ul className=" text-gray-800 list-disc list-inside dark:text-gray-700">
                  <li>Status: {statusLabels[order.status]}</li>
                  <li>Data: {new Date(order.created_at).toLocaleString()}</li>
                  <li>Typ płatności: {order.payment_type}</li>
                  <li>Typ dostawy: {order.delivery_type}</li>
                  <li>Notatki: {order.order_notes}</li>
                  <li>Adres: {order.address.first_name} {order.address.last_name}, {order.address.street} {order.address.building_number} {order.address.apartment_number}, {order.address.postal_code} {order.address.city}</li>
                </ul>

                <h3 className="mt-2 text-lg font-medium text-center text-gray-800 dark:text-gray-700">Produkty:</h3>
                <ul className=" text-gray-800 list-disc list-inside dark:text-gray-700">
                  {order.items.map((item) => (
                    <li key={item.id}>
                      {item.product.name} - {item.quantity} szt.
                    </li>
                  ))}
                </ul>
                <div className="flex justify-center items-center text-gray-800 list-disc list-inside dark:text-gray-700">
                  <p>Suma: {order.total_price} PLN</p>
                  </div>
                <div className="mt-2 text-center font-[sans-serif]">
                  <button onClick={() => navigate(`/order/${order.order_id}`)} className=" px-6 py-2 text-sm font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-gray-800 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring focus:ring-gray-300 focus:ring-opacity-50">
                    Szczegóły zamówienia
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default RestaurantOrders;