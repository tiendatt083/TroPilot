import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EXPENSE_TYPE_OPTIONS } from '../utils/expenseOptions.js';
import { formatEnumLabel } from '../utils/i18nFormat.js';
import { formatRoomCode, formatRoomLabel } from '../utils/roomDisplay.js';

const emptyForm = {
  roomId: '',
  taskId: '',
  maintenanceRequestId: '',
  equipmentReference: '',
  amount: '',
  content: '',
  expenseType: 'OPERATION',
  proofImage: null
};

function equipmentLabel(equipment) {
  const code = equipment?.equipmentCode || equipment?.code;
  const name = equipment?.name || equipment?.equipmentName;

  if (code && name) {
    return `${code} - ${name}`;
  }

  return code || name || '';
}

function filterEquipmentByRoom(equipmentOptions, roomId, selectedEquipmentId) {
  const normalizedRoomId = String(roomId || '');
  const normalizedEquipmentId = String(selectedEquipmentId || '');

  return equipmentOptions.filter((equipment) => {
    if (normalizedEquipmentId && String(equipment.id) === normalizedEquipmentId) {
      return true;
    }

    if (!normalizedRoomId) {
      return equipment.scope === 'BUILDING' || !equipment.roomId;
    }

    return String(equipment.roomId || '') === normalizedRoomId;
  });
}

export default function ExpenseForm({
  compactRoomLabels = false,
  equipmentOptions = [],
  initialValues,
  loading,
  noRoomLabel,
  onSubmit,
  rooms,
  showReferenceFields = true,
  showEquipmentField = false
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    setForm({
      ...emptyForm,
      ...initialValues,
      roomId: initialValues?.roomId || '',
      taskId: initialValues?.taskId || '',
      maintenanceRequestId: initialValues?.maintenanceRequestId || '',
      equipmentReference: initialValues?.equipmentReference || initialValues?.equipmentId || '',
      amount: initialValues?.amount || '',
      expenseType: initialValues?.expenseType || 'OPERATION',
      proofImage: null
    });
  }, [initialValues]);

  const availableEquipment = filterEquipmentByRoom(
    equipmentOptions,
    form.roomId,
    form.equipmentReference
  );
  const selectedEquipment = equipmentOptions.find(
    (equipment) => String(equipment.id) === String(form.equipmentReference)
  );
  const roomEmptyLabel = noRoomLabel || t('forms.task.noRoomLinked');

  const handleChange = (event) => {
    const { name, value, files } = event.target;
    setForm((current) => ({
      ...current,
      [name]: files ? files[0] || null : value,
      ...(name === 'roomId' ? { equipmentReference: '' } : {})
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const equipmentInfo = selectedEquipment
      ? `\nMã thiết bị: ${equipmentLabel(selectedEquipment)}`
      : form.equipmentReference === 'OTHER'
        ? '\nMã thiết bị: Khác'
        : '';
    const { equipmentReference, ...expensePayload } = form;
    const payload = {
      ...expensePayload,
      content: `${String(form.content || '').trim()}${equipmentInfo}`.trim()
    };

    try {
      await onSubmit(payload);
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
        <option value="">{roomEmptyLabel}</option>
        {rooms.map((room) => (
          <option key={room.id} value={room.id}>
            {compactRoomLabels ? formatRoomCode(room) : formatRoomLabel(room)}
          </option>
        ))}
      </select>

      {showReferenceFields && (
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
      )}

      {showEquipmentField && (
        <div>
          <label htmlFor="equipmentReference">{t('tables.common.equipment')}</label>
          <select
            id="equipmentReference"
            name="equipmentReference"
            value={form.equipmentReference}
            onChange={handleChange}
          >
            <option value="">{t('common.optional')}</option>
            {availableEquipment.map((equipment) => (
              <option key={equipment.id} value={equipment.id}>
                {equipmentLabel(equipment)}
              </option>
            ))}
            <option value="OTHER">Khác</option>
          </select>
        </div>
      )}

      <div className="form-grid">
        <div>
          <label htmlFor="amount">{t('tables.common.amount')}</label>
          <div className="currency-input-shell">
            <input
              id="amount"
              name="amount"
              type="number"
              min="0"
              step="1000"
              inputMode="numeric"
              value={form.amount}
              onChange={handleChange}
              required
            />
            <span>VNĐ</span>
          </div>
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
