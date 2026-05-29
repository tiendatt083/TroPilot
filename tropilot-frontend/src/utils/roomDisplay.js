export function stripRoomCodePrefix(roomCode, buildingCode) {
  const normalizedRoomCode = String(roomCode || '').trim();
  const normalizedBuildingCode = String(buildingCode || '').trim();

  if (!normalizedBuildingCode) {
    return normalizedRoomCode;
  }

  const prefix = `${normalizedBuildingCode}-`;
  return normalizedRoomCode.toLowerCase().startsWith(prefix.toLowerCase())
    ? normalizedRoomCode.slice(prefix.length)
    : normalizedRoomCode;
}

export function buildFullRoomCode(roomCode, buildingCode) {
  const normalizedBuildingCode = String(buildingCode || '').trim();
  const normalizedRoomCode = stripRoomCodePrefix(roomCode, normalizedBuildingCode);

  if (!normalizedBuildingCode || !normalizedRoomCode) {
    return normalizedRoomCode;
  }

  return `${normalizedBuildingCode}-${normalizedRoomCode}`;
}

export function formatRoomCode(room) {
  if (!room?.roomCode) {
    return '';
  }

  const roomCode = stripRoomCodePrefix(room.roomCode, room.buildingCode);
  return room.buildingCode ? `${room.buildingCode}-${roomCode}` : roomCode;
}

export function formatRoomLabel(room) {
  const roomCode = formatRoomCode(room);

  if (!roomCode) {
    return room?.roomName || 'Room';
  }

  return room?.roomName ? `${roomCode} - ${room.roomName}` : roomCode;
}
