import { useEffect, useState } from 'react';
import * as paymentApi from '../../features/payments/api.js';
import EmptyState from '../../components/common/EmptyState.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import ReceiptDetail from '../../components/ReceiptDetail.jsx';
import ReceiptTable from '../../components/ReceiptTable.jsx';

export default function AdminReceiptListPage() {
  const [receipts, setReceipts] = useState([]);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingDetailId, setLoadingDetailId] = useState(null);

  useEffect(() => {
    paymentApi
      .getAdminReceipts()
      .then((response) => setReceipts(response.data))
      .catch((apiError) => setError(apiError.response?.data?.message || 'Receipts could not be loaded'))
      .finally(() => setLoading(false));
  }, []);

  const handleView = async (receipt) => {
    setLoadingDetailId(receipt.id);
    setError('');

    try {
      const response = await paymentApi.getAdminReceipt(receipt.id);
      setSelectedReceipt(response.data);
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Receipt could not be loaded');
    } finally {
      setLoadingDetailId(null);
    }
  };

  const renderActions = (receipt) => (
    <button
      className="secondary-button compact-button"
      type="button"
      disabled={loadingDetailId === receipt.id}
      onClick={() => handleView(receipt)}
    >
      View
    </button>
  );

  return (
    <section className="content-section">
      <PageHeader eyebrow="Administrator" title="Receipts" />

      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <EmptyState message="Loading receipts..." />
      ) : (
        <section className="receipt-workspace">
          <ReceiptTable receipts={receipts} renderActions={renderActions} />
          <ReceiptDetail receipt={selectedReceipt} showBuilding />
        </section>
      )}
    </section>
  );
}
