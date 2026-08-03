import apiClient from './axiosClient.js';

// Ảnh minh chứng thanh toán được gửi bằng FormData.
const multipartConfig = {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
};

/** Chuẩn hóa filter tòa nhà khi staff/admin xem phiếu thanh toán hoặc biên lai. */
function filterConfig(filters = {}) {
  const params = {};

  if (filters.buildingId) {
    params.buildingId = filters.buildingId;
  }

  return Object.keys(params).length ? { params } : {};
}

/** API thanh toán: cư dân tải minh chứng, staff xem phiếu chờ xác nhận, admin xem biên lai. */
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

export async function getPendingPayments(filters) {
  const response = await apiClient.get('/api/staff/payments/pending', filterConfig(filters));
  return response.data;
}

export async function getAdminReceipts(filters) {
  const response = await apiClient.get('/api/admin/receipts', filterConfig(filters));
  return response.data;
}
