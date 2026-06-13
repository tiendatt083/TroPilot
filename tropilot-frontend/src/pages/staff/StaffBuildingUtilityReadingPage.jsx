import { BuildingUtilityReadingWorkspace } from '../../features/invoices/components/index.js';
import * as utilityReadingApi from '../../features/invoices/utilityReadingApi.js';

export default function StaffBuildingUtilityReadingPage() {
  return (
    <BuildingUtilityReadingWorkspace
      getOverview={utilityReadingApi.getStaffUtilityReadingOverview}
      getReadings={utilityReadingApi.getStaffUtilityReadings}
    />
  );
}
