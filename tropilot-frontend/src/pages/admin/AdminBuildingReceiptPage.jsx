import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import * as paymentApi from '../../api/paymentApi.js';
import PageHeader from '../../components/PageHeader.jsx';
import ReceiptTable from '../../components/ReceiptTable.jsx';
import { getReceiptStatusClass, getReceiptStatusLabel } from '../../utils/paymentStatusOptions.js';

function formatNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue)
    ? numberValue.toLocaleString('en-US', { maximumFractionDigits: 2 })
    : value;
}

function ReceiptDetail({ receipt }) {
  if (!receipt) {
    return <div className="empty-state">Select a receipt to view details.</div>;
  }

  return (
    <section className="receipt-detail-panel">
      <div className="detail-panel">
        <div>
          <span>Receipt code</span>
          <strong>{receipt.receiptCode}</strong>
        </div>
        <div>
          <span>Status</span>
          <strong>
            <span className={getReceiptStatusClass(receipt.status)}>
              {getReceiptStatusLabel(receipt.status)}
            </span>
          </strong>
        </div>
        <div>
          <span>Invoice</span>
          <strong>
            #{receipt.invoiceId} - {receipt.invoiceMonth}
          </strong>
        </div>
        <div>
          <span>Amount</span>
          <strong>{formatNumber(receipt.amount)}</strong>
        </div>
        <div>
          <span>Room</span>
          <strong>
            {receipt.roomCode} - {receipt.roomName}
          </strong>
        </div>
        <div>
          <span>Head Resident</span>
          <strong>{receipt.residentHeadName}</strong>
        </div>
        <div>
          <span>Created by</span>
          <strong>{receipt.createdByName}</strong>
        </div>
        <div className="detail-wide">
          <span>Content</span>
          <p>{receipt.content}</p>
        </div>
      </div>
    </section>
  );
}

export default function AdminBuildingReceiptPage() {
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
      .catch((apiError) => setError(apiError.response?.data?.message || 'Building receipts could not be loaded'))
      .finally(() => setLoading(false));
  }, [building.id]);

  const handleView = async (receipt) => {
    setLoadingDetailId(receipt.id);
    setError('');

    try {
      const response = await paymentApi.getAdminReceipt(receipt.id, buildingFilter);
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
    <div className="building-workspace">
      <PageHeader eyebrow="Building receipts" title="Receipts in this building" />

      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">Loading receipts...</div>
      ) : (
        <section className="receipt-workspace">
          <ReceiptTable receipts={receipts} renderActions={renderActions} />
          <ReceiptDetail receipt={selectedReceipt} />
        </section>
      )}
    </div>
  );
}
