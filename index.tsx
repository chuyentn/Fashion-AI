
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './i18n';
import { ThemeProvider } from './components/ThemeContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Polyfill process.env for runtime API key injection
if (typeof (window as any).process === 'undefined') {
  (window as any).process = { env: {} };
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);

// Service Worker registration disabled to prevent "origin mismatch" errors in preview environments (e.g. Google IDX, StackBlitz).
// Uncomment the block below only for production deployments on standard domains.

/*
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}
*/
