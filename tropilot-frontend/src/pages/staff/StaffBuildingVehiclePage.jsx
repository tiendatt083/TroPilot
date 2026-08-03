import * as vehicleApi from '../../api/vehicleApi.js';
import BuildingVehicleWorkspace from '../../components/building/BuildingVehicleWorkspace.jsx';

/** Trang nhân viên xem và xử lý thông tin xe thuộc tòa nhà. */
export default function StaffBuildingVehiclePage() {
  return <BuildingVehicleWorkspace getVehicles={vehicleApi.getStaffVehicles} />;
}
