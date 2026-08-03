import { useEffect } from 'react';

// Kiểm tra lại trạng thái SePay mỗi 5 giây khi hóa đơn còn chờ thanh toán.
const PAYMENT_POLLING_INTERVAL_MS = 5000;

/** Chỉ bật polling khi cả hóa đơn và giao dịch SePay đều đang ở trạng thái chờ. */
function isWaitingForSepayPayment(invoice) {
  return invoice?.sepayPayment?.status === 'PENDING' && invoice?.status !== 'PAID';
}

/**
 * Tự tải lại hóa đơn trong nền để cập nhật giao diện ngay khi SePay xác nhận thanh toán.
 * Hook dừng timer khi hóa đơn đã thanh toán, bị hủy hoặc component bị unmount.
 */
export default function useInvoicePaymentPolling({
  invoice,
  fetchInvoice,
  onInvoiceUpdate,
  onPaymentConfirmed,
  enabled = true
}) {
  const pollingActive = enabled && isWaitingForSepayPayment(invoice);

  useEffect(() => {
    if (!pollingActive) {
      return undefined;
    }

    let cancelled = false;

    const refreshInvoice = async () => {
      try {
        const response = await fetchInvoice();
        const updatedInvoice = response?.data || response;

        if (cancelled || !updatedInvoice) {
          return;
        }

        onInvoiceUpdate(updatedInvoice);

        if (updatedInvoice.status === 'PAID' || updatedInvoice.sepayPayment?.status === 'PAID') {
          onPaymentConfirmed?.(updatedInvoice);
        }
      } catch {
        // Polling chỉ chạy nền; nếu request lỗi thì giữ nguyên dữ liệu đang hiển thị cho người dùng.
      }
    };

    const firstCheck = window.setTimeout(refreshInvoice, 1500);
    const intervalId = window.setInterval(refreshInvoice, PAYMENT_POLLING_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(firstCheck);
      window.clearInterval(intervalId);
    };
  }, [fetchInvoice, onInvoiceUpdate, onPaymentConfirmed, pollingActive]);
}
