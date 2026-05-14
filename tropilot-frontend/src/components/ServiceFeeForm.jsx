import { useEffect, useState } from 'react';
import {
  CALCULATION_TYPE_OPTIONS,
  FEE_TYPE_OPTIONS,
  SERVICE_FEE_VEHICLE_TYPE_OPTIONS
} from '../utils/serviceFeeOptions.js';

const emptyForm = {
  name: '',
  feeCode: '',
  feeType: 'ELECTRICITY',
  unitPrice: 0,
  calculationType: 'FIXED',
  vehicleType: ''
};

export default function ServiceFeeForm({ initialValues, loading, submitLabel, onSubmit }) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    setForm({
      ...emptyForm,
      ...initialValues,
      unitPrice: initialValues?.unitPrice ?? 0,
      vehicleType: initialValues?.vehicleType || ''
    });
  }, [initialValues]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => {
      const nextForm = {
        ...current,
        [name]: name === 'unitPrice' ? value : value
      };

      if (name === 'feeType' && value !== 'PARKING') {
        nextForm.vehicleType = '';
      }

      return nextForm;
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      name: form.name,
      feeCode: form.feeCode,
      feeType: form.feeType,
      unitPrice: form.unitPrice === '' ? null : Number(form.unitPrice),
      calculationType: form.calculationType,
      vehicleType: form.feeType === 'PARKING' && form.vehicleType ? form.vehicleType : null
    });
  };

  const isParkingFee = form.feeType === 'PARKING';
  const requiresVehicleType = isParkingFee && form.calculationType === 'BY_QUANTITY';

  return (
    <form className="panel-form" onSubmit={handleSubmit}>
      <label htmlFor="feeCode">Service fee code</label>
      <input
        id="feeCode"
        name="feeCode"
        value={form.feeCode}
        onChange={handleChange}
        maxLength={50}
        required
      />

      <label htmlFor="name">Service fee name</label>
      <input id="name" name="name" value={form.name} onChange={handleChange} maxLength={120} required />

      <div className="form-grid">
        <div>
          <label htmlFor="feeType">Fee type</label>
          <select id="feeType" name="feeType" value={form.feeType} onChange={handleChange} required>
            {FEE_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="calculationType">Calculation type</label>
          <select
            id="calculationType"
            name="calculationType"
            value={form.calculationType}
            onChange={handleChange}
            required
          >
            {CALCULATION_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label htmlFor="unitPrice">Unit price</label>
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

      {isParkingFee && (
        <>
          <label htmlFor="vehicleType">Vehicle type</label>
          <select
            id="vehicleType"
            name="vehicleType"
            value={form.vehicleType}
            onChange={handleChange}
            required={requiresVehicleType}
          >
            <option value="">{requiresVehicleType ? 'Select vehicle type' : 'No specific vehicle type'}</option>
            {SERVICE_FEE_VEHICLE_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </>
      )}

      <button type="submit" disabled={loading}>
        {loading ? 'Saving...' : submitLabel}
      </button>
    </form>
  );
}
