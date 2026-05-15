import { useEffect, useState } from 'react';
import * as feedbackApi from '../../api/feedbackApi.js';
import FeedbackTable from '../../components/FeedbackTable.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { FEEDBACK_STATUS_OPTIONS } from '../../utils/feedbackOptions.js';

export default function AdminInvoiceComplaintPage() {
  const [complaints, setComplaints] = useState([]);
  const [replyMap, setReplyMap] = useState({});
  const [statusMap, setStatusMap] = useState({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const loadComplaints = async () => {
    const response = await feedbackApi.getAdminInvoiceComplaints();
    setComplaints(response.data);
    setStatusMap(Object.fromEntries(response.data.map((complaint) => [complaint.id, complaint.status])));
  };

  useEffect(() => {
    loadComplaints()
      .catch((apiError) => setError(apiError.response?.data?.message || 'Invoice complaints could not be loaded'))
      .finally(() => setLoading(false));
  }, []);

  const updateComplaintInList = (complaint) => {
    setComplaints((current) => current.map((item) => (item.id === complaint.id ? complaint : item)));
    setStatusMap((current) => ({ ...current, [complaint.id]: complaint.status }));
  };

  const handleReply = async (complaint) => {
    setProcessingId(complaint.id);
    setMessage('');
    setError('');

    try {
      const response = await feedbackApi.replyAdminFeedback(complaint.id, {
        reply: replyMap[complaint.id] || ''
      });
      updateComplaintInList(response.data);
      setReplyMap((current) => ({ ...current, [complaint.id]: '' }));
      setMessage('Invoice complaint replied successfully.');
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Invoice complaint could not be replied');
    } finally {
      setProcessingId(null);
    }
  };

  const handleStatus = async (complaint) => {
    setProcessingId(complaint.id);
    setMessage('');
    setError('');

    try {
      const response = await feedbackApi.updateAdminFeedbackStatus(complaint.id, {
        status: statusMap[complaint.id]
      });
      updateComplaintInList(response.data);
      setMessage('Invoice complaint status updated successfully.');
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Invoice complaint status could not be updated');
    } finally {
      setProcessingId(null);
    }
  };

  const renderActions = (complaint) => (
    <div className="feedback-action-panel">
      <select
        value={statusMap[complaint.id] || complaint.status}
        onChange={(event) => setStatusMap((current) => ({ ...current, [complaint.id]: event.target.value }))}
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
        disabled={processingId === complaint.id}
        onClick={() => handleStatus(complaint)}
      >
        Save status
      </button>
      <textarea
        rows="3"
        value={replyMap[complaint.id] || ''}
        onChange={(event) => setReplyMap((current) => ({ ...current, [complaint.id]: event.target.value }))}
        placeholder="Reply content"
      />
      <button
        className="secondary-button compact-button"
        type="button"
        disabled={processingId === complaint.id}
        onClick={() => handleReply(complaint)}
      >
        Reply
      </button>
    </div>
  );

  return (
    <section className="content-section">
      <PageHeader eyebrow="Administrator" title="Invoice complaints" />

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">Loading invoice complaints...</div>
      ) : (
        <FeedbackTable feedbacks={complaints} renderActions={renderActions} />
      )}
    </section>
  );
}
