import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatRoomLabel } from '../utils/roomDisplay.js';

const emptyForm = {
  roomId: '',
  month: '',
  dueDate: ''
};

export default function InvoiceGenerateForm({ rooms, loading, onSubmit }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(emptyForm);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      await onSubmit({
        roomId: form.roomId,
        month: form.month,
        dueDate: form.dueDate
      });
      setForm(emptyForm);
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
