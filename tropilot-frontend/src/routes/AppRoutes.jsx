import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout.jsx';
import ResidentLayout from '../layouts/ResidentLayout.jsx';
import StaffLayout from '../layouts/StaffLayout.jsx';
import AdminBuildingCreatePage from '../pages/admin/AdminBuildingCreatePage.jsx';
import AdminBuildingDetailPage from '../pages/admin/AdminBuildingDetailPage.jsx';
import AdminBuildingEditPage from '../pages/admin/AdminBuildingEditPage.jsx';
import AdminBuildingListPage from '../pages/admin/AdminBuildingListPage.jsx';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage.jsx';
import AdminUserCreatePage from '../pages/admin/AdminUserCreatePage.jsx';
import AdminUserListPage from '../pages/admin/AdminUserListPage.jsx';
import ChangePasswordPage from '../pages/auth/ChangePasswordPage.jsx';
import LoginPage from '../pages/auth/LoginPage.jsx';
import ResidentDashboardPage from '../pages/resident/ResidentDashboardPage.jsx';
import StaffBuildingDetailPage from '../pages/staff/StaffBuildingDetailPage.jsx';
import StaffBuildingListPage from '../pages/staff/StaffBuildingListPage.jsx';
import StaffDashboardPage from '../pages/staff/StaffDashboardPage.jsx';
import HomeRedirect from './HomeRedirect.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';
import RoleBasedRoute from './RoleBasedRoute.jsx';

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/change-password" element={<ChangePasswordPage />} />

          <Route element={<RoleBasedRoute allowedRoles={['ADMIN']} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="users" element={<AdminUserListPage />} />
              <Route path="users/create" element={<AdminUserCreatePage />} />
              <Route path="buildings" element={<AdminBuildingListPage />} />
              <Route path="buildings/create" element={<AdminBuildingCreatePage />} />
              <Route path="buildings/:id" element={<AdminBuildingDetailPage />} />
              <Route path="buildings/:id/edit" element={<AdminBuildingEditPage />} />
            </Route>
          </Route>

          <Route element={<RoleBasedRoute allowedRoles={['STAFF']} />}>
            <Route path="/staff" element={<StaffLayout />}>
              <Route index element={<Navigate to="/staff/dashboard" replace />} />
              <Route path="dashboard" element={<StaffDashboardPage />} />
              <Route path="buildings" element={<StaffBuildingListPage />} />
              <Route path="buildings/:id" element={<StaffBuildingDetailPage />} />
            </Route>
          </Route>

          <Route element={<RoleBasedRoute allowedRoles={['RESIDENT_HEAD']} />}>
            <Route path="/resident" element={<ResidentLayout />}>
              <Route index element={<Navigate to="/resident/dashboard" replace />} />
              <Route path="dashboard" element={<ResidentDashboardPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
