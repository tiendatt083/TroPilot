import * as buildingApi from '../api/buildingApi.js';
import BuildingWorkspaceLayout from './BuildingWorkspaceLayout.jsx';

const STAFF_BUILDING_TABS = [
  { path: '', labelKey: 'buildingWorkspace.overview', end: true },
  { path: '/rooms', labelKey: 'buildingWorkspace.rooms' },
  { path: '/equipment', labelKey: 'buildingWorkspace.equipment' },
  { path: '/utility-readings', labelKey: 'buildingWorkspace.utilityReadings' },
  { path: '/invoices', labelKey: 'buildingWorkspace.invoices' },
  { path: '/service-fees', labelKey: 'buildingWorkspace.serviceFees' },
  { path: '/vehicles', labelKey: 'buildingWorkspace.vehicles' },
  { path: '/payments', labelKey: 'buildingWorkspace.payments' },
  { path: '/maintenance', labelKey: 'buildingWorkspace.maintenance' },
  { path: '/expenses', labelKey: 'buildingWorkspace.expenses' },
  { path: '/cashflow', labelKey: 'buildingWorkspace.cashFlow' },
  { path: '/tasks', labelKey: 'buildingWorkspace.tasks' }
];

export default function StaffBuildingWorkspaceLayout() {
  return (
    <BuildingWorkspaceLayout
      getBuilding={buildingApi.getStaffBuilding}
      listPath="/staff/buildings"
      basePath="/staff/buildings"
      tabs={STAFF_BUILDING_TABS}
      actions={{ showRoomsLink: true }}
    />
  );
}
