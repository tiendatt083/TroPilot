/** Tạo tên và vai trò dễ đọc cho người dùng trên giao diện. */
const BRAND_NAMES = new Set(['tropilot', 'tro pilot']);

/** Chuẩn hóa dữ liệu tên trước khi kiểm tra hoặc hiển thị. */
function normalizeName(value) {
  return String(value || '').trim();
}

/** Nhận diện tên thương hiệu để không hiển thị nhầm nó như tên một người dùng. */
function isBrandName(value) {
  return BRAND_NAMES.has(normalizeName(value).toLowerCase());
}

/** Lấy tên hiển thị ưu tiên họ tên, sau đó dùng phần trước @ của email nếu họ tên không phù hợp. */
export function getUserDisplayName(user, fallback = 'user') {
  const fullName = normalizeName(user?.fullName);

  if (fullName && !isBrandName(fullName)) {
    return fullName;
  }

  const emailName = normalizeName(user?.email).split('@')[0];

  if (emailName) {
    return emailName;
  }

  return fallback;
}

/** Đổi mã vai trò hệ thống thành tên vai trò dễ đọc, có hỗ trợ bản dịch. */
export function getRoleDisplayName(role, t) {
  if (role === 'ADMIN') {
    return t ? t('role.admin') : 'Admin';
  }

  if (role === 'STAFF') {
    return t ? t('role.staff') : 'Staff';
  }

  if (role === 'RESIDENT_HEAD') {
    return t ? t('role.residentHead') : 'Head resident';
  }

  return normalizeName(role).replaceAll('_', ' ') || 'User';
}
