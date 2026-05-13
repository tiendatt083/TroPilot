import { useEffect, useState } from 'react';

const emptyForm = {
  buildingCode: '',
  name: '',
  address: '',
  floors: 1,
  description: ''
};

export default function BuildingForm({ initialValues, loading, submitLabel, onSubmit }) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    setForm({
      ...emptyForm,
      ...initialValues,
      floors: initialValues?.floors || 1
    });
  }, [initialValues]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: name === 'floors' ? Number(value) : value
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(form);
  };

  return (
    <form className="panel-form" onSubmit={handleSubmit}>
      <label htmlFor="buildingCode">Building code</label>
      <input
        id="buildingCode"
        name="buildingCode"
        value={form.buildingCode}
        onChange={handleChange}
        maxLength={50}
        required
      />

      <label htmlFor="name">Building name</label>
      <input
        id="name"
        name="name"
        value={form.name}
        onChange={handleChange}
        maxLength={160}
        required
      />

      <label htmlFor="address">Address</label>
      <input
        id="address"
        name="address"
        value={form.address}
        onChange={handleChange}
        maxLength={255}
        required
      />

      <label htmlFor="floors">Floors</label>
      <input
        id="floors"
        name="floors"
        type="number"
        min="1"
        value={form.floors}
        onChange={handleChange}
        required
      />

      <label htmlFor="description">Description</label>
      <textarea
        id="description"
        name="description"
        value={form.description || ''}
        onChange={handleChange}
        maxLength={1000}
        rows="4"
      />

      <button type="submit" disabled={loading}>
        {loading ? 'Saving...' : submitLabel}
      </button>
    </form>
  );
}
