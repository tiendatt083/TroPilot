import * as roomApi from '../../api/roomApi.js';
import BuildingRoomsWorkspace from '../../components/building/BuildingRoomsWorkspace.jsx';

export default function StaffBuildingRoomsPage() {
  return <BuildingRoomsWorkspace getRooms={roomApi.getStaffRooms} roomBasePath="/staff/rooms" />;
}
