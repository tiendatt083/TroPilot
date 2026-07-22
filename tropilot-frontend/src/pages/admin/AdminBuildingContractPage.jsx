import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';
import * as contractApi from '../../api/contractApi.js';
import ActionDialog from '../../components/common/ActionDialog.jsx';
import ContractFileHistoryList from '../../components/ContractFileHistoryList.jsx';
import ContractUploadForm from '../../components/ContractUploadForm.jsx';
import FilterBar from '../../components/common/FilterBar.jsx';
import LineIcon from '../../components/common/LineIcon.jsx';
import { getContractStatusClass } from '../../utils/contractStatusOptions.js';
import { formatDisplayDate } from '../../utils/dateFormat.js';
import { openFileUrl, resolveFileUrl } from '../../utils/fileUrl.js';
import { formatEnumLabel } from '../../utils/i18nFormat.js';
import { formatRoomCode, formatRoomLabel } from '../../utils/roomDisplay.js';
import { normalizeSearchText } from '../../utils/searchText.js';

function formatNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue)
    ? numberValue.toLocaleString('en-US', { maximumFractionDigits: 2 })
    : value;
}

const emptyFilters = {
  search: '',
  status: ''
};

function contractMatchesSearch(contract, searchValue) {
  if (!searchValue) {
    return true;
  }

  const searchableValues = [
    contract.roomCode,
    contract.roomName,
    contract.buildingCode,
    contract.residentHeadName,
    contract.residentHeadEmail,
    contract.contractStatus,
    contract.rentalStatus,
    contract.startDate,
    contract.endDate
  ];

  return searchableValues.some((value) => normalizeSearchText(value).includes(searchValue));
}

function ContractInfoItem({ icon, label, value }) {
  return (
    <div className="contract-info-item">
      <span className={`contract-info-icon contract-info-icon-${icon}`}>
        <LineIcon name={icon} />
      </span>
      <span className="contract-info-copy">
        <span>{label}</span>
        <strong>{value}</strong>
      </span>
    </div>
  );
}

