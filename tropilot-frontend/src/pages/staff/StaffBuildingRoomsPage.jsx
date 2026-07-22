import { useOutletContext } from 'react-router-dom';
import BuildingRoomsWorkspace from '../../components/building/BuildingRoomsWorkspace.jsx';
import * as roomApi from '../../api/roomApi.js';

export default function StaffBuildingRoomsPage() {
  const { building } = useOutletContext();

  return (
    <BuildingRoomsWorkspace
      getRooms={roomApi.getStaffRooms}
      roomBasePath={`/staff/buildings/${building.id}/rooms`}
    />
  );
}
