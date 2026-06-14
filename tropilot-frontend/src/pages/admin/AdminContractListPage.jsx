import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import * as contractApi from '../../features/contracts/api.js';
import PageHeader from '../../components/PageHeader.jsx';
import { getContractStatusClass } from '../../utils/contractStatusOptions.js';
import { formatDisplayDate } from '../../utils/dateFormat.js';
import { formatEnumLabel } from '../../utils/i18nFormat.js';
import { formatRoomCode } from '../../utils/roomDisplay.js';

function formatNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue)
    ? numberValue.toLocaleString('en-US', { maximumFractionDigits: 2 })
    : value;
}

export default function AdminContractListPage() {
  const { t } = useTranslation();
  const [contracts, setContracts] = useState([]);
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
                    <Link className="secondary-link compact-link" to={`/admin/contracts/${contract.id}`}>
                      {t('common.view')}
                    </Link>
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
    </section>
  );
}
