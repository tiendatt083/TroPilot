import { useEffect, useState } from 'react';
import * as feedbackApi from '../../features/notifications/feedbackApi.js';
import FeedbackTable from '../../components/FeedbackTable.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { FEEDBACK_STATUS_OPTIONS } from '../../utils/feedbackOptions.js';

export default function AdminFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [replyMap, setReplyMap] = useState({});
  const [statusMap, setStatusMap] = useState({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const loadFeedbacks = async () => {
    const response = await feedbackApi.getAdminFeedbacks();
    setFeedbacks(response.data);
    setStatusMap(Object.fromEntries(response.data.map((feedback) => [feedback.id, feedback.status])));
  };

  useEffect(() => {
    loadFeedbacks()
      .catch((apiError) => setError(apiError.response?.data?.message || 'Feedbacks could not be loaded'))
      .finally(() => setLoading(false));
  }, []);

  const updateFeedbackInList = (feedback) => {
    setFeedbacks((current) => current.map((item) => (item.id === feedback.id ? feedback : item)));
    setStatusMap((current) => ({ ...current, [feedback.id]: feedback.status }));
  };

  const handleReply = async (feedback) => {
    const reply = replyMap[feedback.id] || '';
    setProcessingId(feedback.id);
    setMessage('');
    setError('');

    try {
      const response = await feedbackApi.replyAdminFeedback(feedback.id, { reply });
      updateFeedbackInList(response.data);
      setReplyMap((current) => ({ ...current, [feedback.id]: '' }));
      setMessage('Feedback replied successfully.');
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Feedback could not be replied');
    } finally {
      setProcessingId(null);
    }
  };

  const handleStatus = async (feedback) => {
    setProcessingId(feedback.id);
    setMessage('');
    setError('');

    try {
      const response = await feedbackApi.updateAdminFeedbackStatus(feedback.id, {
        status: statusMap[feedback.id]
      });
      updateFeedbackInList(response.data);
      setMessage('Feedback status updated successfully.');
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Feedback status could not be updated');
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
            {option.label}
          </option>
        ))}
      </select>
      <button
        className="secondary-button compact-button"
        type="button"
        disabled={processingId === feedback.id}
        onClick={() => handleStatus(feedback)}
      >
        Save status
      </button>
      <textarea
        rows="3"
        value={replyMap[feedback.id] || ''}
        onChange={(event) => setReplyMap((current) => ({ ...current, [feedback.id]: event.target.value }))}
        placeholder="Reply content"
      />
      <button
        className="secondary-button compact-button"
        type="button"
        disabled={processingId === feedback.id}
        onClick={() => handleReply(feedback)}
      >
        Reply
      </button>
    </div>
  );

  return (
    <section className="content-section">
      <PageHeader eyebrow="Administrator" title="Feedbacks" />

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">Loading feedbacks...</div>
      ) : (
        <FeedbackTable feedbacks={feedbacks} renderActions={renderActions} />
      )}
    </section>
  );
}
