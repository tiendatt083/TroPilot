import * as utilityReadingApi from '../../api/utilityReadingApi.js';
import BuildingUtilityReadingWorkspace from '../../components/building/BuildingUtilityReadingWorkspace.jsx';

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
