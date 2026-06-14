import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';
import * as paymentApi from '../../features/payments/api.js';
import EmptyState from '../../components/common/EmptyState.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import { ReceiptDetail, ReceiptTable } from '../../features/payments/components/index.js';

export default function AdminBuildingReceiptPage() {
  const { t } = useTranslation();
  const { building } = useOutletContext();
  const [receipts, setReceipts] = useState([]);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingDetailId, setLoadingDetailId] = useState(null);

  const buildingFilter = { buildingId: building.id };

  useEffect(() => {
    setLoading(true);
    setError('');
    setSelectedReceipt(null);

    paymentApi
      .getAdminReceipts(buildingFilter)
      .then((response) => setReceipts(response.data))
      .catch((apiError) => setError(apiError.response?.data?.message || t('workspace.receipts.loadError')))
      .finally(() => setLoading(false));
  }, [building.id]);

  const handleView = async (receipt) => {
    setLoadingDetailId(receipt.id);
    setError('');

    try {
      const response = await paymentApi.getAdminReceipt(receipt.id, buildingFilter);
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
    <div className="building-workspace">
      <PageHeader eyebrow={t('workspace.receipts.eyebrow')} title={t('workspace.receipts.title')} />

      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <EmptyState message={t('tables.receipts.loading')} />
      ) : (
        <section className="receipt-workspace">
          <ReceiptTable receipts={receipts} renderActions={renderActions} />
          <ReceiptDetail receipt={selectedReceipt} />
        </section>
      )}
    </div>
  );
}
