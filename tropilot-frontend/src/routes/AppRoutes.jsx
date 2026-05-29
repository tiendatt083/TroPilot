import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AdminBuildingWorkspaceLayout from '../layouts/AdminBuildingWorkspaceLayout.jsx';
import AdminLayout from '../layouts/AdminLayout.jsx';
import ResidentLayout from '../layouts/ResidentLayout.jsx';
import StaffLayout from '../layouts/StaffLayout.jsx';
import AdminBuildingCreatePage from '../pages/admin/AdminBuildingCreatePage.jsx';
import AdminBuildingBillingPage from '../pages/admin/AdminBuildingBillingPage.jsx';
import AdminBuildingCashFlowPage from '../pages/admin/AdminBuildingCashFlowPage.jsx';
import AdminBuildingContractPage from '../pages/admin/AdminBuildingContractPage.jsx';
import AdminBuildingDetailPage from '../pages/admin/AdminBuildingDetailPage.jsx';
import AdminBuildingEditPage from '../pages/admin/AdminBuildingEditPage.jsx';
import AdminBuildingExpensePage from '../pages/admin/AdminBuildingExpensePage.jsx';
import AdminBuildingFeedbackPage from '../pages/admin/AdminBuildingFeedbackPage.jsx';
import AdminBuildingInvoiceComplaintPage from '../pages/admin/AdminBuildingInvoiceComplaintPage.jsx';
import AdminBuildingListPage from '../pages/admin/AdminBuildingListPage.jsx';
import AdminBuildingMaintenancePage from '../pages/admin/AdminBuildingMaintenancePage.jsx';
import AdminBuildingMemberPage from '../pages/admin/AdminBuildingMemberPage.jsx';
import AdminBuildingNotificationPage from '../pages/admin/AdminBuildingNotificationPage.jsx';
import AdminBuildingPaymentPage from '../pages/admin/AdminBuildingPaymentPage.jsx';
import AdminBuildingReceiptPage from '../pages/admin/AdminBuildingReceiptPage.jsx';
import AdminBuildingRoomsPage from '../pages/admin/AdminBuildingRoomsPage.jsx';
import AdminBuildingTaskDetailPage from '../pages/admin/AdminBuildingTaskDetailPage.jsx';
import AdminBuildingTaskPage from '../pages/admin/AdminBuildingTaskPage.jsx';
import AdminBuildingVehiclePage from '../pages/admin/AdminBuildingVehiclePage.jsx';
import AdminActivityLogPage from '../pages/admin/AdminActivityLogPage.jsx';
import AdminContractDetailPage from '../pages/admin/AdminContractDetailPage.jsx';
import AdminContractListPage from '../pages/admin/AdminContractListPage.jsx';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage.jsx';
import AdminFeedbackPage from '../pages/admin/AdminFeedbackPage.jsx';
import AdminInvoiceComplaintPage from '../pages/admin/AdminInvoiceComplaintPage.jsx';
import AdminMaintenancePage from '../pages/admin/AdminMaintenancePage.jsx';
import AdminNotificationPage from '../pages/admin/AdminNotificationPage.jsx';
import AdminPendingMembersPage from '../pages/admin/AdminPendingMembersPage.jsx';
import AdminRoomCreatePage from '../pages/admin/AdminRoomCreatePage.jsx';
import AdminRoomDetailPage from '../pages/admin/AdminRoomDetailPage.jsx';
import AdminRoomEditPage from '../pages/admin/AdminRoomEditPage.jsx';
import AdminRoomListPage from '../pages/admin/AdminRoomListPage.jsx';
import AdminRoomMembersPage from '../pages/admin/AdminRoomMembersPage.jsx';
import AdminTaskCreatePage from '../pages/admin/AdminTaskCreatePage.jsx';
import AdminTaskDetailPage from '../pages/admin/AdminTaskDetailPage.jsx';
import AdminTaskListPage from '../pages/admin/AdminTaskListPage.jsx';
import AdminUserCreatePage from '../pages/admin/AdminUserCreatePage.jsx';
import AdminUserListPage from '../pages/admin/AdminUserListPage.jsx';
import ChangePasswordPage from '../pages/auth/ChangePasswordPage.jsx';
import LoginPage from '../pages/auth/LoginPage.jsx';
import ResidentContractPage from '../pages/resident/ResidentContractPage.jsx';
import ResidentDashboardPage from '../pages/resident/ResidentDashboardPage.jsx';
import ResidentFeedbackPage from '../pages/resident/ResidentFeedbackPage.jsx';
import ResidentInvoiceDetailPage from '../pages/resident/ResidentInvoiceDetailPage.jsx';
import ResidentInvoiceListPage from '../pages/resident/ResidentInvoiceListPage.jsx';
import ResidentMaintenanceCreatePage from '../pages/resident/ResidentMaintenanceCreatePage.jsx';
import ResidentMaintenanceListPage from '../pages/resident/ResidentMaintenanceListPage.jsx';
import ResidentMemberPage from '../pages/resident/ResidentMemberPage.jsx';
import ResidentNotificationPage from '../pages/resident/ResidentNotificationPage.jsx';
import ResidentUtilityReadingPage from '../pages/resident/ResidentUtilityReadingPage.jsx';
import ResidentVehiclePage from '../pages/resident/ResidentVehiclePage.jsx';
import StaffBuildingDetailPage from '../pages/staff/StaffBuildingDetailPage.jsx';
import StaffBuildingListPage from '../pages/staff/StaffBuildingListPage.jsx';
import StaffDashboardPage from '../pages/staff/StaffDashboardPage.jsx';
import StaffExpenseCreatePage from '../pages/staff/StaffExpenseCreatePage.jsx';
import StaffExpenseListPage from '../pages/staff/StaffExpenseListPage.jsx';
import StaffInvoiceGeneratePage from '../pages/staff/StaffInvoiceGeneratePage.jsx';
import StaffInvoiceListPage from '../pages/staff/StaffInvoiceListPage.jsx';
import StaffMaintenancePage from '../pages/staff/StaffMaintenancePage.jsx';
import StaffNotificationPage from '../pages/staff/StaffNotificationPage.jsx';
import StaffPendingPaymentsPage from '../pages/staff/StaffPendingPaymentsPage.jsx';
import StaffRoomDetailPage from '../pages/staff/StaffRoomDetailPage.jsx';
import StaffRoomListPage from '../pages/staff/StaffRoomListPage.jsx';
import StaffServiceFeeListPage from '../pages/staff/StaffServiceFeeListPage.jsx';
import StaffTaskDetailPage from '../pages/staff/StaffTaskDetailPage.jsx';
import StaffTaskListPage from '../pages/staff/StaffTaskListPage.jsx';
import StaffUtilityReadingCreatePage from '../pages/staff/StaffUtilityReadingCreatePage.jsx';
import StaffUtilityReadingListPage from '../pages/staff/StaffUtilityReadingListPage.jsx';
import StaffVehicleListPage from '../pages/staff/StaffVehicleListPage.jsx';
import Settings from '../pages/Settings.jsx';
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
          <Route path="/settings" element={<HomeRedirect />} />

          <Route element={<RoleBasedRoute allowedRoles={['ADMIN']} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="settings" element={<Settings />} />
              <Route path="notifications" element={<AdminNotificationPage />} />
              <Route path="activity-logs" element={<AdminActivityLogPage />} />
              <Route path="feedbacks" element={<AdminFeedbackPage />} />
              <Route path="invoice-complaints" element={<AdminInvoiceComplaintPage />} />
              <Route path="users" element={<AdminUserListPage />} />
              <Route path="users/create" element={<AdminUserCreatePage />} />
              <Route path="members/pending" element={<AdminPendingMembersPage />} />
              <Route path="contracts" element={<AdminContractListPage />} />
              <Route path="contracts/:id" element={<AdminContractDetailPage />} />
              <Route path="invoices" element={<Navigate to="/admin/buildings" replace />} />
              <Route path="receipts" element={<Navigate to="/admin/buildings" replace />} />
              <Route path="expenses" element={<Navigate to="/admin/buildings" replace />} />
              <Route path="cashflow" element={<Navigate to="/admin/buildings" replace />} />
              <Route path="tasks" element={<AdminTaskListPage />} />
              <Route path="tasks/create" element={<AdminTaskCreatePage />} />
              <Route path="tasks/:id" element={<AdminTaskDetailPage />} />
              <Route path="maintenance" element={<AdminMaintenancePage />} />
              <Route path="vehicles" element={<Navigate to="/admin/buildings" replace />} />
              <Route path="vehicles/pending" element={<Navigate to="/admin/buildings" replace />} />
              <Route path="service-fees" element={<Navigate to="/admin/buildings" replace />} />
              <Route path="service-fees/create" element={<Navigate to="/admin/buildings" replace />} />
              <Route path="service-fees/:id/edit" element={<Navigate to="/admin/buildings" replace />} />
              <Route path="utility-readings" element={<Navigate to="/admin/buildings" replace />} />
              <Route path="buildings" element={<AdminBuildingListPage />} />
              <Route path="buildings/create" element={<AdminBuildingCreatePage />} />
              <Route path="buildings/:id" element={<AdminBuildingWorkspaceLayout />}>
                <Route index element={<AdminBuildingDetailPage />} />
                <Route path="rooms" element={<AdminBuildingRoomsPage />} />
                <Route path="contracts" element={<AdminBuildingContractPage />} />
                <Route path="billing" element={<AdminBuildingBillingPage />} />
                <Route path="utility-readings" element={<Navigate to="../billing" replace />} />
                <Route path="invoices" element={<Navigate to="../billing" replace />} />
                <Route path="vehicles" element={<AdminBuildingVehiclePage />} />
                <Route path="payments" element={<AdminBuildingPaymentPage />} />
                <Route path="receipts" element={<AdminBuildingReceiptPage />} />
                <Route path="members" element={<AdminBuildingMemberPage />} />
                <Route path="maintenance" element={<AdminBuildingMaintenancePage />} />
                <Route path="expenses" element={<AdminBuildingExpensePage />} />
                <Route path="cashflow" element={<AdminBuildingCashFlowPage />} />
                <Route path="tasks" element={<AdminBuildingTaskPage />} />
                <Route path="tasks/:taskId" element={<AdminBuildingTaskDetailPage />} />
                <Route path="feedbacks" element={<AdminBuildingFeedbackPage />} />
                <Route path="invoice-complaints" element={<AdminBuildingInvoiceComplaintPage />} />
                <Route path="notifications" element={<AdminBuildingNotificationPage />} />
              </Route>
              <Route path="buildings/:id/edit" element={<AdminBuildingEditPage />} />
              <Route path="rooms" element={<AdminRoomListPage />} />
              <Route path="rooms/create" element={<AdminRoomCreatePage />} />
              <Route path="rooms/:id/members" element={<AdminRoomMembersPage />} />
              <Route path="rooms/:id" element={<AdminRoomDetailPage />} />
              <Route path="rooms/:id/edit" element={<AdminRoomEditPage />} />
            </Route>
          </Route>

          <Route element={<RoleBasedRoute allowedRoles={['STAFF']} />}>
            <Route path="/staff" element={<StaffLayout />}>
              <Route index element={<Navigate to="/staff/dashboard" replace />} />
              <Route path="dashboard" element={<StaffDashboardPage />} />
              <Route path="settings" element={<Settings />} />
              <Route path="notifications" element={<StaffNotificationPage />} />
              <Route path="invoices" element={<StaffInvoiceListPage />} />
              <Route path="invoices/generate" element={<StaffInvoiceGeneratePage />} />
              <Route path="payments/pending" element={<StaffPendingPaymentsPage />} />
              <Route path="expenses" element={<StaffExpenseListPage />} />
              <Route path="expenses/create" element={<StaffExpenseCreatePage />} />
              <Route path="tasks" element={<StaffTaskListPage />} />
              <Route path="tasks/:id" element={<StaffTaskDetailPage />} />
              <Route path="maintenance" element={<StaffMaintenancePage />} />
              <Route path="buildings" element={<StaffBuildingListPage />} />
              <Route path="buildings/:id" element={<StaffBuildingDetailPage />} />
              <Route path="rooms" element={<StaffRoomListPage />} />
              <Route path="rooms/:id" element={<StaffRoomDetailPage />} />
              <Route path="vehicles" element={<StaffVehicleListPage />} />
              <Route path="service-fees" element={<StaffServiceFeeListPage />} />
              <Route path="utility-readings" element={<StaffUtilityReadingListPage />} />
              <Route path="utility-readings/create" element={<StaffUtilityReadingCreatePage />} />
            </Route>
          </Route>

          <Route element={<RoleBasedRoute allowedRoles={['RESIDENT_HEAD']} />}>
            <Route path="/resident" element={<ResidentLayout />}>
              <Route index element={<Navigate to="/resident/dashboard" replace />} />
              <Route path="dashboard" element={<ResidentDashboardPage />} />
              <Route path="settings" element={<Settings />} />
              <Route path="notifications" element={<ResidentNotificationPage />} />
              <Route path="feedbacks" element={<ResidentFeedbackPage />} />
              <Route path="invoices" element={<ResidentInvoiceListPage />} />
              <Route path="invoices/:id" element={<ResidentInvoiceDetailPage />} />
              <Route path="members" element={<ResidentMemberPage />} />
              <Route path="maintenance" element={<ResidentMaintenanceListPage />} />
              <Route path="maintenance/create" element={<ResidentMaintenanceCreatePage />} />
              <Route path="contract" element={<ResidentContractPage />} />
              <Route path="vehicles" element={<ResidentVehiclePage />} />
              <Route path="utility-readings" element={<ResidentUtilityReadingPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
