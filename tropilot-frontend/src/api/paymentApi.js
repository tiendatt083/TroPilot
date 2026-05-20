import apiClient from './axiosClient.js';

const multipartConfig = {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
};

function filterConfig(filters = {}) {
  const params = {};

  if (filters.buildingId) {
    params.buildingId = filters.buildingId;
  }

  return Object.keys(params).length ? { params } : {};
}

export async function uploadPaymentProof({ invoiceId, proofImage, note }) {
  const formData = new FormData();
  formData.append('invoiceId', invoiceId);
  formData.append('proofImage', proofImage);

  if (note) {
    formData.append('note', note);
  }

  const response = await apiClient.post('/api/resident/payments/upload', formData, multipartConfig);
  return response.data;
}

export async function getResidentPayments() {
  const response = await apiClient.get('/api/resident/payments');
  return response.data;
}

export async function getPendingPayments(filters) {
  const response = await apiClient.get('/api/staff/payments/pending', filterConfig(filters));
  return response.data;
}

export async function approvePayment(id, payload = {}, filters) {
  const response = await apiClient.put(`/api/staff/payments/${id}/approve`, payload, filterConfig(filters));
  return response.data;
}

export async function rejectPayment(id, payload = {}, filters) {
  const response = await apiClient.put(`/api/staff/payments/${id}/reject`, payload, filterConfig(filters));
  return response.data;
}

export async function getAdminReceipts(filters) {
  const response = await apiClient.get('/api/admin/receipts', filterConfig(filters));
  return response.data;
}

export async function getAdminReceipt(id, filters) {
  const response = await apiClient.get(`/api/admin/receipts/${id}`, filterConfig(filters));
  return response.data;
}
