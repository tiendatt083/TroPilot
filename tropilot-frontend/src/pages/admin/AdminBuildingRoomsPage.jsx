import * as roomApi from '../../api/roomApi.js';
import BuildingRoomsWorkspace from '../../components/building/BuildingRoomsWorkspace.jsx';

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
