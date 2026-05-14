import { useState } from 'react';

const emptyForm = {
  roomId: '',
  month: '',
  dueDate: ''
};

export default function InvoiceGenerateForm({ rooms, loading, onSubmit }) {
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
      <label htmlFor="roomId">Room</label>
      <select id="roomId" name="roomId" value={form.roomId} onChange={handleChange} required>
        <option value="">Select room</option>
        {rooms.map((room) => (
          <option key={room.id} value={room.id}>
            {room.roomCode} - {room.roomName}
          </option>
        ))}
      </select>

      <label htmlFor="month">Invoice month</label>
      <input id="month" name="month" type="month" value={form.month} onChange={handleChange} required />

      <label htmlFor="dueDate">Due date</label>
      <input id="dueDate" name="dueDate" type="date" value={form.dueDate} onChange={handleChange} required />

      <button type="submit" disabled={loading}>
        {loading ? 'Generating...' : 'Generate invoice'}
      </button>
    </form>
  );
}
