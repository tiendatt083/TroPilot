import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authApi from '../api/authApi.js';
import { clearStoredAuth, getStoredAuth, setStoredAuth } from '../utils/authStorage.js';

// Context lưu trạng thái phiên đăng nhập để mọi trang có thể dùng chung token và thông tin người dùng.
const AuthContext = createContext(null);

/** Kiểm tra nhanh hạn JWT ở phía trình duyệt để không hiển thị tạm một phiên đã hết hạn. */
function isTokenExpired(token) {
  try {
    const payload = token.split('.')[1];
    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decodedPayload = JSON.parse(window.atob(normalizedPayload));

    return Boolean(decodedPayload.exp && decodedPayload.exp * 1000 <= Date.now());
  } catch {
    return false;
  }
}

/**
 * Cung cấp trạng thái đăng nhập và các thao tác đăng nhập, đăng xuất, đổi mật khẩu, cập nhật hồ sơ.
 * Khi ứng dụng mở lại, provider xác thực token đã lưu với backend trước khi coi phiên còn hợp lệ.
 */
export function AuthProvider({ children }) {
  const storedAuth = getStoredAuth();
  const canRestoreStoredSession = Boolean(
    storedAuth.token && storedAuth.user && !isTokenExpired(storedAuth.token)
  );
  const [token, setToken] = useState(storedAuth.token);
  const [user, setUser] = useState(storedAuth.user);
  // Đã có hồ sơ và JWT còn hạn: render ngay, đồng thời xác minh lại ở nền.
  const [loading, setLoading] = useState(Boolean(storedAuth.token) && !canRestoreStoredSession);

  /** Xóa toàn bộ thông tin phiên ở bộ nhớ trình duyệt và React state. */
  const logout = useCallback(() => {
    clearStoredAuth();
    setToken(null);
    setUser(null);
  }, []);

  // Nếu có token cũ, tải lại thông tin user để khôi phục phiên hoặc tự đăng xuất khi token hết hạn.
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return undefined;
    }

    if (isTokenExpired(token)) {
      logout();
      setLoading(false);
      return undefined;
    }

    let active = true;

    authApi
      .getCurrentUser()
      .then((response) => {
        if (!active) {
          return;
        }

        setUser(response.data);
        setStoredAuth(token, response.data);
      })
      .catch(() => {
        if (active) {
          logout();
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [logout, token]);

  // axiosClient phát sự kiện này khi backend trả 401; context sẽ xóa phiên ngay lập tức.
  useEffect(() => {
    const handleExpiredSession = () => {
      setToken(null);
      setUser(null);
    };

    window.addEventListener('tropilot:auth-expired', handleExpiredSession);
    return () => window.removeEventListener('tropilot:auth-expired', handleExpiredSession);
  }, []);

  /** Gọi API đăng nhập, chuẩn hóa dữ liệu phản hồi rồi lưu token và user vào localStorage. */
  const signIn = useCallback(async (credentials) => {
    const response = await authApi.login(credentials);
    const loggedInUser = {
      id: response.data.userId,
      fullName: response.data.fullName,
      email: response.data.email,
      role: response.data.role,
      mustChangePassword: response.data.mustChangePassword
    };

    setStoredAuth(response.data.token, loggedInUser);
    setToken(response.data.token);
    setUser(loggedInUser);

    return loggedInUser;
  }, []);

  /** Đổi mật khẩu lần đầu và cập nhật thông tin user đã lưu nếu thành công. */
  const changeFirstPassword = useCallback(async (payload) => {
    const response = await authApi.changePasswordFirstTime(payload);
    const updatedUser = response.data;

    setUser(updatedUser);

    if (token) {
      setStoredAuth(token, updatedUser);
    }

    return updatedUser;
  }, [token]);

  /** Cập nhật hồ sơ hiện tại và đồng bộ lại localStorage để dữ liệu không bị cũ khi tải lại trang. */
  const updateProfile = useCallback(async (payload) => {
    const response = await authApi.updateCurrentUser(payload);
    const updatedUser = response.data;

    setUser(updatedUser);

    if (token) {
      setStoredAuth(token, updatedUser);
    }

    return updatedUser;
  }, [token]);

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated: Boolean(token && user),
      signIn,
      logout,
      changeFirstPassword,
      updateProfile
    }),
    [changeFirstPassword, loading, logout, signIn, token, updateProfile, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Hook lấy AuthContext; báo lỗi rõ ràng nếu bị gọi ngoài AuthProvider. */
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
