import apiClient from './axiosClient.js';

const multipartConfig = {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
};

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

export async function getPendingPayments() {
  const response = await apiClient.get('/api/staff/payments/pending');
  return response.data;
}

export async function approvePayment(id, payload = {}) {
  const response = await apiClient.put(`/api/staff/payments/${id}/approve`, payload);
  return response.data;
}

export async function rejectPayment(id, payload = {}) {
  const response = await apiClient.put(`/api/staff/payments/${id}/reject`, payload);
  return response.data;
}

export async function getAdminReceipts() {
  const response = await apiClient.get('/api/admin/receipts');
  return response.data;
}

export async function getAdminReceipt(id) {
  const response = await apiClient.get(`/api/admin/receipts/${id}`);
  return response.data;
}
