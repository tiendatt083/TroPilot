import { useState } from 'react';

const emptyForm = {
  title: '',
  content: '',
  image: null
};

export default function MaintenanceRequestForm({ loading, onSubmit }) {
  const [form, setForm] = useState(emptyForm);

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
      <label htmlFor="title">Title</label>
      <input id="title" name="title" value={form.title} onChange={handleChange} maxLength={160} required />

      <label htmlFor="content">Content</label>
      <textarea id="content" name="content" rows="6" value={form.content} onChange={handleChange} required />

      <label htmlFor="image">Issue image</label>
      <input id="image" name="image" type="file" accept="image/jpeg,image/png" onChange={handleChange} />

      <button type="submit" disabled={loading}>
        {loading ? 'Submitting...' : 'Submit request'}
      </button>
    </form>
  );
}
