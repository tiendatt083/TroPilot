import BuildingUtilityReadingWorkspace from '../../components/building/BuildingUtilityReadingWorkspace.jsx';
import * as utilityReadingApi from '../../api/utilityReadingApi.js';

export default function StaffBuildingUtilityReadingPage() {
  return (
    <BuildingUtilityReadingWorkspace
      getOverview={utilityReadingApi.getStaffUtilityReadingOverview}
      getReadings={utilityReadingApi.getStaffUtilityReadings}
      canRecord
      canEdit
      updateReading={utilityReadingApi.updateStaffUtilityReading}
    />
  );
}