export default function AdminBuildingContractPage() {
  const { t } = useTranslation();
  const { building } = useOutletContext();
  const [contracts, setContracts] = useState([]);
  const [selectedContract, setSelectedContract] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingDetailId, setLoadingDetailId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [filters, setFilters] = useState(emptyFilters);

  const buildingFilter = { buildingId: building.id };
  const filteredContracts = useMemo(() => {
    const searchValue = normalizeSearchText(filters.search);

    return contracts.filter((contract) => (
      contractMatchesSearch(contract, searchValue)
      && (!filters.status || contract.contractStatus === filters.status)
    ));
  }, [contracts, filters]);
  const contractStatusOptions = useMemo(() => (
    Array.from(new Set(contracts.map((contract) => contract.contractStatus).filter(Boolean)))
  ), [contracts]);

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
    setUploadMessage('');
    setUploadError('');

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
    setUploadMessage('');
    setUploadError('');

    try {
      const isChangingContract = Boolean(selectedContract.contractFileUrl);
      const response = await contractApi.uploadAdminContract(selectedContract.id, file, buildingFilter);
      setSelectedContract(response.data);
      setShowUploadForm(false);
      setUploadMessage(isChangingContract ? t('contracts.changed') : t('contracts.uploaded'));
      await loadContracts();
    } catch (apiError) {
      setUploadError(apiError.response?.data?.message || t('contracts.uploadError'));
    } finally {
      setUploading(false);
    }
  };

  const handleChangeContract = () => {
    setMessage('');
    setError('');
    setUploadMessage('');
    setUploadError('');
    setShowUploadForm(true);
  };

  const handleClearFilters = () => {
    setFilters(emptyFilters);
  };

  const hasSelectedContractFile = Boolean(selectedContract?.contractFileUrl);

  return (
    <div className="building-workspace">
      <div className="building-section-header">
        <span className="page-eyebrow">{t('workspace.contracts.eyebrow')}</span>
      </div>

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">{t('contracts.listLoading')}</div>
      ) : (
        <section className="building-contract-workspace">
          <div className="building-contract-list-panel">
            <FilterBar
              as="div"
              className="workspace-filter-row"
              searchAriaLabel={t('workspace.filters.searchAria')}
              searchPlaceholder={t('workspace.filters.searchPlaceholder')}
              searchValue={filters.search}
              filters={[
                {
                  name: 'status',
                  value: filters.status,
                  ariaLabel: t('workspace.filters.statusAria'),
                  onChange: (value) => setFilters((current) => ({ ...current, status: value })),
                  options: [
                    { value: '', label: t('workspace.filters.allStatuses') },
                    ...contractStatusOptions.map((status) => ({
                      value: status,
                      label: formatEnumLabel(t, 'contractStatus', status)
                    }))
                  ]
                }
              ]}
              clearLabel={t('common.clear')}
              onClear={handleClearFilters}
              onSearchChange={(value) => setFilters((current) => ({ ...current, search: value }))}
            />
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
                    <th className="building-contract-action-header">{t('tables.common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContracts.map((contract) => (
                    <tr key={contract.id}>
                      <td>
                        <div className="table-primary-cell">
                          <strong>{formatRoomCode(contract)}</strong>
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
                      <td className="building-contract-action-cell">
                        <button
                          className="table-icon-button"
                          type="button"
                          disabled={loadingDetailId === contract.id}
                          onClick={() => handleView(contract)}
                          aria-label={t('common.view')}
                          title={t('common.view')}
                        >
                          <LineIcon name="eye" size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredContracts.length === 0 && <div className="empty-state flat-empty-state">{t('contracts.listEmpty')}</div>}
            </div>
          </div>

          <ActionDialog
            className="action-dialog-wide contract-detail-dialog"
            eyebrow={selectedContract ? formatRoomCode(selectedContract) : t('contracts.adminEyebrow')}
            labelledBy="building-contract-detail-dialog-title"
            open={Boolean(selectedContract)}
            title={t('contracts.title')}
            onClose={() => {
              if (!uploading) {
                setSelectedContract(null);
                setShowUploadForm(false);
                setUploadMessage('');
                setUploadError('');
              }
            }}
          >
            {selectedContract && (
              <div className="building-contract-detail-column">
                <div className="contract-detail-main-grid">
                  <section className="contract-detail-card contract-info-card">
                    <h3>{t('contracts.infoTitle', { defaultValue: 'Thông tin hợp đồng' })}</h3>
                    <div className="contract-info-grid">
                      <ContractInfoItem
                        icon="building"
                        label={t('tables.common.room')}
                        value={formatRoomLabel(selectedContract)}
                      />
                      <ContractInfoItem
                        icon="building"
                        label={t('tables.common.building')}
                        value={`${selectedContract.buildingCode} - ${selectedContract.buildingName}`}
                      />
                      <ContractInfoItem
                        icon="user"
                        label={t('tables.common.headResident')}
                        value={selectedContract.residentHeadName}
                      />
                      <ContractInfoItem
                        icon="mail"
                        label={t('profile.fields.email')}
                        value={selectedContract.residentHeadEmail}
                      />
                      <ContractInfoItem
                        icon="calendar"
                        label={t('contracts.period')}
                        value={`${formatDisplayDate(selectedContract.startDate)} ${t('common.to')} ${formatDisplayDate(selectedContract.endDate)}`}
                      />
                      <ContractInfoItem
                        icon="wallet"
                        label={t('tables.common.depositAmount')}
                        value={formatNumber(selectedContract.depositAmount)}
                      />
                      <ContractInfoItem
                        icon="fileText"
                        label={t('contracts.status')}
                        value={(
                          <span className={getContractStatusClass(selectedContract.contractStatus)}>
                            {formatEnumLabel(t, 'contractStatus', selectedContract.contractStatus)}
                          </span>
                        )}
                      />
                      <ContractInfoItem
                        icon="activity"
                        label={t('contracts.rentalStatus')}
                        value={formatEnumLabel(t, 'rentalStatus', selectedContract.rentalStatus)}
                      />
                    </div>
                  </section>

                  <section className="contract-detail-card contract-upload-card">
                    <div className="contract-upload-card-header">
                      <h3>{t('contracts.uploadPanelTitle', { defaultValue: 'Tải lên hợp đồng' })}</h3>
                    </div>

                    {hasSelectedContractFile && !showUploadForm ? (
                      <div className="contract-file-summary">
                        {uploadMessage && (
                          <div className="contract-upload-feedback success">
                            {uploadMessage}
                          </div>
                        )}
                        <LineIcon name="fileText" className="contract-file-summary-icon" />
                        <strong>{t('contracts.fileUploaded')}</strong>
                        <p>{t('contracts.changeHelp')}</p>
                        <div className="contract-file-actions">
                          <a
                            className="secondary-button inline-button contract-file-action"
                            href={resolveFileUrl(selectedContract.contractFileUrl)}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(event) => openFileUrl(selectedContract.contractFileUrl, event)}
                          >
                            {t('contracts.openFile')}
                          </a>
                          <button className="secondary-button inline-button contract-file-action" type="button" onClick={handleChangeContract}>
                            {t('contracts.change')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <ContractUploadForm
                          loading={uploading}
                          errorMessage={uploadError}
                          successMessage={uploadMessage}
                          onFileChange={() => {
                            setUploadError('');
                            setUploadMessage('');
                          }}
                          loadingLabel={hasSelectedContractFile ? t('contracts.changing') : t('contracts.upload.uploading')}
                          submitLabel={hasSelectedContractFile ? t('contracts.saveNew') : t('contracts.upload.submit')}
                          onSubmit={handleUpload}
                        />
                        {hasSelectedContractFile && (
                          <button
                            className="secondary-button inline-button contract-file-action contract-upload-cancel"
                            type="button"
                            disabled={uploading}
                            onClick={() => setShowUploadForm(false)}
                          >
                            {t('contracts.cancelChange')}
                          </button>
                        )}
                      </>
                    )}
                  </section>
                </div>

                <ContractFileHistoryList files={selectedContract.previousContractFiles} />
              </div>
            )}
          </ActionDialog>
        </section>
      )}
    </div>
  );
}
