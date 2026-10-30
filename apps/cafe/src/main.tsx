import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ScenarioProvider } from './context/ScenarioContext';
import { CartProvider } from './context/CartContext';
import App from './App';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <ScenarioProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </ScenarioProvider>
    </BrowserRouter>
  </React.StrictMode>
);

