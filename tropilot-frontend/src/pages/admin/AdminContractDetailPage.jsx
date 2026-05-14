import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import * as contractApi from '../../api/contractApi.js';
import ContractUploadForm from '../../components/ContractUploadForm.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { getContractStatusClass, getContractStatusLabel } from '../../utils/contractStatusOptions.js';

function formatNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue)
    ? numberValue.toLocaleString('en-US', { maximumFractionDigits: 2 })
    : value;
}

export default function AdminContractDetailPage() {
  const { id } = useParams();
  const [contract, setContract] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [marking, setMarking] = useState(false);

  const loadContract = async () => {
    setError('');

    try {
      const response = await contractApi.getAdminContract(id);
      setContract(response.data);
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Rental contract could not be loaded');
    }
  };

  useEffect(() => {
    loadContract().finally(() => setLoading(false));
  }, [id]);

  const handleUpload = async (file) => {
    setUploading(true);
    setMessage('');
    setError('');

    try {
      const response = await contractApi.uploadAdminContract(id, file);
      setContract(response.data);
      setMessage('Rental contract uploaded successfully.');
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Rental contract could not be uploaded');
    } finally {
      setUploading(false);
    }
  };

  const handleMarkNeedUpdate = async () => {
    setMarking(true);
    setMessage('');
    setError('');

    try {
      const response = await contractApi.markContractNeedUpdate(id);
      setContract(response.data);
      setMessage('Rental contract marked as needing update successfully.');
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Rental contract could not be marked as needing update');
    } finally {
      setMarking(false);
    }
  };

  if (loading) {
    return <div className="empty-state">Loading rental contract...</div>;
  }

  if (!contract) {
    return <div className="empty-state">{error || 'Rental contract not found.'}</div>;
  }

  return (
    <section className="content-section">
      <div className="page-title-row">
        <PageHeader eyebrow={contract.roomCode} title="Rental contract" />
        <div className="button-row">
          <Link className="secondary-link" to="/admin/contracts">
            Back
          </Link>
          {contract.contractFileUrl && (
            <a className="button-link" href={contract.contractFileUrl} target="_blank" rel="noreferrer">
              Open file
            </a>
          )}
          <button
            className="secondary-button inline-button"
            type="button"
            disabled={marking}
            onClick={handleMarkNeedUpdate}
          >
            Mark need update
          </button>
        </div>
      </div>

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      <div className="detail-panel">
        <div>
          <span>Room</span>
          <strong>
            {contract.roomCode} - {contract.roomName}
          </strong>
        </div>
        <div>
          <span>Building</span>
          <strong>
            {contract.buildingCode} - {contract.buildingName}
          </strong>
        </div>
        <div>
          <span>Head Resident</span>
          <strong>{contract.residentHeadName}</strong>
        </div>
        <div>
          <span>Email</span>
          <strong>{contract.residentHeadEmail}</strong>
        </div>
        <div>
          <span>Contract period</span>
          <strong>
            {contract.startDate} to {contract.endDate}
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

      <section className="assignment-panel">
        <PageHeader eyebrow="Upload" title="Contract file" />
        <ContractUploadForm loading={uploading} onSubmit={handleUpload} />
      </section>
    </section>
  );
}
