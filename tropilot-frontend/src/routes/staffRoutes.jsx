import { Navigate, Route } from 'react-router-dom';
import StaffLayout from '../layouts/StaffLayout.jsx';
import ContactPage from '../pages/ContactPage.jsx';
import ProfilePage from '../pages/ProfilePage.jsx';
import Settings from '../pages/Settings.jsx';
import StaffBuildingListPage from '../pages/staff/StaffBuildingListPage.jsx';
import StaffDashboardPage from '../pages/staff/StaffDashboardPage.jsx';
import StaffExpenseCreatePage from '../pages/staff/StaffExpenseCreatePage.jsx';
import StaffExpenseListPage from '../pages/staff/StaffExpenseListPage.jsx';
import StaffMaintenancePage from '../pages/staff/StaffMaintenancePage.jsx';
import StaffNotificationPage from '../pages/staff/StaffNotificationPage.jsx';
import StaffPendingPaymentsPage from '../pages/staff/StaffPendingPaymentsPage.jsx';
import StaffRoomDetailPage from '../pages/staff/StaffRoomDetailPage.jsx';
import StaffRoomListPage from '../pages/staff/StaffRoomListPage.jsx';
import StaffTaskDetailPage from '../pages/staff/StaffTaskDetailPage.jsx';
import StaffTaskListPage from '../pages/staff/StaffTaskListPage.jsx';
import StaffUtilityReadingCreatePage from '../pages/staff/StaffUtilityReadingCreatePage.jsx';
import StaffUtilityReadingListPage from '../pages/staff/StaffUtilityReadingListPage.jsx';
import StaffVehicleListPage from '../pages/staff/StaffVehicleListPage.jsx';
import RoleBasedRoute from './RoleBasedRoute.jsx';
import { staffBuildingWorkspaceRoutes } from './buildingWorkspaceRoutes.jsx';

export const staffRoutes = (
  <Route element={<RoleBasedRoute allowedRoles={['STAFF']} />}>
    <Route path="/staff" element={<StaffLayout />}>
      <Route index element={<Navigate to="/staff/dashboard" replace />} />
      <Route path="dashboard" element={<StaffDashboardPage />} />
      <Route path="profile" element={<ProfilePage />} />
      <Route path="contact" element={<ContactPage />} />
      <Route path="settings" element={<Settings />} />
      <Route path="notifications" element={<StaffNotificationPage />} />
      <Route path="invoices" element={<Navigate to="/staff/buildings" replace />} />
      <Route path="invoices/generate" element={<Navigate to="/staff/buildings" replace />} />
      <Route path="payments/pending" element={<StaffPendingPaymentsPage />} />
      <Route path="expenses" element={<StaffExpenseListPage />} />
      <Route path="expenses/create" element={<StaffExpenseCreatePage />} />
      <Route path="tasks" element={<StaffTaskListPage />} />
      <Route path="tasks/:id" element={<StaffTaskDetailPage />} />
      <Route path="maintenance" element={<StaffMaintenancePage />} />
      <Route path="buildings" element={<StaffBuildingListPage />} />
      {staffBuildingWorkspaceRoutes}
      <Route path="rooms" element={<StaffRoomListPage />} />
      <Route path="rooms/:id" element={<StaffRoomDetailPage />} />
      <Route path="vehicles" element={<StaffVehicleListPage />} />
      <Route path="service-fees" element={<Navigate to="/staff/buildings" replace />} />
      <Route path="utility-readings" element={<StaffUtilityReadingListPage />} />
      <Route path="utility-readings/create" element={<StaffUtilityReadingCreatePage />} />
    </Route>
  </Route>
);
