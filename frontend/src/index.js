import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App'; // Importujemy naszą aplikację
import reportWebVitals from './reportWebVitals';
import AuthProvider from './components/AuthProvider';
import { Provider } from 'react-redux'; // Importujemy Provider z react-redux
import store from './redux/store';

const root = ReactDOM.createRoot(document.getElementById('root')); // Sprawdzamy, czy `root` jest poprawnie ustawione
root.render(
  <React.StrictMode>
    <Provider store={store}>
    <AuthProvider> {/* Zajmuje się synchronizacją tokena */}
      <App />
    </AuthProvider>
  </Provider>
  </React.StrictMode>
);

// Jeśli chcesz, możesz włączyć metryki wydajności (opcjonalnie)
reportWebVitals();
