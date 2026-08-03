import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getDashboardPath } from '../utils/roleRoutes.js';

/** Kiểm tra vai trò hiện tại có nằm trong danh sách được phép trước khi mở route con. */
export default function RoleBasedRoute({ allowedRoles }) {
  const { user } = useAuth();

  if (allowedRoles?.length && !allowedRoles.includes(user?.role)) {
    return <Navigate to={getDashboardPath(user?.role)} replace />;
  }

  return <Outlet />;
}
