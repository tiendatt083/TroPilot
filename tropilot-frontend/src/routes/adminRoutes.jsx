import { Navigate, Route } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout.jsx';
import AdminActivityLogPage from '../pages/admin/AdminActivityLogPage.jsx';
import AdminBuildingCreatePage from '../pages/admin/AdminBuildingCreatePage.jsx';
import AdminBuildingEditPage from '../pages/admin/AdminBuildingEditPage.jsx';
import AdminBuildingListPage from '../pages/admin/AdminBuildingListPage.jsx';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage.jsx';
import AdminFeedbackOverviewPage from '../pages/admin/AdminFeedbackOverviewPage.jsx';
import AdminNotificationPage from '../pages/admin/AdminNotificationPage.jsx';
import AdminPendingMembersPage from '../pages/admin/AdminPendingMembersPage.jsx';
import AdminResidentListPage from '../pages/admin/AdminResidentListPage.jsx';
import AdminUserCreatePage from '../pages/admin/AdminUserCreatePage.jsx';
import AdminUserListPage from '../pages/admin/AdminUserListPage.jsx';
import ContactPage from '../pages/ContactPage.jsx';
import Settings from '../pages/Settings.jsx';
import RoleBasedRoute from './RoleBasedRoute.jsx';
import { adminBuildingWorkspaceRoutes } from './buildingWorkspaceRoutes.jsx';

export const adminRoutes = (
  <Route element={<RoleBasedRoute allowedRoles={['ADMIN']} />}>
    <Route path="/admin" element={<AdminLayout />}>
      <Route index element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="dashboard" element={<AdminDashboardPage />} />
      <Route path="profile" element={<Navigate to="/admin/contact" replace />} />
      <Route path="contact" element={<ContactPage />} />
      <Route path="settings" element={<Settings />} />
      <Route path="notifications" element={<AdminNotificationPage />} />
      <Route path="activity-logs" element={<AdminActivityLogPage />} />
      <Route path="feedbacks" element={<AdminFeedbackOverviewPage />} />
      <Route path="invoice-complaints" element={<Navigate to="/admin/buildings" replace />} />
      <Route path="users" element={<AdminUserListPage />} />
      <Route path="users/create" element={<AdminUserCreatePage />} />
      <Route path="residents" element={<AdminResidentListPage />} />
      <Route path="members/pending" element={<AdminPendingMembersPage />} />
      <Route path="contracts" element={<Navigate to="/admin/buildings" replace />} />
      <Route path="contracts/:id" element={<Navigate to="/admin/buildings" replace />} />
      <Route path="invoices" element={<Navigate to="/admin/buildings" replace />} />
      <Route path="receipts" element={<Navigate to="/admin/buildings" replace />} />
      <Route path="cashflow" element={<Navigate to="/admin/buildings" replace />} />
      <Route path="tasks" element={<Navigate to="/admin/buildings" replace />} />
      <Route path="tasks/create" element={<Navigate to="/admin/buildings" replace />} />
      <Route path="tasks/:id" element={<Navigate to="/admin/buildings" replace />} />
      <Route path="maintenance" element={<Navigate to="/admin/buildings" replace />} />
      <Route path="equipment" element={<Navigate to="/admin/buildings" replace />} />
      <Route path="vehicles" element={<Navigate to="/admin/buildings" replace />} />
      <Route path="vehicles/pending" element={<Navigate to="/admin/buildings" replace />} />
      <Route path="service-fees" element={<Navigate to="/admin/buildings" replace />} />
      <Route path="service-fees/create" element={<Navigate to="/admin/buildings" replace />} />
      <Route path="service-fees/:id/edit" element={<Navigate to="/admin/buildings" replace />} />
      <Route path="utility-readings" element={<Navigate to="/admin/buildings" replace />} />
      <Route path="buildings" element={<AdminBuildingListPage />} />
      <Route path="buildings/create" element={<AdminBuildingCreatePage />} />
      {adminBuildingWorkspaceRoutes}
      <Route path="buildings/:id/edit" element={<AdminBuildingEditPage />} />
      <Route path="rooms" element={<Navigate to="/admin/buildings" replace />} />
      <Route path="rooms/create" element={<Navigate to="/admin/buildings" replace />} />
      <Route path="rooms/:id/members" element={<Navigate to="/admin/buildings" replace />} />
      <Route path="rooms/:id" element={<Navigate to="/admin/buildings" replace />} />
      <Route path="rooms/:id/edit" element={<Navigate to="/admin/buildings" replace />} />
    </Route>
  </Route>
);
