import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as contractApi from '../../features/contracts/api.js';
import ActionDialog from '../../components/common/ActionDialog.jsx';
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

export default function AdminContractListPage() {
  const { t } = useTranslation();
  const [contracts, setContracts] = useState([]);
  const [selectedContract, setSelectedContract] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    contractApi
      .getAdminContracts()
      .then((response) => {
        if (active) {
          setContracts(response.data || []);
        }
      })
      .catch((apiError) => {
        if (active) {
          setError(apiError.response?.data?.message || t('contracts.listLoadError'));
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="content-section">
      <PageHeader eyebrow={t('contracts.adminEyebrow')} title={t('contracts.listTitle')} />

      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">{t('contracts.listLoading')}</div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
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
                  <td>{formatRoomCode(contract)}</td>
                  <td>{contract.residentHeadName}</td>
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
                      onClick={() => setSelectedContract(contract)}
                    >
                      {t('common.view')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {contracts.length === 0 && (
            <div className="empty-state flat-empty-state">{t('contracts.listEmpty')}</div>
          )}
        </div>
      )}

      <ActionDialog
        className="action-dialog-wide"
        eyebrow={selectedContract ? formatRoomCode(selectedContract) : t('contracts.adminEyebrow')}
        labelledBy="contract-detail-dialog-title"
        open={Boolean(selectedContract)}
        title={t('contracts.title')}
        onClose={() => setSelectedContract(null)}
      >
        {selectedContract && (
          <>
            <div className="detail-panel">
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
                <span>{t('contracts.period')}</span>
                <strong>
                  {formatDisplayDate(selectedContract.startDate)} {t('common.to')}{' '}
                  {formatDisplayDate(selectedContract.endDate)}
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
            </div>
            {selectedContract.contractFileUrl && (
              <div className="admin-profile-actions">
                <a className="button-link" href={resolveFileUrl(selectedContract.contractFileUrl)} target="_blank" rel="noreferrer">
                  {t('contracts.openFile')}
                </a>
              </div>
            )}
          </>
        )}
      </ActionDialog>
    </section>
  );
}
