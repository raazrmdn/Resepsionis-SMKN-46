import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global error handling for better debugging of "Failed to fetch"
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled Promise Rejection:', event.reason);
  if (event.reason instanceof Error && event.reason.message === 'Failed to fetch') {
    console.error('Network error detected. This usually means the API endpoint is unreachable or CORS blocked.');
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
