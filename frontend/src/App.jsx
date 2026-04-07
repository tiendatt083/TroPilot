import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import RoleSelectionPage from './pages/RoleSelectionPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import LandlordHomePage from './pages/LandlordHomePage';
import TenantHomePage from './pages/TenantHomePage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RoleSelectionPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/landlord-home" element={<LandlordHomePage />} />
        <Route path="/tenant-home" element={<TenantHomePage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
