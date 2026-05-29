import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatRoomLabel } from '../utils/roomDisplay.js';

function getLocalDateInputValue(date = new Date()) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
}

function getDefaultDueDate(month) {
  if (!month) {
    return '';
  }

  const [year, monthNumber] = month.split('-').map(Number);
  const dueDate = new Date(year, monthNumber, 5);
  return getLocalDateInputValue(dueDate);
}

function createInitialForm() {
  const creationDate = getLocalDateInputValue();
  const month = creationDate.slice(0, 7);

  return {
    roomId: '',
    creationDate,
    month,
    dueDate: getDefaultDueDate(month)
  };
}

export default function InvoiceGenerateForm({ rooms, loading, onSubmit }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(createInitialForm);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => {
      if (name === 'creationDate') {
        const month = value ? value.slice(0, 7) : '';

        return {
          ...current,
          creationDate: value,
          month,
          dueDate: getDefaultDueDate(month)
        };
      }

      if (name === 'month') {
        return {
          ...current,
          month: value,
          dueDate: getDefaultDueDate(value)
        };
      }

      return {
        ...current,
        [name]: value
      };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      await onSubmit({
        roomId: form.roomId,
        month: form.month,
        dueDate: form.dueDate
      });
      setForm(createInitialForm());
    } catch {
      // The parent page owns the visible API error message.
    }
  };

  return (
    <form className="panel-form" onSubmit={handleSubmit}>
      <label htmlFor="roomId">{t('tables.common.room')}</label>
      <select id="roomId" name="roomId" value={form.roomId} onChange={handleChange} required>
        <option value="">{t('forms.utilityReading.selectRoom')}</option>
        {rooms.map((room) => (
          <option key={room.id} value={room.id}>
            {formatRoomLabel(room)}
          </option>
        ))}
      </select>

      <label htmlFor="creationDate">{t('forms.invoice.creationDate')}</label>
      <input
        id="creationDate"
        name="creationDate"
        type="date"
        value={form.creationDate}
        onChange={handleChange}
        required
      />

      <label htmlFor="month">{t('forms.invoice.invoiceMonth')}</label>
      <input id="month" name="month" type="month" value={form.month} onChange={handleChange} required />

      <label htmlFor="dueDate">{t('tables.common.dueDate')}</label>
      <input id="dueDate" name="dueDate" type="date" value={form.dueDate} onChange={handleChange} required />

      <button type="submit" disabled={loading}>
        {loading ? t('forms.invoice.generating') : t('forms.invoice.generate')}
      </button>
    </form>
  );
}
