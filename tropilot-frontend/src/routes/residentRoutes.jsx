import { Route } from 'react-router-dom';
import ResidentLayout from '../layouts/ResidentLayout.jsx';
import ContactPage from '../pages/ContactPage.jsx';
import ProfilePage from '../pages/ProfilePage.jsx';
import Settings from '../pages/Settings.jsx';
import ResidentContractPage from '../pages/resident/ResidentContractPage.jsx';
import ResidentDashboardPage from '../pages/resident/ResidentDashboardPage.jsx';
import ResidentEquipmentPage from '../pages/resident/ResidentEquipmentPage.jsx';
import ResidentFeedbackPage from '../pages/resident/ResidentFeedbackPage.jsx';
import ResidentInvoiceDetailPage from '../pages/resident/ResidentInvoiceDetailPage.jsx';
import ResidentInvoiceListPage from '../pages/resident/ResidentInvoiceListPage.jsx';
import ResidentMaintenanceCreatePage from '../pages/resident/ResidentMaintenanceCreatePage.jsx';
import ResidentMaintenanceListPage from '../pages/resident/ResidentMaintenanceListPage.jsx';
import ResidentMemberPage from '../pages/resident/ResidentMemberPage.jsx';
import ResidentNotificationPage from '../pages/resident/ResidentNotificationPage.jsx';
import ResidentUtilityReadingPage from '../pages/resident/ResidentUtilityReadingPage.jsx';
import ResidentVehiclePage from '../pages/resident/ResidentVehiclePage.jsx';
import ResidentIndexRoute from './ResidentIndexRoute.jsx';
import ResidentRoomRoute from './ResidentRoomRoute.jsx';
import RoleBasedRoute from './RoleBasedRoute.jsx';

export const residentRoutes = (
  <Route element={<RoleBasedRoute allowedRoles={['RESIDENT_HEAD']} />}>
    <Route path="/resident" element={<ResidentLayout />}>
      <Route index element={<ResidentIndexRoute />} />
      <Route path="profile" element={<ProfilePage />} />
      <Route path="contact" element={<ContactPage />} />
      <Route path="settings" element={<Settings />} />
      <Route element={<ResidentRoomRoute />}>
        <Route path="dashboard" element={<ResidentDashboardPage />} />
        <Route path="notifications" element={<ResidentNotificationPage />} />
        <Route path="feedbacks" element={<ResidentFeedbackPage />} />
        <Route path="invoices" element={<ResidentInvoiceListPage />} />
        <Route path="invoices/:id" element={<ResidentInvoiceDetailPage />} />
        <Route path="members" element={<ResidentMemberPage />} />
        <Route path="maintenance" element={<ResidentMaintenanceListPage />} />
        <Route path="maintenance/create" element={<ResidentMaintenanceCreatePage />} />
        <Route path="contract" element={<ResidentContractPage />} />
        <Route path="vehicles" element={<ResidentVehiclePage />} />
        <Route path="equipment" element={<ResidentEquipmentPage />} />
        <Route path="utility-readings" element={<ResidentUtilityReadingPage />} />
      </Route>
    </Route>
  </Route>
);
