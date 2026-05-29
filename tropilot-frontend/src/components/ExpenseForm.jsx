import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EXPENSE_TYPE_OPTIONS } from '../utils/expenseOptions.js';
import { formatEnumLabel } from '../utils/i18nFormat.js';
import { formatRoomLabel } from '../utils/roomDisplay.js';

const emptyForm = {
  roomId: '',
  taskId: '',
  maintenanceRequestId: '',
  amount: '',
  content: '',
  expenseType: 'OPERATION',
  proofImage: null
};

export default function ExpenseForm({ initialValues, rooms, loading, onSubmit }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    setForm({
      ...emptyForm,
      ...initialValues,
      roomId: initialValues?.roomId || '',
      taskId: initialValues?.taskId || '',
      maintenanceRequestId: initialValues?.maintenanceRequestId || '',
      amount: initialValues?.amount || '',
      expenseType: initialValues?.expenseType || 'OPERATION',
      proofImage: null
    });
  }, [initialValues]);

  const handleChange = (event) => {
    const { name, value, files } = event.target;
    setForm((current) => ({
      ...current,
      [name]: files ? files[0] || null : value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      await onSubmit(form);
      setForm(emptyForm);
      event.target.reset();
    } catch {
      // The parent page owns the visible API error message.
    }
  };

  return (
    <form className="panel-form" onSubmit={handleSubmit}>
      <label htmlFor="roomId">{t('tables.common.room')}</label>
      <select id="roomId" name="roomId" value={form.roomId} onChange={handleChange}>
        <option value="">{t('forms.task.noRoomLinked')}</option>
        {rooms.map((room) => (
          <option key={room.id} value={room.id}>
            {formatRoomLabel(room)}
          </option>
        ))}
      </select>

      <div className="form-grid">
        <div>
          <label htmlFor="taskId">{t('forms.expense.taskReference')}</label>
          <input
            id="taskId"
            name="taskId"
            type="number"
            min="1"
            value={form.taskId}
            onChange={handleChange}
            placeholder={t('common.optional')}
          />
        </div>
        <div>
          <label htmlFor="maintenanceRequestId">{t('forms.expense.maintenanceRequestReference')}</label>
          <input
            id="maintenanceRequestId"
            name="maintenanceRequestId"
            type="number"
            min="1"
            value={form.maintenanceRequestId}
            onChange={handleChange}
            placeholder={t('common.optional')}
          />
        </div>
      </div>

      <div className="form-grid">
        <div>
          <label htmlFor="amount">{t('tables.common.amount')}</label>
          <input
            id="amount"
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            value={form.amount}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label htmlFor="expenseType">{t('forms.expense.expenseType')}</label>
          <select id="expenseType" name="expenseType" value={form.expenseType} onChange={handleChange} required>
            {EXPENSE_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {formatEnumLabel(t, 'expenseType', option.value)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label htmlFor="content">{t('tables.common.content')}</label>
      <textarea id="content" name="content" rows="4" value={form.content} onChange={handleChange} required />

      <label htmlFor="proofImage">{t('forms.expense.proofImage')}</label>
      <input
        id="proofImage"
        name="proofImage"
        type="file"
        accept="image/jpeg,image/png"
        onChange={handleChange}
      />

      <button type="submit" disabled={loading}>
        {loading ? t('forms.expense.creating') : t('forms.expense.create')}
      </button>
    </form>
  );
}
