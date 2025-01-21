import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Chat = ({ roomName, archived = false , mainUserId, restaurant = false}) => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [sentByClient, setSentByClient] = useState(false); // Flaga do śledzenia, czy wiadomość jest wysyłana przez klienta

  function getCSRFToken() {
    const csrfToken = document.cookie.split(';').find(cookie => cookie.trim().startsWith('csrftoken='));
    return csrfToken ? csrfToken.split('=')[1] : '';
  }

  // Funkcja do ustanowienia połączenia WebSocket
  const connectWebSocket = (url) => {
    return new Promise((resolve, reject) => {

      const token = sessionStorage.getItem('authToken');
      if (!token) {
        console.error("Token is missing!");
        reject("Token is missing");
        return;
      }
      console.log(token);

      const wsUrl = `${url}?token=${token}`;
      const ws = new WebSocket(wsUrl, [], {
        headers: {
          'Authorization': `Bearer ${token}`,  // Dodajemy token do nagłówka
        }
      });

      ws.onopen = () => {
        console.log('WebSocket connection established');
        resolve(ws); // Rozwiązujemy obietnicę po ustanowieniu połączenia
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error); // Odrzucamy obietnicę w przypadku błędu
      };

      ws.onclose = (event) => {
        console.warn('WebSocket connection closed:', event.code, event.reason);
      };

    });
  };

  useEffect(() => {
    let ws;

    const setupWebSocket = async () => {
      try {
        ws = await connectWebSocket(`ws://localhost:8000/ws/chat/${roomName}/`);
        setSocket(ws); // Przypisanie gniazda WebSocket do stanu

        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          console.log('Received message from WebSocket:', data); // Logowanie odpowiedzi z WebSocket
          const newMessage = {
            user: data.user,
            message: data.message,
            timestamp: new Date(data.timestamp).toLocaleString() // Parsowanie i formatowanie daty
          };
          // Jeśli wiadomość pochodzi od klienta, nie dodawaj jej ponownie
          if (!sentByClient) {
            setMessages((prevMessages) => {
              // Sprawdź, czy wiadomość już istnieje
              const lastMessage = prevMessages[prevMessages.length - 1];
              if (lastMessage && lastMessage.message === newMessage.message && lastMessage.timestamp === newMessage.timestamp) {
                return prevMessages;
              }
              return [...prevMessages, newMessage];
            });
          }
        };
      } catch (error) {
        console.error('Failed to establish WebSocket connection:', error);
        setTimeout(setupWebSocket, 1000); // Automatyczne ponowne połączenie po 1 sekundzie
      }
    };

    setupWebSocket();

    // Zamknięcie połączenia WebSocket przy odmontowaniu komponentu
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [roomName, sentByClient]); // Zależność na `sentByClient`, aby zaktualizować stan po wysłaniu wiadomości

  useEffect(() => {
    // Fetch previous messages
    const fetchMessages = async () => {
      try {
        const token = sessionStorage.getItem('authToken');
        const response = await axios.get(`http://localhost:8000/api/chat/${roomName}/messages/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log(response.data);
        const formattedMessages = response.data.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp).toLocaleString() // Parsowanie i formatowanie daty
        }));
        setMessages(formattedMessages);
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      }
    };

    fetchMessages();
  }, [roomName]);

  const sendMessage = () => {
    if (message.trim() === '') {
      console.error('Cannot send an empty message.');
      return;
    }

    if (socket && socket.readyState === WebSocket.OPEN) {
      setSentByClient(true); // Ustawiamy flagę na true, że wiadomość jest wysyłana przez klienta
      socket.send(JSON.stringify({ message }));
      setMessage(''); // Czyszczenie pola tekstowego po wysłaniu wiadomości
    } else {
      console.error('WebSocket is not open. Cannot send message.');
    }
  };

  return (
    <div>
      <h3 className="mt-2 text-xl font-medium text-center text-gray-800 dark:text-gray-700">Chat do zamówienia nr. {roomName}</h3>
      <div className="font-[sans-serif] w-full max-w-xl mx-auto overflow-hidden bg-white rounded-lg shadow-md dark:bg-gray-800 px-6 py-4">
      {messages.map((msg, index) => (
        restaurant === false ? (
          mainUserId === msg.user ? (
            <div key={index} className="flex flex-col items-end mb-2">
              <div className="px-3.5 py-2 bg-gray-800 text-white rounded-lg inline-flex items-center gap-3 ml-auto max-w-[90%]">
                <div>{msg.message}</div>
              </div>
              <h6 className="text-gray-400 text-xs font-normal leading-4 py-1 self-end">{msg.timestamp}</h6>
            </div>
          ) : (
            <div key={index} className="flex flex-col items-start mb-2">
              <div className="px-3.5 py-2 bg-gray-100 rounded-lg inline-flex items-center gap-3 mr-auto max-w-[90%]">
                <div>{msg.message}</div>
              </div>
              <h6 className="text-gray-500 text-xs font-normal leading-4 py-1 self-start">{msg.timestamp}</h6>
            </div>
          )
        ) : (
          mainUserId === msg.user ? (
            <div key={index} className="flex flex-col items-start mb-2">
              <div className="px-3.5 py-2 bg-gray-100 rounded-lg inline-flex items-center gap-3 mr-auto max-w-[90%]">
                <div>{msg.message}</div>
              </div>
              <h6 className="text-gray-500 text-xs font-normal leading-4 py-1 self-start">{msg.timestamp}</h6>
            </div>
          ) : (
            <div key={index} className="flex flex-col items-end mb-2">
              <div className="px-3.5 py-2 bg-gray-800 text-white rounded-lg inline-flex items-center gap-3 ml-auto max-w-[90%]">
                <div>{msg.message}</div>
              </div>
              <h6 className="text-gray-400 text-xs font-normal leading-4 py-1 self-end">{msg.timestamp}</h6>
            </div>
          )
        )
      ))}
        {!archived && (
        <>
          <div className="flex items-center space-x-2 mt-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)} // Zmiana tekstu w polu wejściowym
              placeholder='Napisz wiadomość'
              className="flex-grow px-4 py-2 text-gray-700 placeholder-gray-500 bg-white border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 focus:border-gray-400 dark:focus:border-gray-300 focus:ring-opacity-40 focus:outline-none focus:ring focus:ring-gray-300"
            />
            <button onClick={sendMessage} className="px-6 py-2 text-sm font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-gray-800 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring focus:ring-gray-300 focus:ring-opacity-50">
              Wyślij
            </button>
          </div>
        </>
      )}
      </div>
    </div>
  );
};

export default Chat;