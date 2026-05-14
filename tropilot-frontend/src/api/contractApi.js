import apiClient from './axiosClient.js';

export async function getAdminContracts() {
  const response = await apiClient.get('/api/admin/contracts');
  return response.data;
}

export async function getAdminContract(id) {
  const response = await apiClient.get(`/api/admin/contracts/${id}`);
  return response.data;
}

export async function uploadAdminContract(id, file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post(`/api/admin/contracts/${id}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
}

export async function markContractNeedUpdate(id) {
  const response = await apiClient.put(`/api/admin/contracts/${id}/mark-need-update`);
  return response.data;
}

export async function getCurrentResidentContract() {
  const response = await apiClient.get('/api/resident/contracts/current');
  return response.data;
}

export async function confirmResidentContract(id) {
  const response = await apiClient.put(`/api/resident/contracts/${id}/confirm`);
  return response.data;
}

export async function reportResidentContractIssue(id) {
  const response = await apiClient.post(`/api/resident/contracts/${id}/report-error`);
  return response.data;
}
