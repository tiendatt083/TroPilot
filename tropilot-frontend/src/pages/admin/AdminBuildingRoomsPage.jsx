import { BuildingRoomsWorkspace } from '../../features/rooms/components/index.js';
import * as roomApi from '../../features/rooms/api.js';

export default function AdminBuildingRoomsPage() {
  return (
    <BuildingRoomsWorkspace
      getRooms={roomApi.getAdminRooms}
      roomBasePath="/admin/rooms"
      createRoomPath="/admin/rooms/create"
      deleteRoom={roomApi.deleteAdminRoom}
      canManage
    />
  );
}
