import axios from 'axios';
import { clearStoredAuth, getStoredAuth } from '../utils/authStorage.js';
import { translateInterfaceText } from '../utils/interfaceTranslations.js';

const CACHE_PREFIX = 'tropilot.api-cache.';
const CACHE_TTL_MS = 45_000;

/** Cache ngắn hạn cho dữ liệu GET để chuyển trang/quay lại không gọi lại Tunnel không cần thiết. */
function getCacheKey(config) {
  const { user } = getStoredAuth();
  const params = config.params ? JSON.stringify(config.params) : '';

  return `${CACHE_PREFIX}${user?.id ?? 'guest'}:${config.url}:${params}`;
}

function readCachedResponse(cacheKey) {
  try {
    const cached = JSON.parse(window.sessionStorage.getItem(cacheKey));

    if (!cached || Date.now() - cached.savedAt > CACHE_TTL_MS) {
      window.sessionStorage.removeItem(cacheKey);
      return null;
    }

    return cached.data;
  } catch {
    return null;
  }
}

function clearApiCache() {
  Object.keys(window.sessionStorage)
    .filter((key) => key.startsWith(CACHE_PREFIX))
    .forEach((key) => window.sessionStorage.removeItem(key));
}

function saveCachedResponse(cacheKey, data) {
  try {
    const serialized = JSON.stringify({ savedAt: Date.now(), data });

    // Không lưu response lớn hoặc file vào sessionStorage.
    if (serialized.length <= 200_000) {
      window.sessionStorage.setItem(cacheKey, serialized);
    }
  } catch {
    // Cache chỉ là tối ưu trải nghiệm, không được làm hỏng request khi không thể lưu.
  }
}

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
  const method = config.method?.toLowerCase();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (method === 'get' && !config.responseType) {
    const cacheKey = getCacheKey(config);
    const cachedData = readCachedResponse(cacheKey);

    config.__tropilotCacheKey = cacheKey;

    if (cachedData !== null) {
      config.__tropilotCacheHit = true;
      config.adapter = () => Promise.resolve({
        data: cachedData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
        request: null
      });
    }
  } else if (method && !['get', 'head', 'options'].includes(method)) {
    // Sau thêm/sửa/xóa, dữ liệu GET cũ không còn đáng tin cậy.
    clearApiCache();
  }

  return config;
});

// Chuẩn hóa thông báo phản hồi; phiên hết hạn sẽ phát event để AuthContext đăng xuất giao diện.
apiClient.interceptors.response.use(
  (response) => {
    if (response.config.__tropilotCacheKey && !response.config.__tropilotCacheHit) {
      saveCachedResponse(response.config.__tropilotCacheKey, response.data);
    }

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
