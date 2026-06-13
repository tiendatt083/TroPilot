import { useEffect, useState } from 'react';
import * as contractApi from '../../features/contracts/api.js';
import ContractFileHistoryList from '../../components/ContractFileHistoryList.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { getContractStatusClass, getContractStatusLabel } from '../../utils/contractStatusOptions.js';
import { formatDisplayDate } from '../../utils/dateFormat.js';
import { resolveFileUrl } from '../../utils/fileUrl.js';
import { formatRoomLabel } from '../../utils/roomDisplay.js';

function formatNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue)
    ? numberValue.toLocaleString('en-US', { maximumFractionDigits: 2 })
    : value;
}

export default function ResidentContractPage() {
  const [contract, setContract] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const loadContract = async () => {
    setError('');

    try {
      const response = await contractApi.getCurrentResidentContract();
      setContract(response.data);
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Current rental contract could not be loaded');
    }
  };

  useEffect(() => {
    loadContract().finally(() => setLoading(false));
  }, []);

  const handleConfirm = async () => {
    setProcessing(true);
    setMessage('');
    setError('');

    try {
      const response = await contractApi.confirmResidentContract(contract.id);
      setContract(response.data);
      setMessage('Rental contract confirmed successfully.');
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Rental contract could not be confirmed');
    } finally {
      setProcessing(false);
    }
  };

  const handleReportIssue = async () => {
    setProcessing(true);
    setMessage('');
    setError('');

    try {
      const response = await contractApi.reportResidentContractIssue(contract.id);
      setContract(response.data);
      setMessage('Rental contract issue reported successfully.');
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Rental contract issue could not be reported');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="empty-state">Loading current rental contract...</div>;
  }

  return (
    <section className="content-section">
      <PageHeader eyebrow="Head resident" title="Rental contract" />

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      {contract ? (
        <>
          <div className="detail-panel">
            <div>
              <span>Room</span>
              <strong>{formatRoomLabel(contract)}</strong>
            </div>
            <div>
              <span>Building</span>
              <strong>
                {contract.buildingCode} - {contract.buildingName}
              </strong>
            </div>
            <div>
              <span>Contract period</span>
              <strong>
                {formatDisplayDate(contract.startDate)} to {formatDisplayDate(contract.endDate)}
              </strong>
            </div>
            <div>
              <span>Deposit amount</span>
              <strong>{formatNumber(contract.depositAmount)}</strong>
            </div>
            <div>
              <span>Contract status</span>
              <strong>
                <span className={getContractStatusClass(contract.contractStatus)}>
                  {getContractStatusLabel(contract.contractStatus)}
                </span>
              </strong>
            </div>
            <div>
              <span>Rental status</span>
              <strong>{contract.rentalStatus}</strong>
            </div>
          </div>

          <div className="button-row contract-actions">
            {contract.contractFileUrl ? (
              <a className="button-link" href={resolveFileUrl(contract.contractFileUrl)} target="_blank" rel="noreferrer">
                Open contract
              </a>
            ) : (
              <button type="button" disabled>
                No file uploaded
              </button>
            )}
            <button type="button" disabled={processing || !contract.contractFileUrl} onClick={handleConfirm}>
              Confirm viewed
            </button>
            <button
              className="secondary-button inline-button"
              type="button"
              disabled={processing}
              onClick={handleReportIssue}
            >
              Report issue
            </button>
          </div>

          <ContractFileHistoryList files={contract.previousContractFiles} />
        </>
      ) : (
        <div className="empty-state">No current rental contract found.</div>
      )}
    </section>
  );
}
