import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import loadingGif from '../assets/200w.gif'; 

const ArchivedRestaurantOrders = ({ restaurantId }) => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 5;
  const sortedOrders = [...orders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = sortedOrders.slice(indexOfFirstOrder, indexOfLastOrder);

  const statusLabels = {
    pending: 'Złożone',
    confirmed: 'Potwierdzone',
    shipped: 'Wydane do dostarczenia',
    delivered: 'Dostarczone',
    cancelled: 'Anulowane',
    ready_for_pickup: 'Gotowe do odbioru',
    picked_up: 'Odebrane',
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = sessionStorage.getItem('authToken');
        const response = await axios.get(`http://localhost:8000/api/restaurant/${restaurantId}/archived-orders/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setOrders(response.data);
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
        <h3 className="mt-2 text-xl font-medium text-center text-gray-800 dark:text-gray-700">Zarchiwizowane zamówienia</h3>
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
      <h3 className="mt-2 text-xl font-medium text-center text-gray-800 dark:text-gray-700">Zarchiwizowane zamówienia dla restauracji</h3>
      <div className="font-[sans-serif] w-full max-w-xl mx-auto overflow-hidden bg-white rounded-lg shadow-md dark:bg-gray-800 px-6 py-4">
        {orders.length === 0 ? (
          <p>Brak zarchiwizowanych zamówień.</p>
        ) : (
          <ul>
            {currentOrders.map((order) => (
              <li key={order.order_id}>
                <h3 className="mt-2 text-lg font-medium text-center text-gray-800 dark:text-gray-700">Zamówienie nr.{order.order_id}</h3>
                <ul className="text-gray-800 list-disc list-inside dark:text-gray-700">
                  <li>Status: {statusLabels[order.status]}</li>
                  <li>Data: {new Date(order.created_at).toLocaleString()}</li>
                </ul>
                <div className="mt-2 text-center font-[sans-serif]">
                  <button onClick={() => navigate(`/order/${order.order_id}`)} className="px-6 py-2 text-sm font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-gray-800 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring focus:ring-gray-300 focus:ring-opacity-50">
                    Szczegóły zamówienia
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="flex justify-center mt-4">
          {Array.from({ length: Math.ceil(orders.length / ordersPerPage) }, (_, index) => (
            <button
              key={index + 1}
              onClick={() => paginate(index + 1)}
              className={`px-4 py-2 mx-1 text-sm font-medium ${currentPage === index + 1 ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-800'} rounded-lg hover:bg-gray-700 focus:outline-none focus:ring focus:ring-gray-300 focus:ring-opacity-50`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ArchivedRestaurantOrders;