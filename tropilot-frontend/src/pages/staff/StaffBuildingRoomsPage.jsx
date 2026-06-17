import { useOutletContext } from 'react-router-dom';
import { BuildingRoomsWorkspace } from '../../features/rooms/components/index.js';
import * as roomApi from '../../features/rooms/api.js';

export default function StaffBuildingRoomsPage() {
  const { building } = useOutletContext();

  return (
    <BuildingRoomsWorkspace
      getRooms={roomApi.getStaffRooms}
      roomBasePath={`/staff/buildings/${building.id}/rooms`}
    />
  );
}
