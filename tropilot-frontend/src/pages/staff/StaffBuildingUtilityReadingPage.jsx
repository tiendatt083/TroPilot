import BuildingUtilityReadingWorkspace from '../../components/building/BuildingUtilityReadingWorkspace.jsx';
import * as utilityReadingApi from '../../api/utilityReadingApi.js';

/** Trang nhân viên ghi và quản lý chỉ số điện nước theo tòa nhà. */
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
