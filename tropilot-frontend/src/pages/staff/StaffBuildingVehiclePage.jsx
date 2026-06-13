import * as vehicleApi from '../../api/vehicleApi.js';
import BuildingVehicleWorkspace from '../../components/building/BuildingVehicleWorkspace.jsx';

export default function StaffBuildingVehiclePage() {
  return <BuildingVehicleWorkspace getVehicles={vehicleApi.getStaffVehicles} />;
}
