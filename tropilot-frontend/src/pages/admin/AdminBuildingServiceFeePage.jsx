import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';
import * as serviceFeeApi from '../../features/invoices/serviceFeeApi.js';
import PageHeader from '../../components/PageHeader.jsx';
import { formatEnumLabel } from '../../utils/i18nFormat.js';
import { isServiceFeeActive } from '../../utils/serviceFeeOptions.js';

const utilityFeeConfigs = [
  {
    key: 'electricity',
    feeType: 'ELECTRICITY',
    name: 'Electricity'
  },
  {
    key: 'water',
    feeType: 'WATER',
    name: 'Water'
  }
];

const utilityCalculationTypes = ['BY_USAGE', 'BY_PERSON'];
const additionalCalculationTypes = ['FIXED', 'BY_PERSON'];

const emptyUtilityForm = {
  electricity: {
    unitPrice: '',
    calculationType: 'BY_USAGE'
  },
  water: {
    unitPrice: '',
    calculationType: 'BY_USAGE'
  }
};

const emptyAdditionalForm = {
  name: '',
  unitPrice: '',
  calculationType: 'FIXED'
};

function formatMoney(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue)
    ? numberValue.toLocaleString('en-US', { maximumFractionDigits: 2 })
    : value;
}

function findPreferredFeeByType(serviceFees, feeType) {
  const matchingFees = serviceFees.filter((serviceFee) => serviceFee.feeType === feeType);
  return matchingFees.find(isServiceFeeActive) || matchingFees[0] || null;
}

