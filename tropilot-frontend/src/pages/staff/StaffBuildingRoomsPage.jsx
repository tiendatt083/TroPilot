import { useOutletContext } from 'react-router-dom';
import BuildingRoomsWorkspace from '../../components/building/BuildingRoomsWorkspace.jsx';
import * as roomApi from '../../api/roomApi.js';

/** Trang nhân viên xem danh sách phòng trong tòa nhà đang làm việc. */
export default function StaffBuildingRoomsPage() {
  const { building } = useOutletContext();

  return (
    <BuildingRoomsWorkspace
      getRooms={roomApi.getStaffRooms}
      roomBasePath={`/staff/buildings/${building.id}/rooms`}
    />
  );
}
