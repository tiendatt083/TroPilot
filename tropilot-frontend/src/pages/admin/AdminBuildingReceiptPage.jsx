import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';
import * as paymentApi from '../../features/payments/api.js';
import ActionDialog from '../../components/common/ActionDialog.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
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
      aria-label={t('common.view')}
      className="icon-action-button"
      data-tooltip={t('common.view')}
      type="button"
      disabled={loadingDetailId === receipt.id}
      onClick={() => handleView(receipt)}
    >
      <EyeIcon />
    </button>
  );

  return (
    <div className="building-workspace">
      <div className="building-section-header">
        <span className="page-eyebrow">{t('workspace.receipts.eyebrow')}</span>
      </div>

      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <EmptyState message={t('tables.receipts.loading')} />
      ) : (
        <section className="receipt-workspace receipt-workspace-list-only">
          <ReceiptTable receipts={receipts} renderActions={renderActions} />
        </section>
      )}

      <ActionDialog
        className="action-dialog-wide receipt-detail-dialog"
        eyebrow={selectedReceipt?.receiptCode || t('workspace.receipts.eyebrow')}
        labelledBy="building-receipt-detail-dialog-title"
        open={Boolean(selectedReceipt)}
        title={t('tables.receipts.title')}
        onClose={() => setSelectedReceipt(null)}
      >
        <ReceiptDetail receipt={selectedReceipt} />
      </ActionDialog>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z" />
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
    </svg>
  );
}
