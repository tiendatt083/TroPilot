import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as paymentApi from '../../features/payments/api.js';
import EmptyState from '../../components/common/EmptyState.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import ReceiptDetail from '../../components/ReceiptDetail.jsx';
import ReceiptTable from '../../components/ReceiptTable.jsx';

export default function AdminReceiptListPage() {
  const { t } = useTranslation();
  const [receipts, setReceipts] = useState([]);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingDetailId, setLoadingDetailId] = useState(null);

  useEffect(() => {
    paymentApi
      .getAdminReceipts()
      .then((response) => setReceipts(response.data))
      .catch((apiError) => setError(apiError.response?.data?.message || t('tables.receipts.loadError')))
      .finally(() => setLoading(false));
  }, []);

  const handleView = async (receipt) => {
    setLoadingDetailId(receipt.id);
    setError('');

    try {
      const response = await paymentApi.getAdminReceipt(receipt.id);
      setSelectedReceipt(response.data);
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('tables.receipts.detailLoadError'));
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
      {t('common.view')}
    </button>
  );

  return (
    <section className="content-section">
      <PageHeader eyebrow={t('tables.receipts.adminEyebrow')} title={t('tables.receipts.title')} />

      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <EmptyState message={t('tables.receipts.loading')} />
      ) : (
        <section className="receipt-workspace">
          <ReceiptTable receipts={receipts} renderActions={renderActions} />
          <ReceiptDetail receipt={selectedReceipt} showBuilding />
        </section>
      )}
    </section>
  );
}
