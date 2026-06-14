import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';
import * as feedbackApi from '../../features/notifications/feedbackApi.js';
import FeedbackTable from '../../components/FeedbackTable.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { FEEDBACK_STATUS_OPTIONS } from '../../utils/feedbackOptions.js';
import { formatEnumLabel } from '../../utils/i18nFormat.js';

export default function AdminBuildingFeedbackPage() {
  const { t } = useTranslation();
  const { building } = useOutletContext();
  const [feedbacks, setFeedbacks] = useState([]);
  const [replyMap, setReplyMap] = useState({});
  const [statusMap, setStatusMap] = useState({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const buildingFilter = { buildingId: building.id };

  const loadFeedbacks = async () => {
    setError('');

    try {
      const response = await feedbackApi.getAdminFeedbacks(buildingFilter);
      setFeedbacks(response.data);
      setStatusMap(Object.fromEntries(response.data.map((feedback) => [feedback.id, feedback.status])));
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('workspace.feedbacks.loadError'));
    }
  };

  useEffect(() => {
    setLoading(true);
    loadFeedbacks().finally(() => setLoading(false));
  }, [building.id]);

  const updateFeedbackInList = (feedback) => {
    setFeedbacks((current) => current.map((item) => (item.id === feedback.id ? feedback : item)));
    setStatusMap((current) => ({ ...current, [feedback.id]: feedback.status }));
  };

  const handleReply = async (feedback) => {
    setProcessingId(feedback.id);
    setMessage('');
    setError('');

    try {
      const response = await feedbackApi.replyAdminFeedback(
        feedback.id,
        { reply: replyMap[feedback.id] || '' },
        buildingFilter
      );
      updateFeedbackInList(response.data);
      setReplyMap((current) => ({ ...current, [feedback.id]: '' }));
      setMessage(t('feedbackManagement.feedbackReplied'));
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('feedbackManagement.feedbackReplyError'));
    } finally {
      setProcessingId(null);
    }
  };

  const handleStatus = async (feedback) => {
    setProcessingId(feedback.id);
    setMessage('');
    setError('');

    try {
      const response = await feedbackApi.updateAdminFeedbackStatus(
        feedback.id,
        { status: statusMap[feedback.id] },
        buildingFilter
      );
      updateFeedbackInList(response.data);
      setMessage(t('feedbackManagement.feedbackStatusUpdated'));
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('feedbackManagement.feedbackStatusError'));
    } finally {
      setProcessingId(null);
    }
  };

  const renderActions = (feedback) => (
    <div className="feedback-action-panel">
      <select
        value={statusMap[feedback.id] || feedback.status}
        onChange={(event) => setStatusMap((current) => ({ ...current, [feedback.id]: event.target.value }))}
      >
        {FEEDBACK_STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {formatEnumLabel(t, 'feedbackStatus', option.value)}
          </option>
        ))}
      </select>
      <button
        className="secondary-button compact-button"
        type="button"
        disabled={processingId === feedback.id}
        onClick={() => handleStatus(feedback)}
      >
        {t('feedbackManagement.saveStatus')}
      </button>
      <textarea
        rows="3"
        value={replyMap[feedback.id] || ''}
        onChange={(event) => setReplyMap((current) => ({ ...current, [feedback.id]: event.target.value }))}
        placeholder={t('feedbackManagement.replyContent')}
      />
      <button
        className="secondary-button compact-button"
        type="button"
        disabled={processingId === feedback.id}
        onClick={() => handleReply(feedback)}
      >
        {t('feedbackManagement.reply')}
      </button>
    </div>
  );

  return (
    <div className="building-workspace">
      <PageHeader eyebrow={t('workspace.feedbacks.eyebrow')} title={t('workspace.feedbacks.title')} />

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">{t('feedbackManagement.feedbacksLoading')}</div>
      ) : (
        <FeedbackTable feedbacks={feedbacks} renderActions={renderActions} />
      )}
    </div>
  );
}
