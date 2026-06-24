import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as feedbackApi from '../../features/notifications/feedbackApi.js';
import PageHeader from '../../components/PageHeader.jsx';
import {
  formatFeedbackDateTime,
  getFeedbackStatusClass,
} from '../../utils/feedbackOptions.js';
import { formatEnumLabel } from '../../utils/i18nFormat.js';
import { formatRoomLabel } from '../../utils/roomDisplay.js';

export default function AdminFeedbackPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [feedbacks, setFeedbacks] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadFeedbacks = async () => {
    const response = await feedbackApi.getAdminFeedbacks();
    setFeedbacks(response.data);
  };

  useEffect(() => {
    loadFeedbacks()
      .catch((apiError) => setError(apiError.response?.data?.message || t('feedbackManagement.feedbacksLoadError')))
      .finally(() => setLoading(false));
  }, []);

  const openBuildingFeedbacks = (feedback) => {
    navigate(feedback.buildingId ? `/admin/buildings/${feedback.buildingId}/feedbacks` : '/admin/buildings');
  };

  const handleRowKeyDown = (event, feedback) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openBuildingFeedbacks(feedback);
    }
  };

  return (
    <section className="content-section admin-feedback-overview-page">
      <PageHeader eyebrow={t('feedbackManagement.adminEyebrow')} title={t('feedbackManagement.feedbacksTitle')} />
      <p className="page-support-text">{t('feedbackManagement.feedbacksOverviewDescription')}</p>

      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">{t('feedbackManagement.feedbacksLoading')}</div>
      ) : (
        <div className="table-wrap">
          <table className="data-table admin-feedback-overview-table">
            <thead>
              <tr>
                <th>{t('tables.feedbacks.title')}</th>
                <th>{t('tables.common.building')}</th>
                <th>{t('tables.common.room')}</th>
                <th>{t('tables.common.resident')}</th>
                <th>{t('tables.common.status')}</th>
                <th>{t('tables.common.created')}</th>
                <th>{t('tables.common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {feedbacks.map((feedback) => (
                  <tr
                    className="clickable-table-row admin-feedback-overview-row"
                    key={feedback.id}
                    role="link"
                    tabIndex={0}
                    onClick={() => openBuildingFeedbacks(feedback)}
                    onKeyDown={(event) => handleRowKeyDown(event, feedback)}
                  >
                    <td>
                      <span className="admin-feedback-title-link">
                        <strong>{feedback.title}</strong>
                        <span className="table-subtext">{feedback.content}</span>
                      </span>
                    </td>
                    <td>
                      <strong>{feedback.buildingCode || t('common.noBuilding')}</strong>
                      {feedback.buildingName && <span className="table-subtext">{feedback.buildingName}</span>}
                    </td>
                    <td>{formatRoomLabel(feedback)}</td>
                    <td>
                      <strong>{feedback.residentHeadName}</strong>
                      <span className="table-subtext">{feedback.residentHeadEmail}</span>
                    </td>
                    <td>
                      <span className={getFeedbackStatusClass(feedback.status)}>
                        {formatEnumLabel(t, 'feedbackStatus', feedback.status)}
                      </span>
                    </td>
                    <td>{formatFeedbackDateTime(feedback.createdAt)}</td>
                    <td>
                      <span className="secondary-link admin-feedback-row-action">
                        {t('feedbackManagement.openBuildingFeedbacks')}
                      </span>
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
          {feedbacks.length === 0 && <div className="empty-state flat-empty-state">{t('tables.feedbacks.empty')}</div>}
        </div>
      )}
    </section>
  );
}
