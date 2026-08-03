import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';
import * as serviceFeeApi from '../../api/serviceFeeApi.js';
import ActionDialog from '../../components/common/ActionDialog.jsx';
import FilterBar from '../../components/common/FilterBar.jsx';
import LineIcon from '../../components/common/LineIcon.jsx';
import ServiceFeeTable from '../../components/ServiceFeeTable.jsx';
import { isServiceFeeActive } from '../../utils/serviceFeeOptions.js';
import { normalizeSearchText } from '../../utils/searchText.js';

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

const utilityCalculationTypes = ['BY_USAGE', 'BY_PERSON', 'FIXED'];
const additionalCalculationTypes = ['FIXED', 'BY_USAGE', 'BY_PERSON', 'BY_QUANTITY'];

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

const emptyFilters = {
  search: '',
  status: ''
};

function getServiceFeeRowStatus(serviceFeeRow) {
  if (!serviceFeeRow.serviceFee) {
    return 'NOT_CONFIGURED';
  }

  return isServiceFeeActive(serviceFeeRow.serviceFee) ? 'ACTIVE' : 'INACTIVE';
}

function serviceFeeRowMatchesSearch(serviceFeeRow, searchValue, t) {
  if (!searchValue) {
    return true;
  }

  const status = getServiceFeeRowStatus(serviceFeeRow);
  const searchableValues = [
    serviceFeeRow.name,
    serviceFeeRow.serviceFee?.name,
    serviceFeeRow.serviceFee?.feeType,
    serviceFeeRow.serviceFee?.calculationType,
    serviceFeeRow.calculationType,
    serviceFeeRow.unitPrice,
    status === 'NOT_CONFIGURED'
      ? t('buildingServiceFees.notConfigured')
      : status === 'ACTIVE'
        ? t('common.active')
        : t('common.inactive')
  ];

  return searchableValues.some((value) => normalizeSearchText(value).includes(searchValue));
}

function findPreferredFeeByType(serviceFees, feeType) {
  const matchingFees = serviceFees.filter((serviceFee) => serviceFee.feeType === feeType);
  return matchingFees.find(isServiceFeeActive) || matchingFees[0] || null;
}

