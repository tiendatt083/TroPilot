import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as feedbackApi from '../../api/feedbackApi.js';
import ManagementPageHero from '../../components/common/ManagementPageHero.jsx';
import {
  formatFeedbackDateTime,
  getFeedbackStatusClass
} from '../../utils/feedbackOptions.js';
import { formatEnumLabel } from '../../utils/i18nFormat.js';
import { formatRoomLabel } from '../../utils/roomDisplay.js';

const UNRESOLVED_STATUSES = new Set(['PENDING', 'IN_PROGRESS']);

function sortNewestFirst(feedbacks) {
  return [...feedbacks].sort((first, second) => (
    new Date(second.createdAt || 0).getTime() - new Date(first.createdAt || 0).getTime()
  ));
}

/** Trang tổng quan phản hồi và khiếu nại từ tất cả tòa nhà. */
export default function AdminFeedbackOverviewPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [feedbacks, setFeedbacks] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    buildingId: '',
    status: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    feedbackApi.getAdminFeedbacks()
      .then((response) => setFeedbacks(response.data || []))
      .catch((apiError) => setError(apiError.response?.data?.message || t('feedbackManagement.feedbacksLoadError')))
      .finally(() => setLoading(false));
  }, [t]);

  const unresolvedFeedbacks = useMemo(
    () => sortNewestFirst(feedbacks.filter((feedback) => UNRESOLVED_STATUSES.has(feedback.status))),
    [feedbacks]
  );

  const buildingOptions = useMemo(() => {
    const buildings = new Map();

    unresolvedFeedbacks.forEach((feedback) => {
      if (feedback.buildingId) {
        buildings.set(String(feedback.buildingId), {
          id: feedback.buildingId,
          label: [feedback.buildingCode, feedback.buildingName].filter(Boolean).join(' - ')
        });
      }
    });

    return [...buildings.values()].sort((first, second) => first.label.localeCompare(second.label));
  }, [unresolvedFeedbacks]);

  const filteredFeedbacks = useMemo(() => {
    const searchText = filters.search.trim().toLocaleLowerCase();

    return unresolvedFeedbacks.filter((feedback) => {
      const matchesBuilding = !filters.buildingId || String(feedback.buildingId) === filters.buildingId;
      const matchesStatus = !filters.status || feedback.status === filters.status;
      const searchableText = [
        feedback.title,
        feedback.content,
        feedback.buildingCode,
        feedback.buildingName,
        feedback.roomCode,
        feedback.roomName,
        feedback.residentHeadName,
        feedback.residentHeadEmail
      ].filter(Boolean).join(' ').toLocaleLowerCase();

      return matchesBuilding && matchesStatus && (!searchText || searchableText.includes(searchText));
    });
  }, [filters, unresolvedFeedbacks]);

  const updateFilter = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const openBuildingFeedbacks = (feedback) => {
    if (feedback.buildingId) {
      navigate(`/admin/buildings/${feedback.buildingId}/feedbacks`);
    }
  };

  const handleRowKeyDown = (event, feedback) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openBuildingFeedbacks(feedback);
    }
  };

  return (
    <section className="content-section admin-feedback-overview-page">
      <ManagementPageHero
        description={t('feedbackManagement.feedbacksOverviewDescription')}
        title={t('feedbackManagement.feedbacksTitle')}
      />

      {error && <div className="form-message error">{error}</div>}

      {loading ? (
        <div className="empty-state">{t('feedbackManagement.feedbacksLoading')}</div>
      ) : (
        <>
          <div className="feedback-overview-filters" role="search">
            <input
              aria-label={t('feedbackManagement.searchFeedbacks')}
              name="search"
              placeholder={t('feedbackManagement.searchFeedbacks')}
              type="search"
              value={filters.search}
              onChange={updateFilter}
            />
            <select
              aria-label={t('feedbackManagement.filterBuilding')}
              name="buildingId"
              value={filters.buildingId}
              onChange={updateFilter}
            >
              <option value="">{t('feedbackManagement.allBuildings')}</option>
              {buildingOptions.map((building) => (
                <option key={building.id} value={building.id}>{building.label}</option>
              ))}
            </select>
            <select
              aria-label={t('feedbackManagement.filterStatus')}
              name="status"
              value={filters.status}
              onChange={updateFilter}
            >
              <option value="">{t('feedbackManagement.allStatuses')}</option>
              {['PENDING', 'IN_PROGRESS'].map((status) => (
                <option key={status} value={status}>{formatEnumLabel(t, 'feedbackStatus', status)}</option>
              ))}
            </select>
          </div>

          <div className="table-wrap">
            <table className="data-table feedback-overview-table">
              <thead>
                <tr>
                  <th>{t('tables.feedbacks.title')}</th>
                  <th>{t('tables.common.building')}</th>
                  <th>{t('tables.common.room')}</th>
                  <th>{t('tables.common.resident')}</th>
                  <th>{t('tables.common.status')}</th>
                  <th>{t('tables.common.created')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredFeedbacks.map((feedback) => (
                  <tr
                    className="feedback-overview-row"
                    key={feedback.id}
                    onClick={() => openBuildingFeedbacks(feedback)}
                    onKeyDown={(event) => handleRowKeyDown(event, feedback)}
                    role="link"
                    tabIndex={0}
                  >
                    <td>
                      <strong>{feedback.title}</strong>
                      <span className="table-subtext">{feedback.content}</span>
                    </td>
                    <td>
                      <strong>{feedback.buildingName || t('common.notProvided')}</strong>
                      <span className="table-subtext">{feedback.buildingCode}</span>
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
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredFeedbacks.length === 0 && (
              <div className="empty-state flat-empty-state">{t('feedbackManagement.noUnresolvedFeedbacks')}</div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
