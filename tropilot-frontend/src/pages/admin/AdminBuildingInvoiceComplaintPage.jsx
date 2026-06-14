import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';
import * as feedbackApi from '../../features/notifications/feedbackApi.js';
import FeedbackTable from '../../components/FeedbackTable.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { FEEDBACK_STATUS_OPTIONS } from '../../utils/feedbackOptions.js';
import { formatEnumLabel } from '../../utils/i18nFormat.js';

export default function AdminBuildingInvoiceComplaintPage() {
  const { t } = useTranslation();
  const { building } = useOutletContext();
  const [complaints, setComplaints] = useState([]);
  const [replyMap, setReplyMap] = useState({});
  const [statusMap, setStatusMap] = useState({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const buildingFilter = { buildingId: building.id };

  const loadComplaints = async () => {
    setError('');

    try {
      const response = await feedbackApi.getAdminInvoiceComplaints(buildingFilter);
      setComplaints(response.data);
      setStatusMap(Object.fromEntries(response.data.map((complaint) => [complaint.id, complaint.status])));
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('workspace.invoiceComplaints.loadError'));
    }
  };

  useEffect(() => {
    setLoading(true);
    loadComplaints().finally(() => setLoading(false));
  }, [building.id]);

  const updateComplaintInList = (complaint) => {
    setComplaints((current) => current.map((item) => (item.id === complaint.id ? complaint : item)));
    setStatusMap((current) => ({ ...current, [complaint.id]: complaint.status }));
  };

  const handleReply = async (complaint) => {
    setProcessingId(complaint.id);
    setMessage('');
    setError('');

    try {
      const response = await feedbackApi.replyAdminFeedback(
        complaint.id,
        { reply: replyMap[complaint.id] || '' },
        buildingFilter
      );
      updateComplaintInList(response.data);
      setReplyMap((current) => ({ ...current, [complaint.id]: '' }));
      setMessage(t('feedbackManagement.complaintReplied'));
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('feedbackManagement.complaintReplyError'));
    } finally {
      setProcessingId(null);
    }
  };

  const handleStatus = async (complaint) => {
    setProcessingId(complaint.id);
    setMessage('');
    setError('');

    try {
      const response = await feedbackApi.updateAdminFeedbackStatus(
        complaint.id,
        { status: statusMap[complaint.id] },
        buildingFilter
      );
      updateComplaintInList(response.data);
      setMessage(t('feedbackManagement.complaintStatusUpdated'));
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('feedbackManagement.complaintStatusError'));
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
            {formatEnumLabel(t, 'feedbackStatus', option.value)}
          </option>
        ))}
      </select>
      <button
        className="secondary-button compact-button"
        type="button"
        disabled={processingId === complaint.id}
        onClick={() => handleStatus(complaint)}
      >
        {t('feedbackManagement.saveStatus')}
      </button>
      <textarea
        rows="3"
        value={replyMap[complaint.id] || ''}
        onChange={(event) => setReplyMap((current) => ({ ...current, [complaint.id]: event.target.value }))}
        placeholder={t('feedbackManagement.replyContent')}
      />
      <button
        className="secondary-button compact-button"
        type="button"
        disabled={processingId === complaint.id}
        onClick={() => handleReply(complaint)}
      >
        {t('feedbackManagement.reply')}
      </button>
    </div>
  );

  return (
    <div className="building-workspace">
      <PageHeader eyebrow={t('workspace.invoiceComplaints.eyebrow')} title={t('workspace.invoiceComplaints.title')} />

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">{t('feedbackManagement.complaintsLoading')}</div>
      ) : (
        <FeedbackTable feedbacks={complaints} renderActions={renderActions} />
      )}
    </div>
  );
}
