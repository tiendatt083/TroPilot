import * as vehicleApi from '../../features/residents/vehicleApi.js';
import BuildingVehicleWorkspace from '../../components/building/BuildingVehicleWorkspace.jsx';

export default function AdminBuildingVehiclePage() {
  return <BuildingVehicleWorkspace getVehicles={vehicleApi.getAdminVehicles} canManage />;
}
