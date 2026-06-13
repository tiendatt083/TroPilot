import * as utilityReadingApi from '../../api/utilityReadingApi.js';
import BuildingUtilityReadingWorkspace from '../../components/building/BuildingUtilityReadingWorkspace.jsx';

export default function StaffBuildingUtilityReadingPage() {
  return (
    <BuildingUtilityReadingWorkspace
      getOverview={utilityReadingApi.getStaffUtilityReadingOverview}
      getReadings={utilityReadingApi.getStaffUtilityReadings}
    />
  );
}
