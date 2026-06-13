import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDateInputValue } from '../utils/dateFormat.js';
import { formatRoomLabel } from '../utils/roomDisplay.js';

function getDefaultDueDate(month) {
  if (!month) {
    return '';
  }

  const [year, monthNumber] = month.split('-').map(Number);
  const dueDate = new Date(year, monthNumber, 5);
  return formatDateInputValue(dueDate);
}

function createInitialForm() {
  const creationDate = formatDateInputValue();

  return {
    roomId: '',
    creationDate,
    dueDate: getDefaultDueDate(creationDate.slice(0, 7))
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
          dueDate: getDefaultDueDate(month)
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
        month: form.creationDate.slice(0, 7),
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
        lang="en-GB"
        value={form.creationDate}
        onChange={handleChange}
        required
      />

      <label htmlFor="dueDate">{t('tables.common.dueDate')}</label>
      <input
        id="dueDate"
        name="dueDate"
        type="date"
        lang="en-GB"
        value={form.dueDate}
        onChange={handleChange}
        required
      />

      <button type="submit" disabled={loading}>
        {loading ? t('forms.invoice.generating') : t('forms.invoice.generate')}
      </button>
    </form>
  );
}
