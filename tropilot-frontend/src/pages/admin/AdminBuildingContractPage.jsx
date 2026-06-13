import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
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

export default function AdminBuildingContractPage() {
  const { building } = useOutletContext();
  const [contracts, setContracts] = useState([]);
  const [selectedContract, setSelectedContract] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingDetailId, setLoadingDetailId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);

  const buildingFilter = { buildingId: building.id };

  const loadContracts = async () => {
    setError('');

    try {
      const response = await contractApi.getAdminContracts(buildingFilter);
      const activeContracts = response.data || [];
      setContracts(activeContracts);
      setSelectedContract((currentContract) => {
        if (!currentContract) {
          return null;
        }

        return activeContracts.some((contract) => contract.id === currentContract.id)
          ? currentContract
          : null;
      });
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Building contracts could not be loaded');
    }
  };

  useEffect(() => {
    setLoading(true);
    setSelectedContract(null);
    setShowUploadForm(false);
    loadContracts().finally(() => setLoading(false));
  }, [building.id]);

  const handleView = async (contract) => {
    setLoadingDetailId(contract.id);
    setMessage('');
    setError('');

    try {
      const response = await contractApi.getAdminContract(contract.id, buildingFilter);
      setSelectedContract(response.data);
      setShowUploadForm(false);
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Rental contract could not be loaded');
    } finally {
      setLoadingDetailId(null);
    }
  };

  const handleUpload = async (file) => {
    if (!selectedContract) {
      return;
    }

    setUploading(true);
    setMessage('');
    setError('');

    try {
      const isChangingContract = Boolean(selectedContract.contractFileUrl);
      const response = await contractApi.uploadAdminContract(selectedContract.id, file, buildingFilter);
      setSelectedContract(response.data);
      setShowUploadForm(false);
      setMessage(isChangingContract ? 'Rental contract changed successfully.' : 'Rental contract uploaded successfully.');
      await loadContracts();
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

  const hasSelectedContractFile = Boolean(selectedContract?.contractFileUrl);
  const shouldShowUploadForm = Boolean(selectedContract) && (!hasSelectedContractFile || showUploadForm);

  return (
    <div className="building-workspace">
      <PageHeader eyebrow="Building contracts" title="Contracts in this building" />

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">Loading rental contracts...</div>
      ) : (
        <section className="building-contract-workspace">
          <div className="building-contract-list-panel">
            <div className="building-contract-panel-header">
              <div>
                <span>Current rentals</span>
                <strong>Active contracts</strong>
              </div>
              <p>{contracts.length} active contract{contracts.length === 1 ? '' : 's'} in this building</p>
            </div>
            <div className="table-wrap building-contract-table-wrap">
              <table className="data-table">
                <colgroup>
                  <col className="building-contract-room-col" />
                  <col className="building-contract-resident-col" />
                  <col className="building-contract-period-col" />
                  <col className="building-contract-deposit-col" />
                  <col className="building-contract-status-col" />
                  <col className="building-contract-action-col" />
                </colgroup>
                <thead>
                  <tr>
                    <th>Room</th>
                    <th>Head Resident</th>
                    <th>Period</th>
                    <th>Deposit</th>
                    <th>Status</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map((contract) => (
                    <tr key={contract.id}>
                      <td>
                        <div className="table-primary-cell">
                          <strong>{formatRoomCode(contract)}</strong>
                          <span>{contract.buildingCode}</span>
                        </div>
                      </td>
                      <td>
                        <div className="table-primary-cell">
                          <strong>{contract.residentHeadName}</strong>
                          <span>{contract.residentHeadEmail}</span>
                        </div>
                      </td>
                      <td>
                        {formatDisplayDate(contract.startDate)} to {formatDisplayDate(contract.endDate)}
                      </td>
                      <td>{formatNumber(contract.depositAmount)}</td>
                      <td>
                        <span className={getContractStatusClass(contract.contractStatus)}>
                          {getContractStatusLabel(contract.contractStatus)}
                        </span>
                      </td>
                      <td>
                        <button
                          className="secondary-button compact-button"
                          type="button"
                          disabled={loadingDetailId === contract.id}
                          onClick={() => handleView(contract)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {contracts.length === 0 && <div className="empty-state flat-empty-state">No active rental contracts found.</div>}
            </div>
          </div>

          {selectedContract && (
            <div className="building-contract-detail-column">
              <section className="detail-panel">
                <div>
                  <span>Room</span>
                  <strong>{formatRoomLabel(selectedContract)}</strong>
                </div>
                <div>
                  <span>Building</span>
                  <strong>
                    {selectedContract.buildingCode} - {selectedContract.buildingName}
                  </strong>
                </div>
                <div>
                  <span>Head Resident</span>
                  <strong>{selectedContract.residentHeadName}</strong>
                </div>
                <div>
                  <span>Email</span>
                  <strong>{selectedContract.residentHeadEmail}</strong>
                </div>
                <div>
                  <span>Contract period</span>
                  <strong>
                    {formatDisplayDate(selectedContract.startDate)} to {formatDisplayDate(selectedContract.endDate)}
                  </strong>
                </div>
                <div>
                  <span>Deposit amount</span>
                  <strong>{formatNumber(selectedContract.depositAmount)}</strong>
                </div>
                <div>
                  <span>Contract status</span>
                  <strong>
                    <span className={getContractStatusClass(selectedContract.contractStatus)}>
                      {getContractStatusLabel(selectedContract.contractStatus)}
                    </span>
                  </strong>
                </div>
                <div>
                  <span>Rental status</span>
                  <strong>{selectedContract.rentalStatus}</strong>
                </div>
              </section>

              <section className="assignment-panel">
                <div className="page-title-row">
                  <PageHeader
                    eyebrow={hasSelectedContractFile ? 'Uploaded file' : 'Upload'}
                    title={hasSelectedContractFile ? 'Current contract file' : 'Contract file'}
                  />
                  <div className="button-row">
                    {hasSelectedContractFile && (
                      <a
                        className="button-link"
                        href={resolveFileUrl(selectedContract.contractFileUrl)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open file
                      </a>
                    )}
                    {hasSelectedContractFile && !showUploadForm && (
                      <button className="secondary-button inline-button" type="button" onClick={handleChangeContract}>
                        Change contract
                      </button>
                    )}
                    {hasSelectedContractFile && showUploadForm && (
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
                {hasSelectedContractFile && !showUploadForm && (
                  <div className="contract-file-summary">
                    <strong>Contract file is uploaded</strong>
                    <p>Use Change contract only when the signed contract file must be replaced.</p>
                  </div>
                )}
                {shouldShowUploadForm && (
                  <ContractUploadForm
                    loading={uploading}
                    loadingLabel={hasSelectedContractFile ? 'Changing contract...' : 'Uploading...'}
                    submitLabel={hasSelectedContractFile ? 'Save new contract' : 'Upload contract'}
                    onSubmit={handleUpload}
                  />
                )}
              </section>

              <ContractFileHistoryList files={selectedContract.previousContractFiles} />
            </div>
          )}
        </section>
      )}
    </div>
  );
}
