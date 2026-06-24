import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as feedbackApi from '../../features/notifications/feedbackApi.js';
import FeedbackTable from '../../components/FeedbackTable.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { FEEDBACK_TYPE_OPTIONS } from '../../utils/feedbackOptions.js';

const emptyForm = {
  type: 'GENERAL',
  title: '',
  content: ''
};

export default function ResidentFeedbackPage() {
  const { t } = useTranslation();
  const [form, setForm] = useState(emptyForm);
  const [feedbacks, setFeedbacks] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadFeedbacks = async () => {
    const response = await feedbackApi.getResidentFeedbacks();
    setFeedbacks(response.data || []);
  };

  useEffect(() => {
    let active = true;

    loadFeedbacks()
      .catch((apiError) => {
        if (active) {
          setError(apiError.response?.data?.message || t('resident.feedback.loadError'));
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

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
      await loadFeedbacks();
      setMessage(t('resident.feedback.submitted'));
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('resident.feedback.submitError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="content-section resident-feedback-page">
      <PageHeader eyebrow={t('resident.eyebrow')} title={t('resident.feedback.title')} />

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      <form className="panel-form" onSubmit={handleSubmit}>
        <label htmlFor="type">{t('resident.feedback.type')}</label>
        <select id="type" name="type" value={form.type} onChange={handleChange} required>
          {FEEDBACK_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {t(`enum.feedbackType.${option.value}`)}
            </option>
          ))}
        </select>

        <label htmlFor="title">{t('resident.feedback.subject')}</label>
        <input id="title" name="title" value={form.title} onChange={handleChange} maxLength={160} required />

        <label htmlFor="content">{t('resident.feedback.content')}</label>
        <textarea id="content" name="content" rows="6" value={form.content} onChange={handleChange} required />

        <button type="submit" disabled={saving}>
          {saving ? t('resident.feedback.submitting') : t('resident.feedback.submit')}
        </button>
      </form>

      <section className="building-section">
        <PageHeader eyebrow={t('resident.eyebrow')} title={t('resident.feedback.historyTitle')} />
        {loading ? (
          <div className="empty-state">{t('resident.feedback.loading')}</div>
        ) : (
          <FeedbackTable
            feedbacks={feedbacks}
            visibleColumns={['title', 'type', 'room', 'status', 'reply', 'created']}
          />
        )}
      </section>
    </section>
  );
}
