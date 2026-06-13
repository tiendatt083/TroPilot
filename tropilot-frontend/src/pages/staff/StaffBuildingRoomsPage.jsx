import { BuildingRoomsWorkspace } from '../../features/rooms/components/index.js';
import * as roomApi from '../../features/rooms/api.js';

export default function StaffBuildingRoomsPage() {
  return <BuildingRoomsWorkspace getRooms={roomApi.getStaffRooms} roomBasePath="/staff/rooms" />;
}
