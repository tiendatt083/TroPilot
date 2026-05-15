import { useState } from 'react';
import * as feedbackApi from '../../api/feedbackApi.js';
import PageHeader from '../../components/PageHeader.jsx';
import { FEEDBACK_TYPE_OPTIONS } from '../../utils/feedbackOptions.js';

const emptyForm = {
  type: 'GENERAL',
  title: '',
  content: ''
};

export default function ResidentFeedbackPage() {
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      await feedbackApi.createResidentFeedback(form);
      setForm(emptyForm);
      setMessage('Feedback submitted successfully.');
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Feedback could not be submitted');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="content-section narrow-section">
      <PageHeader eyebrow="Head resident" title="Feedback" />

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      <form className="panel-form" onSubmit={handleSubmit}>
        <label htmlFor="type">Feedback type</label>
        <select id="type" name="type" value={form.type} onChange={handleChange} required>
          {FEEDBACK_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <label htmlFor="title">Title</label>
        <input id="title" name="title" value={form.title} onChange={handleChange} maxLength={160} required />

        <label htmlFor="content">Content</label>
        <textarea id="content" name="content" rows="6" value={form.content} onChange={handleChange} required />

        <button type="submit" disabled={saving}>
          {saving ? 'Submitting...' : 'Submit feedback'}
        </button>
      </form>
    </section>
  );
}
