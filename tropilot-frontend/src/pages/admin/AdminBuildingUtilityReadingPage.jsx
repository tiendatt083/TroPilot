import BuildingUtilityReadingWorkspace from '../../components/building/BuildingUtilityReadingWorkspace.jsx';
import * as utilityReadingApi from '../../api/utilityReadingApi.js';

export default function AdminBuildingUtilityReadingPage() {
  return (
    <BuildingUtilityReadingWorkspace
      getOverview={utilityReadingApi.getAdminUtilityReadingOverview}
      getReadings={utilityReadingApi.getAdminUtilityReadings}
      updateReading={utilityReadingApi.updateAdminUtilityReading}
      canRecord
      canEdit
    />
  );
}
