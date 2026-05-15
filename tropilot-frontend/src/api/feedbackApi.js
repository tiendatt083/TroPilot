import apiClient from './axiosClient.js';

export async function createResidentFeedback(payload) {
  const response = await apiClient.post('/api/resident/feedbacks', payload);
  return response.data;
}

export async function createInvoiceComplaint(invoiceId, payload) {
  const response = await apiClient.post(`/api/resident/invoices/${invoiceId}/complaint`, payload);
  return response.data;
}

export async function getAdminFeedbacks() {
  const response = await apiClient.get('/api/admin/feedbacks');
  return response.data;
}

export async function replyAdminFeedback(id, payload) {
  const response = await apiClient.put(`/api/admin/feedbacks/${id}/reply`, payload);
  return response.data;
}

export async function updateAdminFeedbackStatus(id, payload) {
  const response = await apiClient.put(`/api/admin/feedbacks/${id}/status`, payload);
  return response.data;
}

export async function getAdminInvoiceComplaints() {
  const response = await apiClient.get('/api/admin/invoice-complaints');
  return response.data;
}
