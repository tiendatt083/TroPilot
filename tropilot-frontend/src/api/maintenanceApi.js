import apiClient from './axiosClient.js';

const multipartConfig = {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
};

function toFormData(payload) {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      formData.append(key, value);
    }
  });

  return formData;
}

export async function createResidentMaintenanceRequest(payload) {
  const response = await apiClient.post(
    '/api/resident/maintenance-requests',
    toFormData(payload),
    multipartConfig
  );
  return response.data;
}

export async function getResidentMaintenanceRequests() {
  const response = await apiClient.get('/api/resident/maintenance-requests');
  return response.data;
}

export async function getResidentMaintenanceRequest(id) {
  const response = await apiClient.get(`/api/resident/maintenance-requests/${id}`);
  return response.data;
}

export async function getAdminMaintenanceRequests() {
  const response = await apiClient.get('/api/admin/maintenance-requests');
  return response.data;
}

export async function assignAdminMaintenanceRequest(id, payload) {
  const response = await apiClient.put(`/api/admin/maintenance-requests/${id}/assign`, payload);
  return response.data;
}

export async function getStaffMaintenanceRequests() {
  const response = await apiClient.get('/api/staff/maintenance-requests');
  return response.data;
}

export async function startStaffMaintenanceRequest(id) {
  const response = await apiClient.put(`/api/staff/maintenance-requests/${id}/start`);
  return response.data;
}

export async function completeStaffMaintenanceRequest(id, payload) {
  const response = await apiClient.put(
    `/api/staff/maintenance-requests/${id}/complete`,
    toFormData(payload),
    multipartConfig
  );
  return response.data;
}

export async function rejectStaffMaintenanceRequest(id, payload) {
  const response = await apiClient.put(`/api/staff/maintenance-requests/${id}/reject`, payload || {});
  return response.data;
}
