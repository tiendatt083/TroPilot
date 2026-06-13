import * as vehicleApi from '../../api/vehicleApi.js';
import BuildingVehicleWorkspace from '../../components/building/BuildingVehicleWorkspace.jsx';

export default function AdminBuildingVehiclePage() {
  return <BuildingVehicleWorkspace getVehicles={vehicleApi.getAdminVehicles} canManage />;
}
