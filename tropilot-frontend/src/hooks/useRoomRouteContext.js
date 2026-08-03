import { useParams } from 'react-router-dom';

/**
 * Chuẩn hóa id phòng và đường dẫn cơ sở cho trang phòng, dùng được ở cả route phòng độc lập
 * lẫn route phòng nằm trong không gian làm việc của một tòa nhà.
 */
export default function useRoomRouteContext(role) {
  const { id, roomId } = useParams();
  const isBuildingWorkspace = Boolean(roomId);

  return {
    roomBasePath: isBuildingWorkspace ? `/${role}/buildings/${id}/rooms` : `/${role}/rooms`,
    roomId: roomId || id
  };
}