/** Trang quản lý các loại phí dịch vụ áp dụng cho một tòa nhà. */
export default function AdminBuildingServiceFeePage() {
  const { t } = useTranslation();
  const { building } = useOutletContext();
  const [serviceFees, setServiceFees] = useState([]);
  const [utilityForm, setUtilityForm] = useState(emptyUtilityForm);
  const [additionalForm, setAdditionalForm] = useState(emptyAdditionalForm);
  const [editingUtilityKey, setEditingUtilityKey] = useState(null);
  const [editingAdditionalFee, setEditingAdditionalFee] = useState(null);
  const [serviceFormOpen, setServiceFormOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingServiceFees, setSavingServiceFees] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [filters, setFilters] = useState(emptyFilters);

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

  const editingUtilityConfig = useMemo(
    () => utilityFeeConfigs.find((config) => config.key === editingUtilityKey) || null,
    [editingUtilityKey]
  );

  const serviceFeeRows = useMemo(() => {
    const utilityRows = utilityFeeConfigs.map((config) => {
      const serviceFee = utilityFees[config.key];
      return {
        key: `utility-${config.key}`,
        isUtility: true,
        config,
        serviceFee,
        name: t(`buildingServiceFees.utility.${config.key}Title`),
        unitPrice: serviceFee?.unitPrice ?? '',
        calculationType: utilityCalculationTypes.includes(serviceFee?.calculationType)
          ? serviceFee.calculationType
          : 'BY_USAGE'
      };
    });

    const otherRows = additionalFees.map((serviceFee) => ({
      key: `other-${serviceFee.id}`,
      isUtility: false,
      serviceFee,
      name: serviceFee.name,
      unitPrice: serviceFee.unitPrice ?? '',
      calculationType: serviceFee.calculationType
    }));

    return [...utilityRows, ...otherRows];
  }, [additionalFees, t, utilityFees]);
  const filteredServiceFeeRows = useMemo(() => {
    const searchValue = normalizeSearchText(filters.search);

    return serviceFeeRows.filter((serviceFeeRow) => (
      serviceFeeRowMatchesSearch(serviceFeeRow, searchValue, t)
      && (!filters.status || getServiceFeeRowStatus(serviceFeeRow) === filters.status)
    ));
  }, [filters, serviceFeeRows, t]);

  const formCalculationTypes = editingUtilityConfig ? utilityCalculationTypes : additionalCalculationTypes;

  const hasServiceDraft = Boolean(
    editingUtilityConfig ||
    editingAdditionalFee ||
      additionalForm.name.trim() ||
      String(additionalForm.unitPrice ?? '').trim()
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
    setEditingUtilityKey(null);
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

  const saveUtilityFee = async (config, values = utilityForm[config.key]) => {
    const existingFee = utilityFees[config.key];
    const payload = {
      name: config.name,
      feeType: config.feeType,
      unitPrice: Number(values.unitPrice),
      calculationType: values.calculationType,
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

  const handleAdditionalChange = (event) => {
    const { name, value } = event.target;

    const nextValue = name === 'unitPrice' ? value.replace(/\D/g, '') : value;

    setAdditionalForm((current) => {
      const nextForm = {
        ...current,
        [name]: nextValue
      };

      if (name === 'name' && nextValue.trim().toLocaleLowerCase('vi-VN') === 'gửi xe') {
        nextForm.calculationType = 'BY_QUANTITY';
      }

      return nextForm;
    });
  };

  const saveAdditionalFee = async () => {
    const trimmedName = additionalForm.name.trim();
    const payload = {
      name: trimmedName,
      feeType: 'OTHER',
      unitPrice: Number(additionalForm.unitPrice),
      calculationType: additionalForm.calculationType,
      vehicleType: null
    };

    if (editingAdditionalFee) {
      await serviceFeeApi.updateAdminBuildingServiceFee(building.id, editingAdditionalFee.id, payload);
      return;
    }

    await serviceFeeApi.createAdminBuildingServiceFee(building.id, payload);
  };

  const handleSaveServiceFees = async (event) => {
    event.preventDefault();
    if (!hasServiceDraft) {
      return;
    }

    setSavingServiceFees(true);
    setMessage('');
    setError('');

    try {
      if (editingUtilityConfig) {
        await saveUtilityFee(editingUtilityConfig, additionalForm);
      } else {
        await saveAdditionalFee();
      }

      setEditingUtilityKey(null);
      setEditingAdditionalFee(null);
      setAdditionalForm(emptyAdditionalForm);
      setServiceFormOpen(false);
      setMessage(t('buildingServiceFees.saved'));
      await loadServiceFees();
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('buildingServiceFees.saveError'));
    } finally {
      setSavingServiceFees(false);
    }
  };

  const handleEditUtility = (config) => {
    const feeForm = utilityForm[config.key] || emptyUtilityForm[config.key];
    setEditingAdditionalFee(null);
    setEditingUtilityKey(config.key);
    setServiceFormOpen(true);
    setAdditionalForm({
      name: t(`buildingServiceFees.utility.${config.key}Title`),
      unitPrice: feeForm.unitPrice ?? '',
      calculationType: utilityCalculationTypes.includes(feeForm.calculationType)
        ? feeForm.calculationType
        : 'BY_USAGE'
    });
  };

  const handleEditAdditional = (serviceFee) => {
    setEditingUtilityKey(null);
    setEditingAdditionalFee(serviceFee);
    setServiceFormOpen(true);
    setAdditionalForm({
      name: serviceFee.name,
      unitPrice: serviceFee.unitPrice ?? '',
      calculationType: additionalCalculationTypes.includes(serviceFee.calculationType)
        ? serviceFee.calculationType
        : 'FIXED'
    });
  };

  const handleCancelServiceEdit = () => {
    setEditingUtilityKey(null);
    setEditingAdditionalFee(null);
    setAdditionalForm(emptyAdditionalForm);
    setServiceFormOpen(false);
  };

  const handleOpenAdditionalForm = () => {
    setEditingUtilityKey(null);
    setEditingAdditionalFee(null);
    setAdditionalForm(emptyAdditionalForm);
    setServiceFormOpen(true);
  };

  const handleClearFilters = () => {
    setFilters(emptyFilters);
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
        handleCancelServiceEdit();
      }
      await loadServiceFees();
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('buildingServiceFees.deleteError'));
    } finally {
      setProcessingId(null);
    }
  };

  const renderServiceFeeActions = (serviceFeeRow) => {
    const active = serviceFeeRow.serviceFee ? isServiceFeeActive(serviceFeeRow.serviceFee) : false;
    const isProcessing = processingId === serviceFeeRow.serviceFee?.id;

    return (
      <>
        <button
          className="icon-action-button"
          type="button"
          aria-label={t('common.edit')}
          title={t('common.edit')}
          disabled={isProcessing}
          onClick={() =>
            serviceFeeRow.isUtility
              ? handleEditUtility(serviceFeeRow.config)
              : handleEditAdditional(serviceFeeRow.serviceFee)
          }
        >
          <LineIcon name="edit" />
        </button>
        {!serviceFeeRow.isUtility && (
          <>
            <button
              className="icon-action-button"
              type="button"
              aria-label={active ? t('common.deactivate') : t('common.activate')}
              title={active ? t('common.deactivate') : t('common.activate')}
              disabled={isProcessing}
              onClick={() => handleToggle(serviceFeeRow.serviceFee)}
            >
              <LineIcon name={active ? 'close' : 'checkShield'} />
            </button>
            <button
              className="icon-action-button icon-action-danger"
              type="button"
              aria-label={t('common.delete')}
              title={t('common.delete')}
              disabled={isProcessing}
              onClick={() => handleDelete(serviceFeeRow.serviceFee)}
            >
              <LineIcon name="trash" />
            </button>
          </>
        )}
      </>
    );
  };

  return (
    <div className="building-workspace">
      <div className="building-section-header">
        <span className="page-eyebrow">{t('buildingServiceFees.eyebrow')}</span>
        {!loading && (
          <button className="button-link" type="button" onClick={handleOpenAdditionalForm}>
            {t('buildingServiceFees.create')}
          </button>
        )}
      </div>

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">{t('buildingServiceFees.loading')}</div>
      ) : (
        <section className="building-service-fee-page">
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
                  { value: 'ACTIVE', label: t('common.active') },
                  { value: 'INACTIVE', label: t('common.inactive') },
                  { value: 'NOT_CONFIGURED', label: t('buildingServiceFees.notConfigured') }
                ]
              }
            ]}
            clearLabel={t('common.clear')}
            onClear={handleClearFilters}
            onSearchChange={(value) => setFilters((current) => ({ ...current, search: value }))}
          />
          <div className="settings-card additional-service-card">
            <div className="additional-service-layout additional-service-list-only">
              <ServiceFeeTable
                className="building-service-fee-list"
                variant="table"
                serviceFees={filteredServiceFeeRows}
                showFeeType={false}
                nameLabel={t('buildingServiceFees.additional.name')}
                priceLabel={t('buildingServiceFees.priceColumn')}
                methodLabel={t('buildingServiceFees.calculationMethod')}
                emptyMessage={t('buildingServiceFees.additional.empty')}
                getKey={(serviceFeeRow) => serviceFeeRow.key}
                getDescription={(serviceFeeRow) => (
                  serviceFeeRow.isUtility ? t('buildingServiceFees.utility.fixedRow') : ''
                )}
                getActive={(serviceFeeRow) => (
                  serviceFeeRow.serviceFee ? isServiceFeeActive(serviceFeeRow.serviceFee) : false
                )}
                getStatusLabel={(serviceFeeRow) => {
                  if (!serviceFeeRow.serviceFee) {
                    return t('buildingServiceFees.notConfigured');
                  }

                  return isServiceFeeActive(serviceFeeRow.serviceFee) ? t('common.active') : t('common.inactive');
                }}
                renderActions={renderServiceFeeActions}
              />
            </div>
          </div>
        </section>
      )}

      <ActionDialog
        className="action-dialog service-fee-editor-dialog"
        eyebrow={t('buildingServiceFees.eyebrow')}
        labelledBy="service-fee-dialog-title"
        open={serviceFormOpen}
        title={editingUtilityConfig || editingAdditionalFee ? t('common.edit') : t('buildingServiceFees.create')}
        onClose={handleCancelServiceEdit}
      >
        <form className="panel-form additional-service-form" onSubmit={handleSaveServiceFees}>
          <div className="additional-service-field">
            <label htmlFor="additionalServiceName">{t('buildingServiceFees.additional.name')}</label>
            <input
              id="additionalServiceName"
              name="name"
              value={additionalForm.name}
              onChange={handleAdditionalChange}
              maxLength={120}
              disabled={Boolean(editingUtilityConfig)}
              required={!editingUtilityConfig && hasServiceDraft}
            />
          </div>

          <div className="additional-service-field">
            <label htmlFor="additionalServiceUnitPrice">
              {t('buildingServiceFees.additional.unitPrice')} <span className="field-unit-note">(đ)</span>
            </label>
            <div className="unit-input money-input">
              <input
                className="unit-input-control"
                id="additionalServiceUnitPrice"
                name="unitPrice"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                value={additionalForm.unitPrice}
                onChange={handleAdditionalChange}
                placeholder="0"
                autoComplete="off"
                required={hasServiceDraft}
              />
              <span className="unit-input-suffix">đ</span>
            </div>
          </div>

          <div className="additional-service-field">
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
              {formCalculationTypes.map((calculationType) => (
                <option key={calculationType} value={calculationType}>
                  {t(`buildingServiceFees.methods.${calculationType}`)}
                </option>
              ))}
            </select>
          </div>

          <div className="additional-service-actions">
            {(editingUtilityConfig || editingAdditionalFee) && (
              <button
                className="secondary-button"
                type="button"
                disabled={savingServiceFees}
                onClick={handleCancelServiceEdit}
              >
                {t('buildingServiceFees.cancelEdit')}
              </button>
            )}
            <button type="submit" disabled={savingServiceFees || !hasServiceDraft}>
              {savingServiceFees ? t('common.saving') : t('buildingServiceFees.save')}
            </button>
          </div>
        </form>
      </ActionDialog>
    </div>
  );
}
