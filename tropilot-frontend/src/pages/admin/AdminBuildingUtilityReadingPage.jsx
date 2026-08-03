import BuildingUtilityReadingWorkspace from '../../components/building/BuildingUtilityReadingWorkspace.jsx';
import * as utilityReadingApi from '../../api/utilityReadingApi.js';

/** Trang quản trị ghi, kiểm tra và theo dõi chỉ số điện nước theo tòa nhà. */
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
