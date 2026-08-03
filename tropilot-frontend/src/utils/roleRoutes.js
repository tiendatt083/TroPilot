/** Xác định trang dashboard được phép truy cập ngay sau khi đăng nhập theo vai trò. */
export function getDashboardPath(role) {
  if (role === 'ADMIN') {
    return '/admin/dashboard';
  }

  if (role === 'STAFF') {
    return '/staff/dashboard';
  }

  if (role === 'RESIDENT_HEAD') {
    return '/resident/dashboard';
  }

  return '/login';
}
