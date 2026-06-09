import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatEnumLabel } from '../utils/i18nFormat.js';
import {
  FEE_TYPE_OPTIONS,
  getCalculationTypeOptionsForFeeType,
  getDefaultCalculationTypeForFeeType
} from '../utils/serviceFeeOptions.js';

const emptyForm = {
  name: '',
  feeCode: '',
  feeType: 'ELECTRICITY',
  unitPrice: 0,
  calculationType: 'BY_USAGE'
};

function buildInternalFeeCode(name, feeType) {
  const normalizedName = String(name || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 24);
  const normalizedType = String(feeType || 'OTHER').toUpperCase().slice(0, 12);
  const uniqueSuffix = Date.now().toString().slice(-10);

  return `${normalizedType}_${normalizedName || 'SERVICE'}_${uniqueSuffix}`.slice(0, 50);
}

export default function ServiceFeeForm({ initialValues, loading, submitLabel, onSubmit }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    const feeType = initialValues?.feeType || emptyForm.feeType;
    const calculationOptions = getCalculationTypeOptionsForFeeType(feeType);
    const calculationType = calculationOptions.some((option) => option.value === initialValues?.calculationType)
      ? initialValues.calculationType
      : getDefaultCalculationTypeForFeeType(feeType);

    setForm({
      ...emptyForm,
      ...initialValues,
      feeType,
      unitPrice: initialValues?.unitPrice ?? 0,
      calculationType
    });
  }, [initialValues]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => {
      const nextForm = {
        ...current,
        [name]: name === 'unitPrice' ? value : value
      };

      if (name === 'feeType') {
        nextForm.calculationType = getDefaultCalculationTypeForFeeType(value);
      }

      return nextForm;
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      name: form.name,
      feeCode: form.feeCode || buildInternalFeeCode(form.name, form.feeType),
      feeType: form.feeType,
      unitPrice: form.unitPrice === '' ? null : Number(form.unitPrice),
      calculationType: form.calculationType,
      vehicleType: null
    });
  };

  const calculationTypeOptions = getCalculationTypeOptionsForFeeType(form.feeType);

  return (
    <form className="panel-form" onSubmit={handleSubmit}>
      <label htmlFor="name">{t('forms.serviceFee.serviceFeeName')}</label>
      <input id="name" name="name" value={form.name} onChange={handleChange} maxLength={120} required />

      <div className="form-grid">
        <div>
          <label htmlFor="feeType">{t('tables.common.feeType')}</label>
          <select id="feeType" name="feeType" value={form.feeType} onChange={handleChange} required>
            {FEE_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {formatEnumLabel(t, 'feeType', option.value)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="calculationType">{t('forms.serviceFee.calculationType')}</label>
          <select
            id="calculationType"
            name="calculationType"
            value={form.calculationType}
            onChange={handleChange}
            required
          >
            {calculationTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {formatEnumLabel(t, 'calculationType', option.value)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label htmlFor="unitPrice">{t('tables.common.unitPrice')}</label>
      <input
        id="unitPrice"
        name="unitPrice"
        type="number"
        min="0"
        step="0.01"
        value={form.unitPrice}
        onChange={handleChange}
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? t('common.saving') : submitLabel}
      </button>
    </form>
  );
}
