import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import './index.css'; // Tailwind or global styles

// 🎬 Mounting the ShowSnap App
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    {/* 🌐 Global Routing */}
    <BrowserRouter>
      {/* 🔐 Authentication Provider */}
      <AuthProvider>
        {/* 🎥 Main Application */}
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
