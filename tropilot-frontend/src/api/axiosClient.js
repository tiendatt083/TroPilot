import axios from 'axios';
import { clearStoredAuth, getStoredAuth } from '../utils/authStorage.js';
import { translateInterfaceText } from '../utils/interfaceTranslations.js';

/**
 * Axios client dùng chung cho mọi API frontend.
 * Client tự thêm JWT, dịch thông báo từ backend và xóa phiên khi server trả lỗi 401.
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Gắn token đang lưu vào Authorization để backend nhận diện người dùng cho mỗi request.
apiClient.interceptors.request.use((config) => {
  const { token } = getStoredAuth();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Chuẩn hóa thông báo phản hồi; phiên hết hạn sẽ phát event để AuthContext đăng xuất giao diện.
apiClient.interceptors.response.use(
  (response) => {
    if (response.data?.message) {
      response.data.message = translateInterfaceText(response.data.message);
    }

    return response;
  },
  (error) => {
    if (error.response?.status === 401 && error.config?.url !== '/api/auth/login') {
      clearStoredAuth();
      window.dispatchEvent(new Event('tropilot:auth-expired'));
    }

    if (error.response?.data?.message) {
      error.response.data.message = translateInterfaceText(error.response.data.message);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
