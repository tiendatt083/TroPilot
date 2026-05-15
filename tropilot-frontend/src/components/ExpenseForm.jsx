import { useEffect, useState } from 'react';
import { EXPENSE_TYPE_OPTIONS } from '../utils/expenseOptions.js';

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
      <label htmlFor="roomId">Room</label>
      <select id="roomId" name="roomId" value={form.roomId} onChange={handleChange}>
        <option value="">No room linked</option>
        {rooms.map((room) => (
          <option key={room.id} value={room.id}>
            {room.roomCode} - {room.roomName}
          </option>
        ))}
      </select>

      <div className="form-grid">
        <div>
          <label htmlFor="taskId">Task reference</label>
          <input
            id="taskId"
            name="taskId"
            type="number"
            min="1"
            value={form.taskId}
            onChange={handleChange}
            placeholder="Optional"
          />
        </div>
        <div>
          <label htmlFor="maintenanceRequestId">Maintenance request reference</label>
          <input
            id="maintenanceRequestId"
            name="maintenanceRequestId"
            type="number"
            min="1"
            value={form.maintenanceRequestId}
            onChange={handleChange}
            placeholder="Optional"
          />
        </div>
      </div>

      <div className="form-grid">
        <div>
          <label htmlFor="amount">Amount</label>
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
          <label htmlFor="expenseType">Expense type</label>
          <select id="expenseType" name="expenseType" value={form.expenseType} onChange={handleChange} required>
            {EXPENSE_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label htmlFor="content">Content</label>
      <textarea id="content" name="content" rows="4" value={form.content} onChange={handleChange} required />

      <label htmlFor="proofImage">Proof image</label>
      <input
        id="proofImage"
        name="proofImage"
        type="file"
        accept="image/jpeg,image/png"
        onChange={handleChange}
      />

      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create expense'}
      </button>
    </form>
  );
}
