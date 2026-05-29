import { useState } from 'react';
import { useTranslation } from 'react-i18next';

function getTodayInputValue() {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
}

function addMonthsToDate(dateValue, monthCount) {
  if (!dateValue) {
    return '';
  }

  const [year, month, day] = dateValue.split('-').map(Number);
  const targetMonthIndex = month - 1 + monthCount;
  const lastTargetDay = new Date(year, targetMonthIndex + 1, 0).getDate();
  const targetDate = new Date(year, targetMonthIndex, Math.min(day, lastTargetDay));
  const targetYear = targetDate.getFullYear();
  const targetMonth = String(targetDate.getMonth() + 1).padStart(2, '0');
  const targetDay = String(targetDate.getDate()).padStart(2, '0');

  return `${targetYear}-${targetMonth}-${targetDay}`;
}

const today = getTodayInputValue();

const emptyForm = {
  residentHeadId: '',
  startDate: today,
  endDate: addMonthsToDate(today, 6)
};

export default function HeadResidentAssignmentForm({ residentHeads, loading, onSubmit }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(emptyForm);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === 'startDate' ? { endDate: addMonthsToDate(value, 6) } : {})
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      residentHeadId: Number(form.residentHeadId),
      startDate: form.startDate,
      endDate: form.endDate
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

      <button type="submit" disabled={loading || !hasResidentHeads}>
        {loading ? t('forms.assignment.assigning') : t('forms.assignment.submit')}
      </button>
    </form>
  );
}