export default function AdminBuildingServiceFeePage() {
  const { t } = useTranslation();
  const { building } = useOutletContext();
  const [serviceFees, setServiceFees] = useState([]);
  const [utilityForm, setUtilityForm] = useState(emptyUtilityForm);
  const [additionalForm, setAdditionalForm] = useState(emptyAdditionalForm);
  const [editingAdditionalFee, setEditingAdditionalFee] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingUtilityFees, setSavingUtilityFees] = useState(false);
  const [savingAdditionalFee, setSavingAdditionalFee] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  const utilityFees = useMemo(
    () => ({
      electricity: findPreferredFeeByType(serviceFees, 'ELECTRICITY'),
      water: findPreferredFeeByType(serviceFees, 'WATER')
    }),
    [serviceFees]
  );

  const additionalFees = useMemo(
    () => serviceFees.filter((serviceFee) => serviceFee.feeType === 'OTHER'),
    [serviceFees]
  );

  const loadServiceFees = async () => {
    setError('');

    try {
      const response = await serviceFeeApi.getAdminBuildingServiceFees(building.id);
      setServiceFees(response.data || []);
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('buildingServiceFees.loadError'));
    }
  };

  useEffect(() => {
    setLoading(true);
    setEditingAdditionalFee(null);
    setAdditionalForm(emptyAdditionalForm);
    loadServiceFees().finally(() => setLoading(false));
  }, [building.id, t]);

  useEffect(() => {
    setUtilityForm({
      electricity: {
        unitPrice: utilityFees.electricity?.unitPrice ?? '',
        calculationType: utilityCalculationTypes.includes(utilityFees.electricity?.calculationType)
          ? utilityFees.electricity.calculationType
          : 'BY_USAGE'
      },
      water: {
        unitPrice: utilityFees.water?.unitPrice ?? '',
        calculationType: utilityCalculationTypes.includes(utilityFees.water?.calculationType)
          ? utilityFees.water.calculationType
          : 'BY_USAGE'
      }
    });
  }, [utilityFees.electricity, utilityFees.water]);

  const handleUtilityChange = (feeKey, field, value) => {
    setUtilityForm((current) => ({
      ...current,
      [feeKey]: {
        ...current[feeKey],
        [field]: value
      }
    }));
  };

  const saveUtilityFee = async (config) => {
    const existingFee = utilityFees[config.key];
    const payload = {
      name: config.name,
      feeType: config.feeType,
      unitPrice: Number(utilityForm[config.key].unitPrice),
      calculationType: utilityForm[config.key].calculationType,
      vehicleType: null
    };

    if (existingFee) {
      const response = await serviceFeeApi.updateAdminBuildingServiceFee(building.id, existingFee.id, payload);
      if (!isServiceFeeActive(existingFee)) {
        await serviceFeeApi.toggleAdminBuildingServiceFee(building.id, existingFee.id);
      }
      return response;
    }

    return serviceFeeApi.createAdminBuildingServiceFee(building.id, payload);
  };

  const handleSaveUtilityFees = async (event) => {
    event.preventDefault();
    setSavingUtilityFees(true);
    setMessage('');
    setError('');

    try {
      for (const config of utilityFeeConfigs) {
        await saveUtilityFee(config);
      }

      setMessage(t('buildingServiceFees.utilitySaved'));
      await loadServiceFees();
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('buildingServiceFees.utilitySaveError'));
    } finally {
      setSavingUtilityFees(false);
    }
  };

  const handleAdditionalChange = (event) => {
    const { name, value } = event.target;
    setAdditionalForm((current) => ({
      ...current,
      [name]: value
    }));
  };

  const handleAdditionalSubmit = async (event) => {
    event.preventDefault();
    setSavingAdditionalFee(true);
    setMessage('');
    setError('');

    const trimmedName = additionalForm.name.trim();
    const payload = {
      name: trimmedName,
      feeType: 'OTHER',
      unitPrice: Number(additionalForm.unitPrice),
      calculationType: additionalForm.calculationType,
      vehicleType: null
    };

    try {
      if (editingAdditionalFee) {
        await serviceFeeApi.updateAdminBuildingServiceFee(building.id, editingAdditionalFee.id, payload);
        setMessage(t('buildingServiceFees.updated'));
      } else {
        await serviceFeeApi.createAdminBuildingServiceFee(building.id, payload);
        setMessage(t('buildingServiceFees.created'));
      }

      setEditingAdditionalFee(null);
      setAdditionalForm(emptyAdditionalForm);
      await loadServiceFees();
    } catch (apiError) {
      setError(
        apiError.response?.data?.message ||
          (editingAdditionalFee ? t('buildingServiceFees.updateError') : t('buildingServiceFees.createError'))
      );
    } finally {
      setSavingAdditionalFee(false);
    }
  };

  const handleEditAdditional = (serviceFee) => {
    setEditingAdditionalFee(serviceFee);
    setAdditionalForm({
      name: serviceFee.name,
      unitPrice: serviceFee.unitPrice ?? '',
      calculationType: additionalCalculationTypes.includes(serviceFee.calculationType)
        ? serviceFee.calculationType
        : 'FIXED'
    });
  };

  const handleCancelAdditionalEdit = () => {
    setEditingAdditionalFee(null);
    setAdditionalForm(emptyAdditionalForm);
  };

  const handleToggle = async (serviceFee) => {
    setProcessingId(serviceFee.id);
    setMessage('');
    setError('');

    try {
      await serviceFeeApi.toggleAdminBuildingServiceFee(building.id, serviceFee.id);
      setMessage(t('buildingServiceFees.statusUpdated'));
      await loadServiceFees();
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('buildingServiceFees.statusUpdateError'));
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (serviceFee) => {
    const confirmed = window.confirm(t('buildingServiceFees.deleteConfirm', { name: serviceFee.name }));
    if (!confirmed) {
      return;
    }

    setProcessingId(serviceFee.id);
    setMessage('');
    setError('');

    try {
      const response = await serviceFeeApi.deleteAdminBuildingServiceFee(building.id, serviceFee.id);
      setMessage(response.message || t('buildingServiceFees.deleted'));
      if (editingAdditionalFee?.id === serviceFee.id) {
        handleCancelAdditionalEdit();
      }
      await loadServiceFees();
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('buildingServiceFees.deleteError'));
    } finally {
      setProcessingId(null);
    }
  };

  const renderCalculationOptions = (feeKey, selectedValue, onChange) => (
    <div className="service-fee-radio-group">
      {utilityCalculationTypes.map((calculationType) => (
        <label className="radio-option" key={`${feeKey}-${calculationType}`}>
          <input
            type="radio"
            name={`${feeKey}CalculationType`}
            value={calculationType}
            checked={selectedValue === calculationType}
            onChange={(event) => onChange(event.target.value)}
          />
          <span>{t(`buildingServiceFees.methods.${calculationType}`)}</span>
        </label>
      ))}
    </div>
  );

  const renderUtilityCard = (config) => {
    const feeForm = utilityForm[config.key];

    return (
      <article className="billing-setting-card" key={config.key}>
        <div className="billing-setting-title-row">
          <span className="billing-setting-icon">{t(`buildingServiceFees.utility.${config.key}Icon`)}</span>
          <h2>{t(`buildingServiceFees.utility.${config.key}Title`)}</h2>
        </div>
        <label htmlFor={`${config.key}UnitPrice`}>{t(`buildingServiceFees.utility.${config.key}PriceLabel`)}</label>
        <input
          id={`${config.key}UnitPrice`}
          type="number"
          min="0"
          step="0.01"
          value={feeForm.unitPrice}
          onChange={(event) => handleUtilityChange(config.key, 'unitPrice', event.target.value)}
          required
        />
        <span className="field-help-text">{t(`buildingServiceFees.utility.${config.key}Help`)}</span>
        <h3>{t('buildingServiceFees.calculationMethod')}</h3>
        {renderCalculationOptions(config.key, feeForm.calculationType, (value) =>
          handleUtilityChange(config.key, 'calculationType', value)
        )}
      </article>
    );
  };

  return (
    <div className="building-workspace">
      <PageHeader eyebrow={t('buildingServiceFees.eyebrow')} title={t('buildingServiceFees.title')} />
      <p className="page-support-text">{t('buildingServiceFees.description')}</p>

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">{t('buildingServiceFees.loading')}</div>
      ) : (
        <section className="building-service-fee-page">
          <form className="settings-card building-fee-defaults-card" onSubmit={handleSaveUtilityFees}>
            <div className="settings-card-heading">
              <span>{t('buildingServiceFees.defaultsEyebrow')}</span>
              <h2>{t('buildingServiceFees.defaultsTitle')}</h2>
              <p>{t('buildingServiceFees.defaultsDescription')}</p>
            </div>
            <div className="service-fee-utility-grid">{utilityFeeConfigs.map(renderUtilityCard)}</div>
            <button type="submit" disabled={savingUtilityFees}>
              {savingUtilityFees ? t('common.saving') : t('buildingServiceFees.saveDefaultFees')}
            </button>
          </form>

          <section className="settings-card additional-service-card">
            <div className="settings-card-heading">
              <span>{t('buildingServiceFees.additionalEyebrow')}</span>
              <h2>{t('buildingServiceFees.additionalTitle')}</h2>
              <p>{t('buildingServiceFees.additionalDescription')}</p>
            </div>

            <div className="additional-service-layout">
              <form className="panel-form additional-service-form" onSubmit={handleAdditionalSubmit}>
                <label htmlFor="additionalServiceName">{t('buildingServiceFees.additional.name')}</label>
                <input
                  id="additionalServiceName"
                  name="name"
                  value={additionalForm.name}
                  onChange={handleAdditionalChange}
                  maxLength={120}
                  required
                />

                <label htmlFor="additionalServiceUnitPrice">{t('buildingServiceFees.additional.unitPrice')}</label>
                <input
                  id="additionalServiceUnitPrice"
                  name="unitPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={additionalForm.unitPrice}
                  onChange={handleAdditionalChange}
                  required
                />

                <label htmlFor="additionalServiceCalculationType">
                  {t('buildingServiceFees.calculationMethod')}
                </label>
                <select
                  id="additionalServiceCalculationType"
                  name="calculationType"
                  value={additionalForm.calculationType}
                  onChange={handleAdditionalChange}
                  required
                >
                  {additionalCalculationTypes.map((calculationType) => (
                    <option key={calculationType} value={calculationType}>
                      {t(`buildingServiceFees.methods.${calculationType}`)}
                    </option>
                  ))}
                </select>

                <button type="submit" disabled={savingAdditionalFee}>
                  {savingAdditionalFee
                    ? t('common.saving')
                    : editingAdditionalFee
                      ? t('buildingServiceFees.save')
                      : t('buildingServiceFees.addService')}
                </button>
                {editingAdditionalFee && (
                  <button
                    className="secondary-button"
                    type="button"
                    disabled={savingAdditionalFee}
                    onClick={handleCancelAdditionalEdit}
                  >
                    {t('buildingServiceFees.cancelEdit')}
                  </button>
                )}
              </form>

              <div className="table-wrap additional-service-table-wrap">
                <table className="data-table additional-service-table">
                  <thead>
                    <tr>
                      <th>{t('buildingServiceFees.additional.name')}</th>
                      <th>{t('buildingServiceFees.additional.unitPrice')}</th>
                      <th>{t('buildingServiceFees.calculationMethod')}</th>
                      <th>{t('tables.common.status')}</th>
                      <th>{t('tables.common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {additionalFees.map((serviceFee) => {
                      const active = isServiceFeeActive(serviceFee);

                      return (
                        <tr key={serviceFee.id}>
                          <td>{serviceFee.name}</td>
                          <td>{formatMoney(serviceFee.unitPrice)}</td>
                          <td>{formatEnumLabel(t, 'calculationType', serviceFee.calculationType)}</td>
                          <td>
                            <span className={`status-pill status-${active ? 'active' : 'inactive'}`}>
                              {active ? t('common.active') : t('common.inactive')}
                            </span>
                          </td>
                          <td>
                            <div className="table-actions">
                              <button
                                className="secondary-button compact-button"
                                type="button"
                                disabled={processingId === serviceFee.id}
                                onClick={() => handleEditAdditional(serviceFee)}
                              >
                                {t('common.edit')}
                              </button>
                              <button
                                className="secondary-button compact-button"
                                type="button"
                                disabled={processingId === serviceFee.id}
                                onClick={() => handleToggle(serviceFee)}
                              >
                                {active ? t('common.deactivate') : t('common.activate')}
                              </button>
                              <button
                                className="secondary-button compact-button"
                                type="button"
                                disabled={processingId === serviceFee.id}
                                onClick={() => handleDelete(serviceFee)}
                              >
                                {t('common.delete')}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {additionalFees.length === 0 && (
                  <div className="empty-state flat-empty-state">{t('buildingServiceFees.additional.empty')}</div>
                )}
              </div>
            </div>
          </section>
        </section>
      )}
    </div>
  );
}
