import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';
import * as contractApi from '../../features/contracts/api.js';
import ActionDialog from '../../components/common/ActionDialog.jsx';
import ContractFileHistoryList from '../../components/ContractFileHistoryList.jsx';
import ContractUploadForm from '../../components/ContractUploadForm.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { getContractStatusClass } from '../../utils/contractStatusOptions.js';
import { formatDisplayDate } from '../../utils/dateFormat.js';
import { resolveFileUrl } from '../../utils/fileUrl.js';
import { formatEnumLabel } from '../../utils/i18nFormat.js';
import { formatRoomCode, formatRoomLabel } from '../../utils/roomDisplay.js';

function formatNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue)
    ? numberValue.toLocaleString('en-US', { maximumFractionDigits: 2 })
    : value;
}

export default function AdminBuildingContractPage() {
  const { t } = useTranslation();
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
      setError(apiError.response?.data?.message || t('workspace.contracts.loadError'));
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
      setError(apiError.response?.data?.message || t('contracts.detailLoadError'));
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
      setMessage(isChangingContract ? t('contracts.changed') : t('contracts.uploaded'));
      await loadContracts();
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('contracts.uploadError'));
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
      <PageHeader eyebrow={t('workspace.contracts.eyebrow')} title={t('workspace.contracts.title')} />

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">{t('contracts.listLoading')}</div>
      ) : (
        <section className="building-contract-workspace">
          <div className="building-contract-list-panel">
            <div className="building-contract-panel-header">
              <div>
                <span>{t('workspace.contracts.currentRentals')}</span>
                <strong>{t('workspace.contracts.activeContracts')}</strong>
              </div>
              <p>{t('workspace.contracts.activeCount', { count: contracts.length })}</p>
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
                    <th>{t('tables.common.room')}</th>
                    <th>{t('tables.common.headResident')}</th>
                    <th>{t('tables.common.period')}</th>
                    <th>{t('tables.common.depositAmount')}</th>
                    <th>{t('tables.common.status')}</th>
                    <th>{t('workspace.buildings.details')}</th>
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
                        {formatDisplayDate(contract.startDate)} {t('common.to')} {formatDisplayDate(contract.endDate)}
                      </td>
                      <td>{formatNumber(contract.depositAmount)}</td>
                      <td>
                        <span className={getContractStatusClass(contract.contractStatus)}>
                          {formatEnumLabel(t, 'contractStatus', contract.contractStatus)}
                        </span>
                      </td>
                      <td>
                        <button
                          className="secondary-button compact-button"
                          type="button"
                          disabled={loadingDetailId === contract.id}
                          onClick={() => handleView(contract)}
                        >
                          {t('common.view')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {contracts.length === 0 && <div className="empty-state flat-empty-state">{t('contracts.listEmpty')}</div>}
            </div>
          </div>

          <ActionDialog
            className="action-dialog-wide"
            eyebrow={selectedContract ? formatRoomCode(selectedContract) : t('contracts.adminEyebrow')}
            labelledBy="building-contract-detail-dialog-title"
            open={Boolean(selectedContract)}
            title={t('contracts.title')}
            onClose={() => {
              if (!uploading) {
                setSelectedContract(null);
                setShowUploadForm(false);
              }
            }}
          >
            {selectedContract && (
              <div className="building-contract-detail-column">
              <section className="detail-panel">
                <div>
                  <span>{t('tables.common.room')}</span>
                  <strong>{formatRoomLabel(selectedContract)}</strong>
                </div>
                <div>
                  <span>{t('tables.common.building')}</span>
                  <strong>
                    {selectedContract.buildingCode} - {selectedContract.buildingName}
                  </strong>
                </div>
                <div>
                  <span>{t('tables.common.headResident')}</span>
                  <strong>{selectedContract.residentHeadName}</strong>
                </div>
                <div>
                  <span>{t('profile.fields.email')}</span>
                  <strong>{selectedContract.residentHeadEmail}</strong>
                </div>
                <div>
                  <span>{t('contracts.period')}</span>
                  <strong>
                    {formatDisplayDate(selectedContract.startDate)} {t('common.to')} {formatDisplayDate(selectedContract.endDate)}
                  </strong>
                </div>
                <div>
                  <span>{t('tables.common.depositAmount')}</span>
                  <strong>{formatNumber(selectedContract.depositAmount)}</strong>
                </div>
                <div>
                  <span>{t('contracts.status')}</span>
                  <strong>
                    <span className={getContractStatusClass(selectedContract.contractStatus)}>
                      {formatEnumLabel(t, 'contractStatus', selectedContract.contractStatus)}
                    </span>
                  </strong>
                </div>
                <div>
                  <span>{t('contracts.rentalStatus')}</span>
                  <strong>{formatEnumLabel(t, 'rentalStatus', selectedContract.rentalStatus)}</strong>
                </div>
              </section>

              <section className="assignment-panel">
                <div className="page-title-row">
                  <PageHeader
                    eyebrow={hasSelectedContractFile ? t('contracts.uploadedFile') : t('contracts.uploadEyebrow')}
                    title={hasSelectedContractFile ? t('contracts.currentFile') : t('contracts.upload.file')}
                  />
                  <div className="button-row">
                    {hasSelectedContractFile && (
                      <a
                        className="button-link"
                        href={resolveFileUrl(selectedContract.contractFileUrl)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {t('contracts.openFile')}
                      </a>
                    )}
                    {hasSelectedContractFile && !showUploadForm && (
                      <button className="secondary-button inline-button" type="button" onClick={handleChangeContract}>
                        {t('contracts.change')}
                      </button>
                    )}
                    {hasSelectedContractFile && showUploadForm && (
                      <button
                        className="secondary-button inline-button"
                        type="button"
                        disabled={uploading}
                        onClick={() => setShowUploadForm(false)}
                      >
                        {t('contracts.cancelChange')}
                      </button>
                    )}
                  </div>
                </div>
                {hasSelectedContractFile && !showUploadForm && (
                  <div className="contract-file-summary">
                    <strong>{t('contracts.fileUploaded')}</strong>
                    <p>{t('contracts.changeHelp')}</p>
                  </div>
                )}
                {shouldShowUploadForm && (
                  <ContractUploadForm
                    loading={uploading}
                    loadingLabel={hasSelectedContractFile ? t('contracts.changing') : t('contracts.upload.uploading')}
                    submitLabel={hasSelectedContractFile ? t('contracts.saveNew') : t('contracts.upload.submit')}
                    onSubmit={handleUpload}
                  />
                )}
              </section>

              <ContractFileHistoryList files={selectedContract.previousContractFiles} />
              </div>
            )}
          </ActionDialog>
        </section>
      )}
    </div>
  );
}
