import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import ChangePasswordPage from '../pages/auth/ChangePasswordPage.jsx';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage.jsx';
import LoginPage from '../pages/auth/LoginPage.jsx';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage.jsx';
import { adminRoutes } from './adminRoutes.jsx';
import HomeRedirect from './HomeRedirect.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';
import { residentRoutes } from './residentRoutes.jsx';
import { staffRoutes } from './staffRoutes.jsx';

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/change-password" element={<ChangePasswordPage />} />
          <Route path="/settings" element={<HomeRedirect />} />
          {adminRoutes}
          {staffRoutes}
          {residentRoutes}
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
