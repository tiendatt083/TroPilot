import apiClient from './axiosClient.js';

function toFormData(payload) {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      formData.append(key, value);
    }
  });

  return formData;
}

const multipartConfig = {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
};

export async function createUtilityReading(payload) {
  const response = await apiClient.post(
    '/api/staff/utility-readings',
    toFormData(payload),
    multipartConfig
  );
  return response.data;
}

export async function getStaffUtilityReadings() {
  const response = await apiClient.get('/api/staff/utility-readings');
  return response.data;
}

export async function getStaffUtilityReading(id) {
  const response = await apiClient.get(`/api/staff/utility-readings/${id}`);
  return response.data;
}

export async function getAdminUtilityReadings() {
  const response = await apiClient.get('/api/admin/utility-readings');
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
