/** Loại bỏ tiền tố mã tòa nhà khỏi mã phòng để tránh lặp, ví dụ A-101 thành 101. */
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

/** Ghép mã tòa nhà và mã phòng thành mã đầy đủ, ví dụ A và 101 thành A-101. */
export function buildFullRoomCode(roomCode, buildingCode) {
  const normalizedBuildingCode = String(buildingCode || '').trim();
  const normalizedRoomCode = stripRoomCodePrefix(roomCode, normalizedBuildingCode);

  if (!normalizedBuildingCode || !normalizedRoomCode) {
    return normalizedRoomCode;
  }

  return `${normalizedBuildingCode}-${normalizedRoomCode}`;
}

/** Chuẩn hóa mã phòng từ đối tượng room để hiển thị thống nhất trên giao diện. */
export function formatRoomCode(room) {
  if (!room?.roomCode) {
    return '';
  }

  const roomCode = stripRoomCodePrefix(room.roomCode, room.buildingCode);
  return room.buildingCode ? `${room.buildingCode}-${roomCode}` : roomCode;
}

/** Tạo nhãn phòng gồm mã và tên phòng; dùng tên mặc định khi thiếu dữ liệu. */
export function formatRoomLabel(room) {
  const roomCode = formatRoomCode(room);

  if (!roomCode) {
    return room?.roomName || 'Room';
  }

  return room?.roomName ? `${roomCode} - ${room.roomName}` : roomCode;
}
