/** Chuẩn hóa chuỗi tìm kiếm: bỏ khoảng trắng thừa, không phân biệt hoa thường và dấu tiếng Việt. */
export function normalizeSearchText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}
