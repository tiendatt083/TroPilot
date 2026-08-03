import apiClient from './axiosClient.js';

/** Chuyển dữ liệu chỉ số và ảnh đồng hồ thành FormData để gửi được tệp lên backend. */
function toFormData(payload) {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      formData.append(key, value);
    }
  });

  return formData;
}

// Cấu hình request chứa ảnh điện/nước.
const multipartConfig = {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
};

/** Chuẩn hóa filter tòa nhà và tháng cho danh sách/tổng quan chỉ số điện nước. */
function filterConfig(filters = {}) {
  const params = {};

  if (filters.buildingId) {
    params.buildingId = filters.buildingId;
  }

  if (filters.month) {
    params.month = filters.month;
  }

  return Object.keys(params).length > 0 ? { params } : {};
}

/**
 * API chỉ số điện nước: staff nhập/lấy số giả lập/xem tổng quan, admin xem/chỉnh sửa,
 * cư dân chỉ xem chỉ số của phòng hiện tại.
 */
export async function createUtilityReading(payload) {
  const response = await apiClient.post(
    '/api/staff/utility-readings',
    toFormData(payload),
    multipartConfig
  );
  return response.data;
}

export async function fetchElectricityReadingPreview({ roomId, readingDate }) {
  const response = await apiClient.post('/api/staff/utility-readings/fetch/electricity', null, {
    params: {
      roomId,
      readingDate
    }
  });
  return response.data;
}

export async function fetchWaterReadingPreview({ roomId, readingDate }) {
  const response = await apiClient.post('/api/staff/utility-readings/fetch/water', null, {
    params: {
      roomId,
      readingDate
    }
  });
  return response.data;
}

export async function getStaffUtilityReadings(filters) {
  const response = await apiClient.get('/api/staff/utility-readings', filterConfig(filters));
  return response.data;
}

export async function getStaffUtilityReadingOverview(filters) {
  const response = await apiClient.get('/api/staff/utility-readings/overview', filterConfig(filters));
  return response.data;
}

export async function updateStaffUtilityReading(id, payload) {
  const response = await apiClient.put(
    `/api/staff/utility-readings/${id}`,
    toFormData(payload),
    multipartConfig
  );
  return response.data;
}

export async function getAdminUtilityReadings(filters) {
  const response = await apiClient.get('/api/admin/utility-readings', filterConfig(filters));
  return response.data;
}

export async function getAdminUtilityReadingOverview(filters) {
  const response = await apiClient.get('/api/admin/utility-readings/overview', filterConfig(filters));
  return response.data;
}

export async function updateAdminUtilityReading(id, payload) {
  const response = await apiClient.put(
    `/api/admin/utility-readings/${id}`,
    toFormData(payload),
    multipartConfig
  );
  return response.data;
}

export async function getResidentUtilityReadings() {
  const response = await apiClient.get('/api/resident/utility-readings/current-room');
  return response.data;
}
