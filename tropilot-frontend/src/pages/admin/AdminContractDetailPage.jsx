import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import * as contractApi from '../../features/contracts/api.js';
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

export default function AdminContractDetailPage() {
  const { t } = useTranslation();
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
      setError(apiError.response?.data?.message || t('contracts.detailLoadError'));
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
      setMessage(isChangingContract ? t('contracts.changed') : t('contracts.uploaded'));
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

  if (loading) {
    return <div className="empty-state">{t('contracts.detailLoading')}</div>;
  }

  if (!contract) {
    return <div className="empty-state">{error || t('contracts.notFound')}</div>;
  }

  const hasContractFile = Boolean(contract.contractFileUrl);
  const shouldShowUploadForm = !hasContractFile || showUploadForm;

  return (
    <section className="content-section">
      <div className="page-title-row">
        <PageHeader eyebrow={formatRoomCode(contract)} title={t('contracts.title')} />
        <div className="button-row">
          <Link className="secondary-link" to="/admin/contracts">
            {t('contracts.back')}
          </Link>
          {hasContractFile && (
            <a className="button-link" href={resolveFileUrl(contract.contractFileUrl)} target="_blank" rel="noreferrer">
              {t('contracts.openFile')}
            </a>
          )}
          {hasContractFile && !showUploadForm && (
            <button className="secondary-button inline-button" type="button" onClick={handleChangeContract}>
              {t('contracts.change')}
            </button>
          )}
          {hasContractFile && showUploadForm && (
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

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

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
          <span>{t('tables.common.headResident')}</span>
          <strong>{contract.residentHeadName}</strong>
        </div>
        <div>
          <span>{t('profile.fields.email')}</span>
          <strong>{contract.residentHeadEmail}</strong>
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

      <section className="assignment-panel">
        <PageHeader
          eyebrow={hasContractFile ? t('contracts.uploadedFile') : t('contracts.uploadEyebrow')}
          title={hasContractFile ? t('contracts.currentFile') : t('contracts.upload.file')}
        />
        {hasContractFile && !showUploadForm && (
          <div className="contract-file-summary">
            <strong>{t('contracts.fileUploaded')}</strong>
            <p>{t('contracts.changeHelp')}</p>
          </div>
        )}
        {shouldShowUploadForm && (
          <ContractUploadForm
            loading={uploading}
            loadingLabel={hasContractFile ? t('contracts.changing') : t('contracts.upload.uploading')}
            submitLabel={hasContractFile ? t('contracts.saveNew') : t('contracts.upload.submit')}
            onSubmit={handleUpload}
          />
        )}
      </section>

      <ContractFileHistoryList files={contract.previousContractFiles} />
    </section>
  );
}
