import apiClient from './axiosClient.js';

/** API hóa đơn: admin xem trước/tạo/xóa theo tòa nhà, cư dân chỉ xem hóa đơn thuộc phòng mình. */
export async function getAdminBuildingInvoices(buildingId) {
  const response = await apiClient.get(`/api/admin/buildings/${buildingId}/invoices`);
  return response.data;
}

export async function getAdminBuildingInvoice(buildingId, invoiceId) {
  const response = await apiClient.get(`/api/admin/buildings/${buildingId}/invoices/${invoiceId}`);
  return response.data;
}

export async function previewBuildingInvoice(buildingId, payload) {
  const response = await apiClient.post(`/api/admin/buildings/${buildingId}/invoices/preview`, payload);
  return response.data;
}

export async function generateBuildingInvoice(buildingId, payload) {
  const response = await apiClient.post(`/api/admin/buildings/${buildingId}/invoices/generate`, payload);
  return response.data;
}

export async function previewBuildingBulkInvoices(buildingId, payload) {
  const response = await apiClient.post(`/api/admin/buildings/${buildingId}/invoices/bulk-preview`, payload);
  return response.data;
}

export async function generateBuildingBulkInvoices(buildingId, payload) {
  const response = await apiClient.post(`/api/admin/buildings/${buildingId}/invoices/bulk-generate`, payload);
  return response.data;
}

export async function deleteBuildingInvoice(buildingId, invoiceId) {
  const response = await apiClient.delete(`/api/admin/buildings/${buildingId}/invoices/${invoiceId}`);
  return response.data;
}

export async function getResidentInvoices() {
  const response = await apiClient.get('/api/resident/invoices');
  return response.data;
}

export async function getResidentInvoice(id) {
  const response = await apiClient.get(`/api/resident/invoices/${id}`);
  return response.data;
}
