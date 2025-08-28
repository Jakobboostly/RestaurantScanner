import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'

const root = document.getElementById('root');
if (!root) {
  console.error('Root element not found');
} else {
  console.log('Rendering app to root element');
  try {
    ReactDOM.createRoot(root).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    )
  } catch (error) {
    console.error('Error rendering app:', error);
  }
}