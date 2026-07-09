import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';
import * as feedbackApi from '../../features/notifications/feedbackApi.js';
import * as taskApi from '../../features/maintenance/taskApi.js';
import * as adminUserApi from '../../features/users/api.js';
import LineIcon from '../../components/common/LineIcon.jsx';
import {
  FEEDBACK_STATUS_OPTIONS,
  formatFeedbackDateTime,
  getFeedbackStatusClass
} from '../../utils/feedbackOptions.js';
import { formatEnumLabel } from '../../utils/i18nFormat.js';
import { formatRoomLabel } from '../../utils/roomDisplay.js';

function activeStaff(users) {
  return users.filter((user) => user.role === 'STAFF' && user.status === 'ACTIVE');
}

function toDateInputValue(date) {
  const pad = (value) => String(value).padStart(2, '0');

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate())
  ].join('-');
}

function defaultDeadlineValue() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return toDateInputValue(date);
}

function taskTypeForFeedback(feedback) {
  return feedback.type === 'MAINTENANCE' ? 'MAINTENANCE' : 'FEEDBACK_HANDLING';
}

function toDeadlinePayload(dateValue) {
  return `${dateValue}T23:59:00`;
}

export default function AdminBuildingFeedbackPage() {
  const { t } = useTranslation();
  const { building } = useOutletContext();
  const [feedbacks, setFeedbacks] = useState([]);
  const [staffUsers, setStaffUsers] = useState([]);
  const [replyMap, setReplyMap] = useState({});
  const [statusMap, setStatusMap] = useState({});
  const [assignmentMap, setAssignmentMap] = useState({});
  const [activeAction, setActiveAction] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const buildingFilter = { buildingId: building.id };

  const loadFeedbacks = async () => {
    setError('');

    try {
      const [feedbackResponse, usersResponse] = await Promise.all([
        feedbackApi.getAdminFeedbacks(buildingFilter),
        adminUserApi.getUsers()
      ]);

      setFeedbacks(feedbackResponse.data);
      setStaffUsers(activeStaff(usersResponse.data));
      setStatusMap(Object.fromEntries(feedbackResponse.data.map((feedback) => [feedback.id, feedback.status])));
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('workspace.feedbacks.loadError'));
    }
  };

  useEffect(() => {
    setLoading(true);
    loadFeedbacks().finally(() => setLoading(false));
  }, [building.id]);

  useEffect(() => {
    if (!activeAction) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && processingId === null) {
        setActiveAction(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeAction, processingId]);

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
      setActiveAction(null);
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
      setActiveAction(null);
      setMessage(t('feedbackManagement.feedbackStatusUpdated'));
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('feedbackManagement.feedbackStatusError'));
    } finally {
      setProcessingId(null);
    }
  };

  const getAssignment = (feedbackId) => ({
    assignedToId: '',
    deadline: defaultDeadlineValue(),
    ...(assignmentMap[feedbackId] || {})
  });

  const updateAssignment = (feedbackId, field, value) => {
    setAssignmentMap((current) => ({
      ...current,
      [feedbackId]: {
        assignedToId: '',
        deadline: defaultDeadlineValue(),
        ...(current[feedbackId] || {}),
        [field]: value
      }
    }));
  };

  const handleAssign = async (feedback) => {
    const assignment = getAssignment(feedback.id);

    if (!assignment.assignedToId || !assignment.deadline) {
      setError(t('feedbackManagement.assignMissingInfo'));
      return;
    }

    setProcessingId(feedback.id);
    setMessage('');
    setError('');

    try {
      await taskApi.createAdminTask(
        {
          feedbackId: feedback.id,
          title: `${formatEnumLabel(t, 'feedbackType', feedback.type)} - ${feedback.title}`,
          content: [
            `${t('tables.common.room')}: ${formatRoomLabel(feedback)}`,
            `${t('tables.common.building')}: ${feedback.buildingCode || building.buildingCode}`,
            `${t('tables.common.resident')}: ${feedback.residentHeadName} (${feedback.residentHeadEmail})`,
            `${t('tables.common.content')}: ${feedback.content}`
          ].join('\n'),
          taskType: taskTypeForFeedback(feedback),
          roomId: feedback.roomId,
          assignedToId: Number(assignment.assignedToId),
          deadline: toDeadlinePayload(assignment.deadline),
          priority: 'MEDIUM'
        },
        buildingFilter
      );

      setAssignmentMap((current) => {
        const next = { ...current };
        delete next[feedback.id];
        return next;
      });
      setActiveAction(null);
      await loadFeedbacks();
      setMessage(t('feedbackManagement.feedbackAssigned'));
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('feedbackManagement.feedbackAssignError'));
    } finally {
      setProcessingId(null);
    }
  };

  const toggleAction = (feedbackId, action) => {
    setActiveAction((current) => (
      current?.feedbackId === feedbackId && current.action === action
        ? null
        : { feedbackId, action }
    ));
  };

  const renderActions = (feedback) => {
    const openAction = activeAction?.feedbackId === feedback.id ? activeAction.action : null;
    const canAssign = !feedback.assignedTaskId && !['RESOLVED', 'REJECTED'].includes(feedback.status);

    return (
      <div className="feedback-review-actions">
        <div className="feedback-action-buttons feedback-icon-actions">
          <button
            aria-label={t('feedbackManagement.status')}
            className={`icon-action-button feedback-icon-action ${openAction === 'status' ? 'is-active' : ''}`}
            data-tooltip={t('feedbackManagement.status')}
            type="button"
            aria-pressed={openAction === 'status'}
            onClick={() => toggleAction(feedback.id, 'status')}
          >
            <LineIcon name="settings" />
          </button>
          <button
            aria-label={t('feedbackManagement.reply')}
            className={`icon-action-button feedback-icon-action ${openAction === 'reply' ? 'is-active' : ''}`}
            data-tooltip={t('feedbackManagement.reply')}
            type="button"
            aria-pressed={openAction === 'reply'}
            onClick={() => toggleAction(feedback.id, 'reply')}
          >
            <LineIcon name="feedback" />
          </button>
          {canAssign && (
            <button
              aria-label={t('feedbackManagement.assign')}
              className={`icon-action-button feedback-icon-action ${openAction === 'assign' ? 'is-active' : ''}`}
              data-tooltip={t('feedbackManagement.assign')}
              type="button"
              aria-pressed={openAction === 'assign'}
              onClick={() => toggleAction(feedback.id, 'assign')}
            >
              <LineIcon name="userPlus" />
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderActionForm = (feedback) => {
    const openAction = activeAction?.feedbackId === feedback.id ? activeAction.action : null;
    const canAssign = !feedback.assignedTaskId && !['RESOLVED', 'REJECTED'].includes(feedback.status);

    if (openAction === 'status') {
      return (
        <div className="feedback-expanded-panel feedback-status-panel">
          <div>
            <strong>{t('feedbackManagement.statusTitle')}</strong>
            <span>{t('feedbackManagement.statusDescription')}</span>
          </div>
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
            className="inline-button compact-button"
            type="button"
            disabled={processingId === feedback.id}
            onClick={() => handleStatus(feedback)}
          >
            {t('feedbackManagement.saveStatus')}
          </button>
        </div>
      );
    }

    if (openAction === 'reply') {
      return (
        <div className="feedback-expanded-panel feedback-reply-panel">
          <div>
            <strong>{t('feedbackManagement.replyTitle')}</strong>
            <span>{feedback.title}</span>
          </div>
          <textarea
            rows="3"
            value={replyMap[feedback.id] || ''}
            onChange={(event) => setReplyMap((current) => ({ ...current, [feedback.id]: event.target.value }))}
            placeholder={t('feedbackManagement.replyContent')}
          />
          <button
            className="inline-button compact-button"
            type="button"
            disabled={processingId === feedback.id}
            onClick={() => handleReply(feedback)}
          >
            {t('feedbackManagement.reply')}
          </button>
        </div>
      );
    }

    if (openAction === 'assign' && canAssign) {
      return (
        <div className="feedback-expanded-panel feedback-assignment-panel">
          <div>
            <strong>{t('feedbackManagement.assignTitle')}</strong>
            <span>{formatRoomLabel(feedback)}</span>
          </div>
          <select
            value={getAssignment(feedback.id).assignedToId}
            onChange={(event) => updateAssignment(feedback.id, 'assignedToId', event.target.value)}
          >
            <option value="">{t('feedbackManagement.selectStaff')}</option>
            {staffUsers.map((staff) => (
              <option key={staff.id} value={staff.id}>
                {staff.fullName} - {staff.email}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={getAssignment(feedback.id).deadline}
            onChange={(event) => updateAssignment(feedback.id, 'deadline', event.target.value)}
          />
          <button
            className="inline-button compact-button"
            type="button"
            disabled={processingId === feedback.id || staffUsers.length === 0}
            onClick={() => handleAssign(feedback)}
          >
            {processingId === feedback.id ? t('feedbackManagement.assigning') : t('feedbackManagement.assign')}
          </button>
        </div>
      );
    }

    return null;
  };

  const handleDialogOverlayClick = (event) => {
    if (event.target === event.currentTarget && processingId === null) {
      setActiveAction(null);
    }
  };

  const activeFeedback = activeAction
    ? feedbacks.find((feedback) => feedback.id === activeAction.feedbackId)
    : null;

  const activeDialogTitle = activeAction?.action === 'status'
    ? t('feedbackManagement.statusTitle')
    : activeAction?.action === 'reply'
      ? t('feedbackManagement.replyTitle')
      : t('feedbackManagement.assignTitle');

  const renderActionDialog = () => {
    if (!activeFeedback) {
      return null;
    }

    return (
      <div className="feedback-action-dialog-overlay" onMouseDown={handleDialogOverlayClick}>
        <section
          aria-labelledby="feedback-action-dialog-title"
          aria-modal="true"
          className="feedback-action-dialog"
          role="dialog"
        >
          <header className="feedback-action-dialog-header">
            <div>
              <span>{formatRoomLabel(activeFeedback)}</span>
              <h2 id="feedback-action-dialog-title">{activeDialogTitle}</h2>
            </div>
            <button
              aria-label={t('common.close')}
              className="feedback-dialog-close-button"
              disabled={processingId !== null}
              type="button"
              onClick={() => setActiveAction(null)}
            >
              <span aria-hidden="true">x</span>
            </button>
          </header>

          <div className="feedback-dialog-summary">
            <strong>{activeFeedback.title}</strong>
            <p>{activeFeedback.content}</p>
          </div>

          {renderActionForm(activeFeedback)}
        </section>
      </div>
    );
  };

  const renderFeedbackItem = (feedback) => {
    const isActive = activeAction?.feedbackId === feedback.id;
    const hasReply = Boolean(feedback.reply);
    const hasAssignedTask = Boolean(feedback.assignedTaskId);

    return (
      <article
        key={feedback.id}
        className={`feedback-review-card ${isActive ? 'is-open' : ''}`}
      >
        <div className="feedback-review-main">
          <div className="feedback-review-content">
            <div className="feedback-review-title-row">
              <div className="feedback-review-title-block">
                <div className="feedback-review-kicker">
                  <span>{formatEnumLabel(t, 'feedbackType', feedback.type)}</span>
                  {feedback.invoiceId ? <span>#{feedback.invoiceId}</span> : null}
                </div>
                <h3>{feedback.title}</h3>
              </div>
            </div>

            <p className="feedback-review-message" title={feedback.content}>{feedback.content}</p>

            <div className="feedback-review-meta">
              <span>
                <LineIcon name="home" />
                <em>{formatRoomLabel(feedback)}</em>
              </span>
              <span>
                <LineIcon name="user" />
                <em>{feedback.residentHeadName}</em>
              </span>
              <span>
                <LineIcon name="clock" />
                <em>{formatFeedbackDateTime(feedback.createdAt)}</em>
              </span>
              {hasReply && (
                <span>
                  <LineIcon name="feedback" />
                  <em>{feedback.reply}</em>
                </span>
              )}
            </div>
          </div>

          <div className="feedback-review-side">
            <span className={getFeedbackStatusClass(feedback.status)}>
              {formatEnumLabel(t, 'feedbackStatus', feedback.status)}
            </span>
            {hasAssignedTask && (
              <div className="feedback-linked-task feedback-linked-task-compact">
                <strong>{feedback.assignedStaffName || t('common.notAssigned')}</strong>
                <span>{formatEnumLabel(t, 'taskStatus', feedback.assignedTaskStatus)}</span>
              </div>
            )}
            {renderActions(feedback)}
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="building-workspace feedback-workspace">
      <div className="building-section-header">
        <span className="page-eyebrow">{t('workspace.feedbacks.eyebrow')}</span>
      </div>

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">{t('feedbackManagement.feedbacksLoading')}</div>
      ) : feedbacks.length === 0 ? (
        <div className="empty-state flat-empty-state">{t('tables.feedbacks.empty')}</div>
      ) : (
        <section className="feedback-review-list" aria-label={t('navigation.feedbacks')}>
          {feedbacks.map(renderFeedbackItem)}
        </section>
      )}
      {renderActionDialog()}
    </div>
  );
}
