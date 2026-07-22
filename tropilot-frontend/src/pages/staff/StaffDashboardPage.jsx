import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as dashboardApi from '../../api/dashboardApi.js';
import * as maintenanceApi from '../../api/maintenanceApi.js';
import * as taskApi from '../../api/taskApi.js';
import LineIcon from '../../components/common/LineIcon.jsx';
import { CHART_COLORS, ChartPanel, DonutChart } from '../../components/common/DashboardCharts.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import { formatDate, formatEnumLabel } from '../../utils/i18nFormat.js';
import { getMaintenanceStatusClass } from '../../utils/maintenanceOptions.js';
import { formatRoomLabel } from '../../utils/roomDisplay.js';
import { getTaskStatusClass } from '../../utils/taskOptions.js';

function formatNumber(value) {
  const numberValue = Number(value ?? 0);
  return Number.isFinite(numberValue)
    ? numberValue.toLocaleString('en-US', { maximumFractionDigits: 2 })
    : value;
}

function toNumber(value) {
  const numberValue = Number(value ?? 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function getRecentDateValue(item) {
  return item?.createdAt || item?.updatedAt || item?.deadline || item?.dueDate || '';
}

function sortRecent(items) {
  return [...items].sort((left, right) => new Date(getRecentDateValue(right)) - new Date(getRecentDateValue(left)));
}

function getListPayload(response) {
  if (Array.isArray(response)) {
    return response;
  }

  return Array.isArray(response?.data) ? response.data : [];
}

function taskRoomText(task, t) {
  if (!task.roomCode) {
    return task.buildingId || task.buildingCode
      ? t('forms.task.generalBuildingTask')
      : t('forms.task.noRoomLinked');
  }

  return formatRoomLabel(task);
}

function maintenanceRoomText(request, t) {
  if (request.roomCode || request.roomName) {
    return formatRoomLabel(request);
  }

  return request.buildingCode || request.buildingName || t('forms.task.generalBuildingTask');
}

function maintenanceTitleText(request, t) {
  return request.title
    || request.equipmentName
    || request.equipmentCode
    || request.content
    || t('dashboard.ops.fallback.noDescription');
}

export default function StaffDashboardPage() {
  const { t, i18n } = useTranslation();
  const [dashboard, setDashboard] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [recentMaintenance, setRecentMaintenance] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const locale = String(i18n.resolvedLanguage || i18n.language).startsWith('en') ? 'en-US' : 'vi-VN';

  useEffect(() => {
    let active = true;

    Promise.all([
      dashboardApi.getStaffDashboard(),
      taskApi.getStaffTasks(),
      maintenanceApi.getStaffMaintenanceRequests()
    ])
      .then(([dashboardResponse, tasksResponse, maintenanceResponse]) => {
        if (active) {
          setDashboard(dashboardResponse.data);
          setRecentTasks(sortRecent(getListPayload(tasksResponse)).slice(0, 5));
          setRecentMaintenance(sortRecent(getListPayload(maintenanceResponse)).slice(0, 5));
        }
      })
      .catch((apiError) => {
        if (active) {
          setError(apiError.response?.data?.message || t('dashboard.staff.loadError'));
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
  }, [t]);

  const totalRooms = toNumber(dashboard?.totalRooms);
  const roomsNeedReading = toNumber(dashboard?.roomsNeedingUtilityReading);
  const roomsRecorded = Math.max(totalRooms - roomsNeedReading, 0);
  const overdueTasks = toNumber(dashboard?.overdueTasks);
  const assignedTasks = toNumber(dashboard?.assignedTasks);
  const activeAssignedTasks = Math.max(assignedTasks - overdueTasks, 0);
  const overviewCharts = dashboard
    ? [
        {
          icon: 'activity',
          title: t('dashboard.staff.charts.utilityReadings'),
          value: formatNumber(totalRooms),
          items: [
            {
              label: t('dashboard.staff.charts.recorded'),
              value: roomsRecorded,
              color: CHART_COLORS.paid
            },
            {
              label: t('dashboard.staff.charts.needReading'),
              value: roomsNeedReading,
              color: CHART_COLORS.violet
            }
          ]
        },
        {
          icon: 'checkShield',
          title: t('dashboard.staff.charts.workload'),
          value: formatNumber(assignedTasks),
          items: [
            {
              label: t('dashboard.staff.charts.assigned'),
              value: activeAssignedTasks,
              color: CHART_COLORS.info
            },
            {
              label: t('dashboard.staff.charts.overdue'),
              value: overdueTasks,
              color: CHART_COLORS.unpaid
            }
          ]
        }
      ]
    : [];
  const priorityItems = dashboard
    ? [
        {
          icon: 'clock',
          label: t('dashboard.staff.metrics.overdueTasks'),
          value: formatNumber(dashboard.overdueTasks),
          helper: t('dashboard.staff.quick.taskHelper'),
          to: '/staff/tasks',
          tone: 'danger'
        },
        {
          icon: 'activity',
          label: t('dashboard.staff.metrics.utilityReadingsDue'),
          value: formatNumber(dashboard.roomsNeedingUtilityReading),
          helper: t('dashboard.staff.quick.utilityHelper'),
          to: '/staff/buildings',
          tone: 'warning'
        },
        {
          icon: 'tool',
          label: t('dashboard.staff.metrics.activeMaintenanceRequests'),
          value: formatNumber(dashboard.activeMaintenanceRequests),
          helper: t('dashboard.staff.quick.maintenanceHelper'),
          to: '/staff/maintenance',
          tone: 'primary'
        }
      ]
    : [];

  return (
    <section className="content-section dashboard-page staff-dashboard-page">
      <div className="dashboard-hero staff-dashboard-hero">
        <div className="staff-dashboard-hero-copy">
          <PageHeader eyebrow={t('dashboard.staff.eyebrow')} title={t('dashboard.staff.title')} />
          <p>{t('dashboard.staff.heroDescription')}</p>
        </div>
      </div>

      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state staff-dashboard-loading">{t('dashboard.staff.loading')}</div>
      ) : (
        <div className="staff-dashboard-workspace">
          <section className="staff-priority-panel">
            <div className="dashboard-section-header">
              <div>
                <h2>{t('dashboard.staff.sections.priorityTitle')}</h2>
                <p>{t('dashboard.staff.sections.priorityDescription')}</p>
              </div>
            </div>
            <div className="staff-priority-grid">
              {priorityItems.map((item) => (
                <Link className={`staff-priority-card staff-priority-card-${item.tone}`} key={item.label} to={item.to}>
                  <span className="staff-priority-icon">
                    <LineIcon name={item.icon} />
                  </span>
                  <div>
                    <span>{item.label}</span>
                    <small>{item.helper}</small>
                  </div>
                  <strong className="staff-priority-value">{item.value}</strong>
                </Link>
              ))}
            </div>
          </section>

          <div className="staff-dashboard-grid">
            <section className="staff-workload-panel">
              <div className="dashboard-section-header">
                <div>
                  <h2>{t('dashboard.staff.sections.operationOverviewTitle')}</h2>
                  <p>{t('dashboard.staff.sections.operationOverviewDescription')}</p>
                </div>
              </div>
              <div className="staff-operations-chart-grid">
                {overviewCharts.map((chart) => (
                  <ChartPanel className="staff-dashboard-chart-panel" icon={chart.icon} key={chart.title} title={chart.title}>
                    <DonutChart center={chart.value} items={chart.items} locale={locale} />
                  </ChartPanel>
                ))}
              </div>
            </section>
          </div>

          <div className="staff-dashboard-table-grid">
            <section className="staff-dashboard-table-panel">
              <div className="staff-dashboard-table-title">
                <span>
                  <LineIcon name="checkShield" />
                </span>
                <h2>Công việc gần đây</h2>
              </div>
              <div className="staff-dashboard-table-wrap">
                <table className="staff-dashboard-compact-table">
                  <thead>
                    <tr>
                      <th>Công việc</th>
                      <th>Phòng</th>
                      <th>Hạn</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTasks.map((task) => (
                      <tr key={task.id}>
                        <td>
                          <div className="staff-dashboard-table-primary">
                            <Link to={`/staff/tasks/${task.id}`}>{task.title}</Link>
                            <span>{formatEnumLabel(t, 'taskType', task.taskType)}</span>
                          </div>
                        </td>
                        <td>{taskRoomText(task, t)}</td>
                        <td>{formatDate(task.deadline, t)}</td>
                        <td>
                          <span className={getTaskStatusClass(task.status)}>
                            {formatEnumLabel(t, 'taskStatus', task.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!recentTasks.length && <div className="empty-state flat-empty-state">Chưa có công việc.</div>}
              </div>
            </section>

            <section className="staff-dashboard-table-panel">
              <div className="staff-dashboard-table-title">
                <span>
                  <LineIcon name="tool" />
                </span>
                <h2>Bảo trì gần đây</h2>
              </div>
              <div className="staff-dashboard-table-wrap">
                <table className="staff-dashboard-compact-table staff-dashboard-maintenance-table">
                  <thead>
                    <tr>
                      <th>Bảo trì</th>
                      <th>Phòng</th>
                      <th>Ngày tạo</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentMaintenance.map((request) => (
                      <tr key={request.id}>
                        <td>
                          <div className="staff-dashboard-table-primary">
                            <Link to="/staff/maintenance">{maintenanceTitleText(request, t)}</Link>
                            <span>{request.requestedByName || request.residentHeadName || request.equipmentName || t('common.notProvided')}</span>
                          </div>
                        </td>
                        <td>{maintenanceRoomText(request, t)}</td>
                        <td>{formatDate(request.createdAt || request.updatedAt, t)}</td>
                        <td>
                          <span className={getMaintenanceStatusClass(request.status)}>
                            {formatEnumLabel(t, 'maintenanceStatus', request.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!recentMaintenance.length && <div className="empty-state flat-empty-state">Chưa có yêu cầu bảo trì.</div>}
              </div>
            </section>
          </div>
        </div>
      )}
    </section>
  );
}
