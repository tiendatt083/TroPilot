import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const emptyForm = {
  residentHeadId: '',
  startDate: '',
  endDate: '',
  depositAmount: '0'
};

export default function HeadResidentAssignmentForm({ residentHeads, loading, onSubmit }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(emptyForm);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      residentHeadId: Number(form.residentHeadId),
      startDate: form.startDate,
      endDate: form.endDate,
      depositAmount: Number(form.depositAmount)
    });
  };

  const hasResidentHeads = residentHeads.length > 0;

  return (
    <form className="panel-form assignment-form" onSubmit={handleSubmit}>
      <label htmlFor="residentHeadId">{t('tables.common.headResident')}</label>
      <select
        id="residentHeadId"
        name="residentHeadId"
        value={form.residentHeadId}
        onChange={handleChange}
        required
        disabled={!hasResidentHeads}
      >
        <option value="">
          {hasResidentHeads ? t('forms.assignment.selectHeadResident') : t('forms.assignment.noHeadResidents')}
        </option>
        {residentHeads.map((residentHead) => (
          <option key={residentHead.id} value={residentHead.id}>
            {residentHead.fullName} - {residentHead.email}
          </option>
        ))}
      </select>

      <div className="form-grid">
        <div>
          <label htmlFor="startDate">{t('forms.assignment.startDate')}</label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            value={form.startDate}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label htmlFor="endDate">{t('forms.assignment.endDate')}</label>
          <input
            id="endDate"
            name="endDate"
            type="date"
            value={form.endDate}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <label htmlFor="depositAmount">{t('tables.common.depositAmount')}</label>
      <input
        id="depositAmount"
        name="depositAmount"
        type="number"
        min="0"
        step="0.01"
        value={form.depositAmount}
        onChange={handleChange}
        required
      />

      <button type="submit" disabled={loading || !hasResidentHeads}>
        {loading ? t('forms.assignment.assigning') : t('forms.assignment.submit')}
      </button>
    </form>
  );
}
