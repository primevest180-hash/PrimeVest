import React from 'react'
import ReactDOM from 'react-dom/client'
// Make sure this path matches your file name exactly (app.jsx or App.jsx)
import App from './app.jsx' 
import './index.css' // Keep this if you have a global CSS file

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)