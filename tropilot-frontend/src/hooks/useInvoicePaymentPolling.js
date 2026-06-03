import { useEffect } from 'react';

const PAYMENT_POLLING_INTERVAL_MS = 5000;

function isWaitingForSepayPayment(invoice) {
  return invoice?.sepayPayment?.status === 'PENDING' && invoice?.status !== 'PAID';
}

export default function useInvoicePaymentPolling({
  invoice,
  fetchInvoice,
  onInvoiceUpdate,
  onPaymentConfirmed,
  enabled = true
}) {
  useEffect(() => {
    if (!enabled || !isWaitingForSepayPayment(invoice)) {
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
        // Payment polling is background-only. The visible page keeps its current state.
      }
    };

    const firstCheck = window.setTimeout(refreshInvoice, 1500);
    const intervalId = window.setInterval(refreshInvoice, PAYMENT_POLLING_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(firstCheck);
      window.clearInterval(intervalId);
    };
  }, [enabled, fetchInvoice, invoice, onInvoiceUpdate, onPaymentConfirmed]);
}
