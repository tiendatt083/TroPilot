import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import * as contractApi from '../../api/contractApi.js';
import ContractUploadForm from '../../components/ContractUploadForm.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { getContractStatusClass, getContractStatusLabel } from '../../utils/contractStatusOptions.js';
import { resolveFileUrl } from '../../utils/fileUrl.js';

function formatNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue)
    ? numberValue.toLocaleString('en-US', { maximumFractionDigits: 2 })
    : value;
}

function isCurrentContract(contract) {
  return contract.rentalStatus !== 'ENDED';
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
  const [marking, setMarking] = useState(false);

  const buildingFilter = { buildingId: building.id };

  const loadContracts = async () => {
    setError('');

    try {
      const response = await contractApi.getAdminContracts(buildingFilter);
      setContracts(response.data.filter(isCurrentContract));
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Building contracts could not be loaded');
    }
  };

  useEffect(() => {
    setLoading(true);
    setSelectedContract(null);
    loadContracts().finally(() => setLoading(false));
  }, [building.id]);

  const handleView = async (contract) => {
    setLoadingDetailId(contract.id);
    setMessage('');
    setError('');

    try {
      const response = await contractApi.getAdminContract(contract.id, buildingFilter);
      setSelectedContract(response.data);
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
      const response = await contractApi.uploadAdminContract(selectedContract.id, file, buildingFilter);
      setSelectedContract(response.data);
      setMessage('Rental contract uploaded successfully.');
      await loadContracts();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Rental contract could not be uploaded');
    } finally {
      setUploading(false);
    }
  };

  const handleMarkNeedUpdate = async () => {
    if (!selectedContract) {
      return;
    }

    setMarking(true);
    setMessage('');
    setError('');

    try {
      const response = await contractApi.markContractNeedUpdate(selectedContract.id, buildingFilter);
      setSelectedContract(response.data);
      setMessage('Rental contract marked as needing update successfully.');
      await loadContracts();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Rental contract could not be marked as needing update');
    } finally {
      setMarking(false);
    }
  };

  return (
    <div className="building-workspace">
      <PageHeader eyebrow="Building contracts" title="Contracts in this building" />

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">Loading rental contracts...</div>
      ) : (
        <section className="invoice-workspace">
          <div className="table-wrap">
            <table className="data-table">
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
                    <td>{contract.roomCode}</td>
                    <td>{contract.residentHeadName}</td>
                    <td>
                      {contract.startDate} to {contract.endDate}
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

          <div className="invoice-list-column">
            {selectedContract ? (
              <>
                <section className="detail-panel">
                  <div>
                    <span>Room</span>
                    <strong>
                      {selectedContract.roomCode} - {selectedContract.roomName}
                    </strong>
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
                      {selectedContract.startDate} to {selectedContract.endDate}
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
                    <PageHeader eyebrow="Upload" title="Contract file" />
                    <div className="button-row">
                      {selectedContract.contractFileUrl && (
                        <a
                          className="button-link"
                          href={resolveFileUrl(selectedContract.contractFileUrl)}
                          target="_blank"
                          rel="noreferrer"
                        >
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
                  <ContractUploadForm loading={uploading} onSubmit={handleUpload} />
                </section>
              </>
            ) : (
              <div className="empty-state">Select a contract to view details.</div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
