import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as contractApi from '../../features/contracts/api.js';
import ContractFileHistoryList from '../../components/ContractFileHistoryList.jsx';
import ManagementPageHero from '../../components/common/ManagementPageHero.jsx';
import { getContractStatusClass } from '../../utils/contractStatusOptions.js';
import { formatDisplayDate } from '../../utils/dateFormat.js';
import { resolveFileUrl } from '../../utils/fileUrl.js';
import { formatRoomLabel } from '../../utils/roomDisplay.js';
import { formatEnumLabel } from '../../utils/i18nFormat.js';

function formatNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue)
    ? numberValue.toLocaleString('en-US', { maximumFractionDigits: 2 })
    : value;
}

export default function ResidentContractPage() {
  const { t } = useTranslation();
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
      setError(apiError.response?.data?.message || t('contracts.currentLoadError'));
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
      setMessage(t('contracts.confirmed'));
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('contracts.confirmError'));
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
      setMessage(t('contracts.issueReported'));
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('contracts.issueError'));
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="empty-state">{t('contracts.loadingCurrent')}</div>;
  }

  return (
    <section className="content-section">
      <ManagementPageHero
        description={t('contracts.residentDescription')}
        title={t('contracts.title')}
      />

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      {contract ? (
        <>
          <div className="detail-panel">
            <div>
              <span>{t('tables.common.room')}</span>
              <strong>{formatRoomLabel(contract)}</strong>
            </div>
            <div>
              <span>{t('tables.common.building')}</span>
              <strong>
                {contract.buildingCode} - {contract.buildingName}
              </strong>
            </div>
            <div>
              <span>{t('contracts.period')}</span>
              <strong>
                {formatDisplayDate(contract.startDate)} {t('common.to')} {formatDisplayDate(contract.endDate)}
              </strong>
            </div>
            <div>
              <span>{t('tables.common.depositAmount')}</span>
              <strong>{formatNumber(contract.depositAmount)}</strong>
            </div>
            <div>
              <span>{t('contracts.status')}</span>
              <strong>
                <span className={getContractStatusClass(contract.contractStatus)}>
                  {formatEnumLabel(t, 'contractStatus', contract.contractStatus)}
                </span>
              </strong>
            </div>
            <div>
              <span>{t('contracts.rentalStatus')}</span>
              <strong>{formatEnumLabel(t, 'rentalStatus', contract.rentalStatus)}</strong>
            </div>
          </div>

          <div className="button-row contract-actions">
            {contract.contractFileUrl ? (
              <a className="button-link" href={resolveFileUrl(contract.contractFileUrl)} target="_blank" rel="noreferrer">
                {t('contracts.open')}
              </a>
            ) : (
              <button type="button" disabled>
                {t('contracts.noFile')}
              </button>
            )}
            <button type="button" disabled={processing || !contract.contractFileUrl} onClick={handleConfirm}>
              {t('contracts.confirmViewed')}
            </button>
            <button
              className="secondary-button inline-button"
              type="button"
              disabled={processing}
              onClick={handleReportIssue}
            >
              {t('contracts.reportIssue')}
            </button>
          </div>

          <ContractFileHistoryList files={contract.previousContractFiles} />
        </>
      ) : (
        <div className="empty-state">{t('contracts.noCurrent')}</div>
      )}
    </section>
  );
}
