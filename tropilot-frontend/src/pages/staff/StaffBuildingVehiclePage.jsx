import * as vehicleApi from '../../features/residents/vehicleApi.js';
import BuildingVehicleWorkspace from '../../components/building/BuildingVehicleWorkspace.jsx';

export default function StaffBuildingVehiclePage() {
  return <BuildingVehicleWorkspace getVehicles={vehicleApi.getStaffVehicles} />;
}
