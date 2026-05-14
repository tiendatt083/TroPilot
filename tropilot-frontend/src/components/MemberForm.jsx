import { useEffect, useState } from 'react';

const emptyForm = {
  fullName: '',
  phone: '',
  identityNumber: '',
  dateOfBirth: '',
  relationship: '',
  moveInDate: '',
  note: ''
};

export default function MemberForm({ initialValues, loading, submitLabel, onSubmit, onCancel }) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    setForm({
      ...emptyForm,
      ...initialValues,
      dateOfBirth: initialValues?.dateOfBirth || '',
      moveInDate: initialValues?.moveInDate || ''
    });
  }, [initialValues]);

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
      fullName: form.fullName,
      phone: form.phone,
      identityNumber: form.identityNumber || null,
      dateOfBirth: form.dateOfBirth || null,
      relationship: form.relationship || null,
      moveInDate: form.moveInDate || null,
      note: form.note || null
    });
  };

  return (
    <form className="panel-form" onSubmit={handleSubmit}>
      <label htmlFor="fullName">Full name</label>
      <input
        id="fullName"
        name="fullName"
        value={form.fullName}
        onChange={handleChange}
        maxLength={120}
        required
      />

      <label htmlFor="phone">Phone</label>
      <input id="phone" name="phone" value={form.phone} onChange={handleChange} maxLength={30} required />

      <div className="form-grid">
        <div>
          <label htmlFor="identityNumber">Identity number</label>
          <input
            id="identityNumber"
            name="identityNumber"
            value={form.identityNumber || ''}
            onChange={handleChange}
            maxLength={60}
          />
        </div>
        <div>
          <label htmlFor="relationship">Relationship</label>
          <input
            id="relationship"
            name="relationship"
            value={form.relationship || ''}
            onChange={handleChange}
            maxLength={80}
          />
        </div>
      </div>

      <div className="form-grid">
        <div>
          <label htmlFor="dateOfBirth">Date of birth</label>
          <input
            id="dateOfBirth"
            name="dateOfBirth"
            type="date"
            value={form.dateOfBirth || ''}
            onChange={handleChange}
          />
        </div>
        <div>
          <label htmlFor="moveInDate">Move-in date</label>
          <input
            id="moveInDate"
            name="moveInDate"
            type="date"
            value={form.moveInDate || ''}
            onChange={handleChange}
          />
        </div>
      </div>

      <label htmlFor="note">Note</label>
      <textarea id="note" name="note" value={form.note || ''} onChange={handleChange} maxLength={1000} rows="4" />

      <div className="button-row form-button-row">
        {onCancel && (
          <button className="secondary-button inline-button" type="button" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" disabled={loading}>
          {loading ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
