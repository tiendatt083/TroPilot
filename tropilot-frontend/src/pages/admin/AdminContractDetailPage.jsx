import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import * as contractApi from '../../features/contracts/api.js';
import ContractFileHistoryList from '../../components/ContractFileHistoryList.jsx';
import ContractUploadForm from '../../components/ContractUploadForm.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { getContractStatusClass, getContractStatusLabel } from '../../utils/contractStatusOptions.js';
import { formatDisplayDate } from '../../utils/dateFormat.js';
import { resolveFileUrl } from '../../utils/fileUrl.js';
import { formatRoomCode, formatRoomLabel } from '../../utils/roomDisplay.js';

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
  const [showUploadForm, setShowUploadForm] = useState(false);

  const loadContract = async () => {
    setError('');

    try {
      const response = await contractApi.getAdminContract(id);
      setContract(response.data);
      setShowUploadForm(false);
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
      const isChangingContract = Boolean(contract?.contractFileUrl);
      const response = await contractApi.uploadAdminContract(id, file);
      setContract(response.data);
      setShowUploadForm(false);
      setMessage(isChangingContract ? 'Rental contract changed successfully.' : 'Rental contract uploaded successfully.');
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Rental contract could not be uploaded');
    } finally {
      setUploading(false);
    }
  };

  const handleChangeContract = () => {
    setMessage('');
    setError('');
    setShowUploadForm(true);
  };

  if (loading) {
    return <div className="empty-state">Loading rental contract...</div>;
  }

  if (!contract) {
    return <div className="empty-state">{error || 'Rental contract not found.'}</div>;
  }

  const hasContractFile = Boolean(contract.contractFileUrl);
  const shouldShowUploadForm = !hasContractFile || showUploadForm;

  return (
    <section className="content-section">
      <div className="page-title-row">
        <PageHeader eyebrow={formatRoomCode(contract)} title="Rental contract" />
        <div className="button-row">
          <Link className="secondary-link" to="/admin/contracts">
            Back
          </Link>
          {hasContractFile && (
            <a className="button-link" href={resolveFileUrl(contract.contractFileUrl)} target="_blank" rel="noreferrer">
              Open file
            </a>
          )}
          {hasContractFile && !showUploadForm && (
            <button className="secondary-button inline-button" type="button" onClick={handleChangeContract}>
              Change contract
            </button>
          )}
          {hasContractFile && showUploadForm && (
            <button
              className="secondary-button inline-button"
              type="button"
              disabled={uploading}
              onClick={() => setShowUploadForm(false)}
            >
              Cancel change
            </button>
          )}
        </div>
      </div>

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

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

      <section className="assignment-panel">
        <PageHeader
          eyebrow={hasContractFile ? 'Uploaded file' : 'Upload'}
          title={hasContractFile ? 'Current contract file' : 'Contract file'}
        />
        {hasContractFile && !showUploadForm && (
          <div className="contract-file-summary">
            <strong>Contract file is uploaded</strong>
            <p>Use Change contract only when the signed contract file must be replaced.</p>
          </div>
        )}
        {shouldShowUploadForm && (
          <ContractUploadForm
            loading={uploading}
            loadingLabel={hasContractFile ? 'Changing contract...' : 'Uploading...'}
            submitLabel={hasContractFile ? 'Save new contract' : 'Upload contract'}
            onSubmit={handleUpload}
          />
        )}
      </section>

      <ContractFileHistoryList files={contract.previousContractFiles} />
    </section>
  );
}
