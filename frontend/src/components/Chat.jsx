import React, { useState, useEffect } from 'react';

const Chat = ({ roomName }) => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [sentByClient, setSentByClient] = useState(false); // Flaga do śledzenia, czy wiadomość jest wysyłana przez klienta

  // Funkcja do ustanowienia połączenia WebSocket
  const connectWebSocket = (url) => {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url);

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
          const newMessage = data.message;

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
          <div key={index}>{msg}</div> // Wyświetlanie wiadomości
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
