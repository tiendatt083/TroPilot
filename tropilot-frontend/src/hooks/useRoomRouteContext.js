import { useParams } from 'react-router-dom';

export default function useRoomRouteContext(role) {
  const { id, roomId } = useParams();
  const isBuildingWorkspace = Boolean(roomId);

  return {
    roomBasePath: isBuildingWorkspace ? `/${role}/buildings/${id}/rooms` : `/${role}/rooms`,
    roomId: roomId || id
  };
}
