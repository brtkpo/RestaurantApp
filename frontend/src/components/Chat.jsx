import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Chat = ({ roomName }) => {
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
            setMessages((prevMessages) => [...prevMessages, newMessage]);
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
      <div>
        {messages.map((msg, index) => (
          <div key={index}>
            <strong>{msg.user}:</strong> {msg.message} <em>({msg.timestamp})</em>
          </div> // Wyświetlanie wiadomości
        ))}
      </div>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)} // Zmiana tekstu w polu wejściowym
      />
      <button onClick={sendMessage}>Send</button> {/* Przycisk do wysyłania wiadomości */}
    </div>
  );
};

export default Chat;