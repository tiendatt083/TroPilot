/** Kiểm tra một phòng đang có người ở để giới hạn các thao tác chỉ dành cho phòng đã thuê. */
export function isOccupiedRoom(room) {
  return room?.status === 'OCCUPIED';
}
