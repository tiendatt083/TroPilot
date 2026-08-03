import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as maintenanceApi from '../../api/maintenanceApi.js';
import * as taskApi from '../../api/taskApi.js';
import * as vehicleApi from '../../api/vehicleApi.js';
import * as roomApi from '../../api/roomApi.js';
import * as utilityReadingApi from '../../api/utilityReadingApi.js';
import LineIcon from '../../components/common/LineIcon.jsx';
import { CHART_COLORS, ChartPanel, DonutChart } from '../../components/common/DashboardCharts.jsx';
import { formatDisplayDate } from '../../utils/dateFormat.js';
import { translateInterfaceText } from '../../utils/interfaceTranslations.js';
import { formatNumber } from '../../utils/numberFormat.js';

const emptySummary = {
  rooms: [],
  vehicles: [],
  maintenanceRequests: [],
  utilityOverview: null,
  tasks: []
};

const STATUS_LABELS = {
  vi: {
    ACTIVE: 'Hoạt động',
    ASSIGNED: 'Đã phân công',
    AVAILABLE: 'Trống',
    CANCELLED: 'Đã hủy',
    COMPLETED: 'Đã hoàn thành',
    EMPTY: 'Trống',
    IN_PROGRESS: 'Đang xử lý',
    NEW: 'Đã phân công',
    OCCUPIED: 'Đã thuê',
    OVERDUE: 'Quá hạn',
    PENDING: 'Đang chờ',
    REJECTED: 'Từ chối',
    RESOLVED: 'Đã giải quyết'
  },
  en: {
    ACTIVE: 'Active',
    ASSIGNED: 'Assigned',
    AVAILABLE: 'Empty',
    CANCELLED: 'Cancelled',
    COMPLETED: 'Completed',
    EMPTY: 'Empty',
    IN_PROGRESS: 'In progress',
    NEW: 'Assigned',
    OCCUPIED: 'Occupied',
    OVERDUE: 'Overdue',
    PENDING: 'Pending',
    REJECTED: 'Rejected',
    RESOLVED: 'Resolved'
  }
};

function matchesBuilding(item, building) {
  if (!item || !building) {
    return false;
  }

  return (
    String(item.buildingId || item.roomBuildingId || '') === String(building.id) ||
    item.buildingCode === building.buildingCode
  );
}

function getLanguageMode(language) {
  return String(language || '').toLowerCase().startsWith('en') ? 'en' : 'vi';
}

function copy(language, viText, enText) {
  return language === 'en' ? enText : viText;
}

