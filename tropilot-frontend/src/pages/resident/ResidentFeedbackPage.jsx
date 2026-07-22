import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as feedbackApi from '../../api/feedbackApi.js';
import FeedbackTable from '../../components/FeedbackTable.jsx';
import ActionDialog from '../../components/common/ActionDialog.jsx';
import ManagementPageHero from '../../components/common/ManagementPageHero.jsx';
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
  const [composerOpen, setComposerOpen] = useState(false);

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

  const handleOpenComposer = () => {
    setForm(emptyForm);
    setError('');
    setMessage('');
    setComposerOpen(true);
  };

  const handleCloseComposer = () => {
    if (saving) {
      return;
    }

    setComposerOpen(false);
    setForm(emptyForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      await feedbackApi.createResidentFeedback(form);
      setForm(emptyForm);
      setComposerOpen(false);
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
      <ManagementPageHero
        actions={(
          <button className="button-link inline-button" type="button" onClick={handleOpenComposer}>
            {t('resident.feedback.create')}
          </button>
        )}
        description={t('resident.feedback.description')}
        title={t('resident.feedback.title')}
      />

      {message && <div className="alert success-alert">{message}</div>}
      {error && !composerOpen && <div className="alert error-alert">{error}</div>}

      <ActionDialog
        className="resident-feedback-dialog"
        eyebrow={t('resident.eyebrow')}
        labelledBy="resident-feedback-dialog-title"
        open={composerOpen}
        title={t('resident.feedback.createTitle')}
        onClose={handleCloseComposer}
      >
        {error && <div className="alert error-alert">{error}</div>}
        <form className="panel-form resident-feedback-form" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="type">{t('resident.feedback.type')}</label>
            <select id="type" name="type" value={form.type} onChange={handleChange} required>
              {FEEDBACK_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(`enum.feedbackType.${option.value}`)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="title">{t('resident.feedback.subject')}</label>
            <input id="title" name="title" value={form.title} onChange={handleChange} maxLength={160} required />
          </div>

          <div>
            <label htmlFor="content">{t('resident.feedback.content')}</label>
            <textarea id="content" name="content" rows="6" value={form.content} onChange={handleChange} required />
          </div>

          <button type="submit" disabled={saving}>
            {saving ? t('resident.feedback.submitting') : t('resident.feedback.submit')}
          </button>
        </form>
      </ActionDialog>

      <section className="building-section">
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
