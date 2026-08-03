import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import './i18n.js';
import './styles/global.css';

// Điểm bắt đầu React: gắn App vào thẻ #root, áp dụng theme toàn cục và kiểm tra StrictMode khi phát triển.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
