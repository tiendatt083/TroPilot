/** Lưu và lấy phiên đăng nhập của người dùng trong localStorage trên trình duyệt. */
const TOKEN_KEY = 'tropilot.auth.token';
const USER_KEY = 'tropilot.auth.user';

/** Đọc token và thông tin người dùng đã lưu; trả về giá trị rỗng khi chạy ngoài trình duyệt. */
export function getStoredAuth() {
  if (typeof window === 'undefined') {
    return {
      token: null,
      user: null
    };
  }

  const rawUser = window.localStorage.getItem(USER_KEY);
  let user = null;

  if (rawUser) {
    try {
      user = JSON.parse(rawUser);
    } catch {
      user = null;
    }
  }

  return {
    token: window.localStorage.getItem(TOKEN_KEY),
    user
  };
}

/** Lưu token cùng hồ sơ người dùng sau khi đăng nhập thành công. */
export function setStoredAuth(token, user) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/** Xóa toàn bộ phiên cục bộ khi người dùng đăng xuất hoặc token không còn hợp lệ. */
export function clearStoredAuth() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}