function toNumber(value) {
  const numericValue = Number(value ?? 0);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function countByStatus(items, statuses) {
  const statusSet = new Set(statuses);
  return items.filter((item) => statusSet.has(item.status)).length;
}

function getPercent(value, total) {
  if (!total) {
    return 0;
  }

  return Math.round((toNumber(value) / toNumber(total)) * 100);
}

function unwrapResponseData(response, fallback) {
  return response?.data ?? response ?? fallback;
}

function getCurrentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getUtilityPendingRooms(overview) {
  return toNumber(
    overview?.pendingRooms ??
      overview?.missingRooms ??
      overview?.unrecordedRooms ??
      overview?.roomsNeedingReading ??
      0
  );
}

function getDateValue(item) {
  return item?.createdAt || item?.updatedAt || item?.dueDate || item?.deadline || '';
}

function sortRecent(items) {
  return [...items].sort((left, right) => new Date(getDateValue(right)) - new Date(getDateValue(left)));
}

function getStatusLabel(status, language) {
  return STATUS_LABELS[language]?.[status] || status || copy(language, 'Chưa cập nhật', 'Not updated');
}

function getStatusClass(status) {
  const normalized = String(status || '').toLowerCase().replaceAll('_', '-');
  return `status-pill status-${normalized || 'neutral'}`;
}

function getRoomCode(item, fallback = '-') {
  return item?.roomCode || item?.roomName || item?.room?.roomCode || fallback;
}

function getMaintenanceTitle(item, language) {
  return item?.title || item?.subject || item?.content || copy(language, 'Yêu cầu bảo trì', 'Maintenance request');
}

function getTaskTitle(item, language) {
  return item?.title || item?.description || copy(language, 'Công việc vận hành', 'Operation task');
}

function KpiCard({ helper, icon, label, tone, value }) {
  return (
    <article className={`ops-kpi-card ops-kpi-${tone || 'primary'}`}>
      <span className="ops-kpi-icon">
        <LineIcon name={icon} />
      </span>
      <div>
        <strong>{value}</strong>
        <p>{label}</p>
        <small>{helper}</small>
      </div>
    </article>
  );
}

function PanelTitle({ icon, subtitle, title }) {
  return (
    <div className="ops-panel-title">
      <div>
        {icon && (
          <span>
            <LineIcon name={icon} />
          </span>
        )}
        <h2>{title}</h2>
      </div>
      {subtitle && <p>{subtitle}</p>}
    </div>
  );
}

function DonutPanel({ center, icon, items, locale, title }) {
  return (
    <ChartPanel icon={icon} title={title}>
      <DonutChart center={center} items={items} locale={locale} />
    </ChartPanel>
  );
}

function RecentListPanel({ emptyText, icon, language, rows, title }) {
  return (
    <section className="ops-panel staff-building-recent-panel">
      <PanelTitle icon={icon} title={title} />
      {rows.length ? (
        <div className="staff-building-recent-list">
          {rows.map((row) => (
            <article className="staff-building-recent-row" key={row.key}>
              <div className="staff-building-recent-copy">
                <strong>{row.title}</strong>
                <div className="staff-building-recent-meta">
                  {row.meta.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              </div>
              <span className={getStatusClass(row.status)}>{getStatusLabel(row.status, language)}</span>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state flat-empty-state staff-building-empty-panel">{emptyText}</div>
      )}
    </section>
  );
}

/** Trang tổng quan vận hành của một tòa nhà dành cho nhân viên. */
export default function StaffBuildingOverviewPage() {
  const { i18n } = useTranslation();
  const language = getLanguageMode(i18n.resolvedLanguage || i18n.language);
  const locale = language === 'en' ? 'en-US' : 'vi-VN';
  const { building } = useOutletContext();
  const [summary, setSummary] = useState(emptySummary);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const buildingFilter = { buildingId: building.id };
    const utilityOverviewFilter = { ...buildingFilter, month: getCurrentMonthValue() };

    async function loadSummary() {
      setLoading(true);
      setError('');

      try {
        const [
          roomsResponse,
          vehiclesResponse,
          maintenanceResponse,
          utilityOverviewResponse,
          tasksResponse
        ] =
          await Promise.all([
            roomApi.getStaffRooms(buildingFilter),
            vehicleApi.getStaffVehicles(buildingFilter),
            maintenanceApi.getStaffMaintenanceRequests(buildingFilter),
            utilityReadingApi.getStaffUtilityReadingOverview(utilityOverviewFilter),
            taskApi.getStaffTasks()
          ]);

        if (!active) {
          return;
        }

        setSummary({
          rooms: roomsResponse.data || [],
          vehicles: vehiclesResponse.data || [],
          maintenanceRequests: maintenanceResponse.data || [],
          utilityOverview: unwrapResponseData(utilityOverviewResponse, null),
          tasks: (tasksResponse.data || []).filter((task) => matchesBuilding(task, building))
        });
      } catch (apiError) {
        if (active) {
          setError(translateInterfaceText(apiError.response?.data?.message || 'Building summary could not be loaded'));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadSummary();

    return () => {
      active = false;
    };
  }, [building]);

  const dashboardData = useMemo(() => {
    const activeVehicles = countByStatus(summary.vehicles, ['ACTIVE']);
    const occupiedRooms = countByStatus(summary.rooms, ['OCCUPIED', 'RENTED']);
    const emptyRooms = countByStatus(summary.rooms, ['EMPTY', 'AVAILABLE', 'VACANT']);
    const maintenanceRooms = countByStatus(summary.rooms, ['MAINTENANCE']);
    const openMaintenance = countByStatus(summary.maintenanceRequests, ['PENDING', 'ASSIGNED', 'IN_PROGRESS']);
    const completedMaintenance = countByStatus(summary.maintenanceRequests, ['COMPLETED']);
    const openTasks = countByStatus(summary.tasks, ['NEW', 'IN_PROGRESS', 'OVERDUE']);
    const overdueTasks = countByStatus(summary.tasks, ['OVERDUE']);
    const roomsNeedingUtilityReading = getUtilityPendingRooms(summary.utilityOverview);
    const attentionCount = openMaintenance + overdueTasks + roomsNeedingUtilityReading;
    const occupancyPercent = getPercent(occupiedRooms, summary.rooms.length);

    return {
      activeVehicles,
      attentionCount,
      completedMaintenance,
      emptyRooms,
      maintenanceRooms,
      occupiedRooms,
      occupancyPercent,
      openMaintenance,
      openTasks,
      overdueTasks,
      roomsNeedingUtilityReading
    };
  }, [summary]);

  if (loading) {
    return <div className="empty-state">{copy(language, 'Đang tải tổng quan tòa nhà...', 'Loading building overview...')}</div>;
  }

  const todayKpis = [
    {
      icon: 'activity',
      tone: 'cyan',
      label: copy(language, 'Tỷ lệ thuê', 'Occupancy rate'),
      value: `${formatNumber(dashboardData.occupancyPercent)}%`,
      helper: copy(language, 'Tình trạng lấp đầy', 'Current occupancy')
    },
    {
      icon: 'car',
      tone: 'violet',
      label: copy(language, 'Xe hoạt động', 'Active vehicles'),
      value: formatNumber(dashboardData.activeVehicles),
      helper: copy(language, 'Xe đã đăng ký', 'Registered vehicles')
    }
  ];

  const roomStatusItems = [
    { key: 'occupied', label: copy(language, 'Đang thuê', 'Occupied'), value: dashboardData.occupiedRooms, color: CHART_COLORS.paid },
    { key: 'empty', label: copy(language, 'Trống', 'Empty'), value: dashboardData.emptyRooms, color: CHART_COLORS.info },
    { key: 'maintenance', label: copy(language, 'Bảo trì', 'Maintenance'), value: dashboardData.maintenanceRooms, color: CHART_COLORS.warning }
  ];

  const workDistributionItems = [
    {
      key: 'maintenance',
      label: copy(language, 'Bảo trì đang mở', 'Open maintenance'),
      value: dashboardData.openMaintenance,
      color: CHART_COLORS.warning,
      to: `/staff/buildings/${building.id}/maintenance`
    },
    {
      key: 'readings',
      label: copy(language, 'Chỉ số điện nước cần ghi', 'Readings due'),
      value: dashboardData.roomsNeedingUtilityReading,
      color: CHART_COLORS.violet,
      to: `/staff/buildings/${building.id}/utility-readings`
    },
    {
      key: 'overdue',
      label: copy(language, 'Công việc quá hạn', 'Overdue tasks'),
      value: dashboardData.overdueTasks,
      color: CHART_COLORS.unpaid,
      to: `/staff/buildings/${building.id}/tasks`
    }
  ];

  const recentMaintenance = sortRecent(summary.maintenanceRequests).slice(0, 4).map((item) => ({
    key: `maintenance-${item.id || item.code || item.title}`,
    title: getMaintenanceTitle(item, language),
    status: item.status,
    meta: [
      getRoomCode(item),
      item.requesterName || item.residentName || copy(language, 'Chưa rõ người yêu cầu', 'Unknown requester'),
      formatDisplayDate(getDateValue(item), '-')
    ]
  }));

  const recentTasks = sortRecent(summary.tasks).slice(0, 4).map((item) => ({
    key: `task-${item.id || item.code || item.title}`,
    title: getTaskTitle(item, language),
    status: item.status,
    meta: [
      getRoomCode(item),
      item.type ? getStatusLabel(item.type, language) : copy(language, 'Công việc', 'Task'),
      item.dueDate || item.deadline
        ? `${copy(language, 'Hạn', 'Due')}: ${formatDisplayDate(item.dueDate || item.deadline, '-')}`
        : copy(language, 'Chưa có hạn', 'No due date')
    ]
  }));

  return (
    <div className="admin-ops-dashboard building-ops-dashboard staff-building-admin-match staff-building-ops-dashboard">
      {error && <div className="alert error-alert">{error}</div>}

      <div className="ops-dashboard-workspace">
        <section className="ops-panel staff-building-today-panel">
          <PanelTitle
            icon="building"
            subtitle={copy(language, 'Biểu đồ phòng và các chỉ số vận hành chính.', 'Room chart and key operation metrics.')}
            title={copy(language, 'Vận hành hôm nay', 'Today operations')}
          />
          <div className="staff-building-today-layout">
            <div className="staff-building-room-status-card">
              <h3>{copy(language, 'Tình trạng phòng', 'Room status')}</h3>
              <DonutChart center={formatNumber(summary.rooms.length)} items={roomStatusItems} locale={locale} />
            </div>
            <div className="staff-building-today-kpis">
              {todayKpis.map((item) => (
                <KpiCard key={item.label} {...item} />
              ))}
            </div>
          </div>
        </section>

        <div className="ops-chart-grid staff-building-action-grid">
          <DonutPanel
            center={formatNumber(dashboardData.attentionCount)}
            icon="activity"
            items={workDistributionItems}
            locale={locale}
            title={copy(language, 'Phân bổ việc cần xử lý', 'Work distribution')}
          />
          <RecentListPanel
            emptyText={copy(language, 'Chưa có công việc.', 'No tasks yet.')}
            icon="checkShield"
            language={language}
            rows={recentTasks}
            title={copy(language, 'Công việc gần đây', 'Recent tasks')}
          />
        </div>

        <div className="ops-recent-grid staff-building-recent-grid">
          <RecentListPanel
            emptyText={copy(language, 'Chưa có yêu cầu bảo trì.', 'No maintenance requests yet.')}
            icon="tool"
            language={language}
            rows={recentMaintenance}
            title={copy(language, 'Bảo trì gần đây', 'Recent maintenance')}
          />
        </div>
      </div>
    </div>
  );
}
