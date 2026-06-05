import * as buildingApi from '../api/buildingApi.js';
import BuildingWorkspaceLayout from './BuildingWorkspaceLayout.jsx';

const ADMIN_BUILDING_TABS = [
  { path: '', labelKey: 'buildingWorkspace.overview', end: true },
  { path: '/rooms', labelKey: 'buildingWorkspace.rooms' },
  { path: '/users', labelKey: 'buildingWorkspace.users' },
  { path: '/contracts', labelKey: 'buildingWorkspace.contracts' },
  { path: '/utility-readings', labelKey: 'buildingWorkspace.utilityReadings' },
  { path: '/invoices', labelKey: 'buildingWorkspace.invoices' },
  { path: '/service-fees', labelKey: 'buildingWorkspace.serviceFees' },
  { path: '/vehicles', labelKey: 'buildingWorkspace.vehicles' },
  { path: '/payments', labelKey: 'buildingWorkspace.payments' },
  { path: '/receipts', labelKey: 'buildingWorkspace.receipts' },
  { path: '/members', labelKey: 'buildingWorkspace.roomMembers' },
  { path: '/maintenance', labelKey: 'buildingWorkspace.maintenance' },
  { path: '/expenses', labelKey: 'buildingWorkspace.expenses' },
  { path: '/cashflow', labelKey: 'buildingWorkspace.cashFlow' },
  { path: '/tasks', labelKey: 'buildingWorkspace.tasks' },
  { path: '/feedbacks', labelKey: 'buildingWorkspace.feedbacks' },
  { path: '/invoice-complaints', labelKey: 'buildingWorkspace.invoiceComplaints' },
  { path: '/notifications', labelKey: 'buildingWorkspace.notifications' }
];

export default function AdminBuildingWorkspaceLayout() {
  return (
    <BuildingWorkspaceLayout
      getBuilding={buildingApi.getAdminBuilding}
      deleteBuilding={buildingApi.deleteAdminBuilding}
      listPath="/admin/buildings"
      basePath="/admin/buildings"
      tabs={ADMIN_BUILDING_TABS}
      actions={{
        showRoomsLink: true,
        canCreateRoom: true,
        canEditBuilding: true,
        canDeleteBuilding: true
      }}
    />
  );
}
