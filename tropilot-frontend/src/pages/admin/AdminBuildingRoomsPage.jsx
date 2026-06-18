import { useOutletContext } from 'react-router-dom';
import { BuildingRoomsWorkspace } from '../../features/rooms/components/index.js';
import * as roomApi from '../../features/rooms/api.js';

export default function AdminBuildingRoomsPage() {
  const { building } = useOutletContext();

  return (
    <BuildingRoomsWorkspace
      getRooms={roomApi.getAdminRooms}
      roomBasePath={`/admin/buildings/${building.id}/rooms`}
      createRoomPath="/admin/rooms/create"
      canManage
    />
  );
}
