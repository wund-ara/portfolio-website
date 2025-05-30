import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css'; // Global styles (often empty in React, or just for body/html)
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);