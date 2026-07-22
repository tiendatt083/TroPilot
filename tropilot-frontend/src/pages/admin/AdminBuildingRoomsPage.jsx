import { useOutletContext } from 'react-router-dom';
import BuildingRoomsWorkspace from '../../components/building/BuildingRoomsWorkspace.jsx';
import * as roomApi from '../../api/roomApi.js';

export default function AdminBuildingRoomsPage() {
  const { building } = useOutletContext();

  return (
    <BuildingRoomsWorkspace
      getRooms={roomApi.getAdminRooms}
      createRoom={roomApi.createAdminRoom}
      roomBasePath={`/admin/buildings/${building.id}/rooms`}
      createRoomPath={`/admin/buildings/${building.id}/rooms/create`}
      canManage
    />
  );
}
