import { Navigate, Route, useParams } from 'react-router-dom';
import AdminBuildingWorkspaceLayout from '../layouts/AdminBuildingWorkspaceLayout.jsx';
import StaffBuildingWorkspaceLayout from '../layouts/StaffBuildingWorkspaceLayout.jsx';
import AdminBuildingCashFlowPage from '../pages/admin/AdminBuildingCashFlowPage.jsx';
import AdminBuildingContractPage from '../pages/admin/AdminBuildingContractPage.jsx';
import AdminBuildingDetailPage from '../pages/admin/AdminBuildingDetailPage.jsx';
import AdminBuildingEquipmentPage from '../pages/admin/AdminBuildingEquipmentPage.jsx';
import AdminBuildingExpensePage from '../pages/admin/AdminBuildingExpensePage.jsx';
import AdminBuildingFeedbackPage from '../pages/admin/AdminBuildingFeedbackPage.jsx';
import AdminBuildingInvoicePage from '../pages/admin/AdminBuildingInvoicePage.jsx';
import AdminBuildingMaintenancePage from '../pages/admin/AdminBuildingMaintenancePage.jsx';
import AdminBuildingNotificationPage from '../pages/admin/AdminBuildingNotificationPage.jsx';
import AdminBuildingReceiptPage from '../pages/admin/AdminBuildingReceiptPage.jsx';
import AdminBuildingRoomsPage from '../pages/admin/AdminBuildingRoomsPage.jsx';
import AdminBuildingServiceFeePage from '../pages/admin/AdminBuildingServiceFeePage.jsx';
import AdminBuildingTaskDetailPage from '../pages/admin/AdminBuildingTaskDetailPage.jsx';
import AdminBuildingTaskPage from '../pages/admin/AdminBuildingTaskPage.jsx';
import AdminBuildingUserPage from '../pages/admin/AdminBuildingUserPage.jsx';
import AdminBuildingUtilityReadingPage from '../pages/admin/AdminBuildingUtilityReadingPage.jsx';
import AdminBuildingVehiclePage from '../pages/admin/AdminBuildingVehiclePage.jsx';
import AdminRoomCreatePage from '../pages/admin/AdminRoomCreatePage.jsx';
import AdminRoomDetailPage from '../pages/admin/AdminRoomDetailPage.jsx';
import AdminRoomEditPage from '../pages/admin/AdminRoomEditPage.jsx';
import AdminRoomMembersPage from '../pages/admin/AdminRoomMembersPage.jsx';
import StaffBuildingEquipmentPage from '../pages/staff/StaffBuildingEquipmentPage.jsx';
import StaffBuildingExpensePage from '../pages/staff/StaffBuildingExpensePage.jsx';
import StaffBuildingOverviewPage from '../pages/staff/StaffBuildingOverviewPage.jsx';
import StaffBuildingRoomsPage from '../pages/staff/StaffBuildingRoomsPage.jsx';
import StaffBuildingServiceFeePage from '../pages/staff/StaffBuildingServiceFeePage.jsx';
import StaffBuildingTaskPage from '../pages/staff/StaffBuildingTaskPage.jsx';
import StaffBuildingUtilityReadingPage from '../pages/staff/StaffBuildingUtilityReadingPage.jsx';
import StaffBuildingVehiclePage from '../pages/staff/StaffBuildingVehiclePage.jsx';
import StaffMaintenancePage from '../pages/staff/StaffMaintenancePage.jsx';
import StaffRoomDetailPage from '../pages/staff/StaffRoomDetailPage.jsx';

export const adminBuildingWorkspaceRoutes = (
  <Route path="buildings/:id" element={<AdminBuildingWorkspaceLayout />}>
    <Route index element={<AdminBuildingDetailPage />} />
    <Route path="rooms" element={<AdminBuildingRoomsPage />} />
    <Route path="rooms/create" element={<AdminRoomCreatePage />} />
    <Route path="rooms/:roomId" element={<AdminRoomDetailPage />} />
    <Route path="rooms/:roomId/edit" element={<AdminRoomEditPage />} />
    <Route path="rooms/:roomId/members" element={<AdminRoomMembersPage />} />
    <Route path="users" element={<AdminBuildingUserPage />} />
    <Route path="equipment" element={<AdminBuildingEquipmentPage />} />
    <Route path="contracts" element={<AdminBuildingContractPage />} />
    <Route path="billing" element={<Navigate to="../invoices" replace />} />
    <Route path="utility-readings" element={<AdminBuildingUtilityReadingPage />} />
    <Route path="invoices" element={<AdminBuildingInvoicePage />} />
    <Route path="service-fees" element={<AdminBuildingServiceFeePage />} />
    <Route path="vehicles" element={<AdminBuildingVehiclePage />} />
    <Route path="payments" element={<Navigate to="../invoices" replace />} />
    <Route path="receipts" element={<AdminBuildingReceiptPage />} />
    <Route path="members" element={<Navigate to="../users" replace />} />
    <Route path="maintenance" element={<AdminBuildingMaintenancePage />} />
    <Route path="expenses" element={<AdminBuildingExpensePage />} />
    <Route path="cashflow" element={<AdminBuildingCashFlowPage />} />
    <Route path="tasks" element={<AdminBuildingTaskPage />} />
    <Route path="tasks/:taskId" element={<AdminBuildingTaskDetailPage />} />
    <Route path="feedbacks" element={<AdminBuildingFeedbackPage />} />
    <Route path="invoice-complaints" element={<Navigate to="../feedbacks" replace />} />
    <Route path="notifications" element={<AdminBuildingNotificationPage />} />
  </Route>
);

export const staffBuildingWorkspaceRoutes = (
  <Route path="buildings/:id" element={<StaffBuildingWorkspaceLayout />}>
    <Route index element={<StaffBuildingOverviewPage />} />
    <Route path="rooms" element={<StaffBuildingRoomsPage />} />
    <Route path="rooms/:roomId" element={<StaffRoomDetailPage />} />
    <Route path="equipment" element={<StaffBuildingEquipmentPage />} />
    <Route path="utility-readings" element={<StaffBuildingUtilityReadingPage />} />
    <Route path="contracts" element={<StaffBuildingOverviewRedirect />} />
    <Route path="invoices" element={<StaffBuildingOverviewRedirect />} />
    <Route path="service-fees" element={<StaffBuildingServiceFeePage />} />
    <Route path="vehicles" element={<StaffBuildingVehiclePage />} />
    <Route path="payments" element={<StaffBuildingOverviewRedirect />} />
    <Route path="maintenance" element={<StaffMaintenancePage />} />
    <Route path="expenses" element={<StaffBuildingExpensePage />} />
    <Route path="cashflow" element={<StaffBuildingOverviewRedirect />} />
    <Route path="tasks" element={<StaffBuildingTaskPage />} />
  </Route>
);

function StaffBuildingOverviewRedirect() {
  const { id } = useParams();
  return <Navigate to={`/staff/buildings/${id}`} replace />;
}
