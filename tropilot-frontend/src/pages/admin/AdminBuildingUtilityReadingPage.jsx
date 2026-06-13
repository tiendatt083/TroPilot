import { BuildingUtilityReadingWorkspace } from '../../features/invoices/components/index.js';
import * as utilityReadingApi from '../../features/invoices/utilityReadingApi.js';

export default function AdminBuildingUtilityReadingPage() {
  return (
    <BuildingUtilityReadingWorkspace
      getOverview={utilityReadingApi.getAdminUtilityReadingOverview}
      getReadings={utilityReadingApi.getAdminUtilityReadings}
      updateReading={utilityReadingApi.updateAdminUtilityReading}
      canEdit
    />
  );
}
