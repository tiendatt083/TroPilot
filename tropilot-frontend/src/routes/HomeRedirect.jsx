import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.jsx';
import { getDashboardPath } from '../utils/roleRoutes.js';

export default function HomeRedirect() {
  const { t } = useTranslation();
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <div className="route-state">{t('auth.loadingSession')}</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.mustChangePassword) {
    return <Navigate to="/change-password" replace />;
  }

  return <Navigate to={getDashboardPath(user?.role)} replace />;
}
