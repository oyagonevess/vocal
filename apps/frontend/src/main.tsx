import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App.js';
import { AuthProvider } from './context/AuthContext.js';
import { RTCProvider } from './context/RTCContext.js';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <RTCProvider>
        <App />
      </RTCProvider>
    </AuthProvider>
  </React.StrictMode>
);

