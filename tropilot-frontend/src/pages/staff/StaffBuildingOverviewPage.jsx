import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as maintenanceApi from '../../features/maintenance/api.js';
import * as taskApi from '../../features/maintenance/taskApi.js';
import * as vehicleApi from '../../features/residents/vehicleApi.js';
import * as roomApi from '../../features/rooms/api.js';
import * as expenseApi from '../../features/payments/expenseApi.js';
import * as paymentApi from '../../features/payments/api.js';
import * as utilityReadingApi from '../../features/invoices/utilityReadingApi.js';
import LineIcon from '../../components/common/LineIcon.jsx';
import { CHART_COLORS, ChartPanel, DonutChart, HorizontalBarChart } from '../../components/common/DashboardCharts.jsx';
import { formatDisplayDate } from '../../utils/dateFormat.js';
import { translateInterfaceText } from '../../utils/interfaceTranslations.js';
import { formatNumber } from '../../utils/numberFormat.js';

const emptySummary = {
  rooms: [],
  vehicles: [],
  maintenanceRequests: [],
  expenses: [],
  pendingPayments: [],
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
    NEW: 'Mới',
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
    NEW: 'New',
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

function formatMoney(value, language) {
  const locale = language === 'en' ? 'en-US' : 'vi-VN';
  return `${toNumber(value).toLocaleString(locale, { maximumFractionDigits: 0 })} ${language === 'en' ? 'VND' : 'đ'}`;
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

function getExpenseTitle(item, language) {
  return item?.expenseCode || item?.code || item?.content || copy(language, 'Chi phí vận hành', 'Operation expense');
}

function KpiCard({ helper, icon, label, tone, value }) {
  return (
    <article className={`ops-kpi-card ops-kpi-${tone || 'primary'}`}>
      <span>
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

function ProfilePanel({ building, language, occupancyPercent }) {
  const buildingName = building.name || building.address || building.buildingCode;
  const description = building.description || copy(language, 'Chưa có mô tả.', 'No description yet.');

  return (
    <section className="ops-panel staff-building-profile-panel">
      <PanelTitle icon="building" title={copy(language, 'Hồ sơ tòa nhà', 'Building profile')} />
      <div className="staff-building-profile-body">
        <div className="staff-building-profile-copy">
          <span>{building.buildingCode}</span>
          <strong>{buildingName}</strong>
          <p>{description}</p>
        </div>
        <div className="staff-building-profile-facts">
          <div>
            <span>{copy(language, 'Địa chỉ', 'Address')}</span>
            <strong>{building.address || copy(language, 'Chưa cung cấp', 'Not provided')}</strong>
          </div>
          <div>
            <span>{copy(language, 'Số tầng', 'Floors')}</span>
            <strong>{formatNumber(building.floors || 0)}</strong>
          </div>
          <div>
            <span>{copy(language, 'Tỷ lệ thuê', 'Occupancy')}</span>
            <strong>{formatNumber(occupancyPercent)}%</strong>
          </div>
        </div>
      </div>
    </section>
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

    async function loadSummary() {
      setLoading(true);
      setError('');

      try {
        const [
          roomsResponse,
          vehiclesResponse,
          maintenanceResponse,
          expensesResponse,
          pendingPaymentsResponse,
          utilityOverviewResponse,
          tasksResponse
        ] =
          await Promise.all([
            roomApi.getStaffRooms(buildingFilter),
            vehicleApi.getStaffVehicles(buildingFilter),
            maintenanceApi.getStaffMaintenanceRequests(buildingFilter),
            expenseApi.getStaffExpenses(buildingFilter),
            paymentApi.getPendingPayments(buildingFilter),
            utilityReadingApi.getStaffUtilityReadingOverview(buildingFilter),
            taskApi.getStaffTasks()
          ]);

        if (!active) {
          return;
        }

        setSummary({
          rooms: roomsResponse.data || [],
          vehicles: vehiclesResponse.data || [],
          maintenanceRequests: maintenanceResponse.data || [],
          expenses: expensesResponse.data || [],
          pendingPayments: unwrapResponseData(pendingPaymentsResponse, []),
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
    const pendingExpenses = countByStatus(summary.expenses, ['PENDING']);
    const pendingPaymentConfirmations = summary.pendingPayments.length;
    const roomsNeedingUtilityReading = getUtilityPendingRooms(summary.utilityOverview);
    const totalExpenseAmount = summary.expenses.reduce((total, expense) => total + toNumber(expense.amount), 0);
    const attentionCount =
      openMaintenance + openTasks + overdueTasks + pendingExpenses + pendingPaymentConfirmations + roomsNeedingUtilityReading;
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
      pendingExpenses,
      pendingPaymentConfirmations,
      roomsNeedingUtilityReading,
      totalExpenseAmount
    };
  }, [summary]);

  if (loading) {
    return <div className="empty-state">{copy(language, 'Đang tải tổng quan tòa nhà...', 'Loading building overview...')}</div>;
  }

  const kpis = [
    {
      icon: 'dashboard',
      tone: 'primary',
      label: copy(language, 'Tổng phòng', 'Total rooms'),
      value: formatNumber(summary.rooms.length),
      helper: copy(language, 'Số phòng trong tòa', 'Rooms in this building')
    },
    {
      icon: 'home',
      tone: 'success',
      label: copy(language, 'Phòng đang thuê', 'Occupied rooms'),
      value: formatNumber(dashboardData.occupiedRooms),
      helper: `${formatNumber(dashboardData.occupancyPercent)}% ${copy(language, 'tỷ lệ thuê', 'occupancy')}`
    },
    {
      icon: 'building',
      tone: 'cyan',
      label: copy(language, 'Phòng trống', 'Empty rooms'),
      value: formatNumber(dashboardData.emptyRooms),
      helper: copy(language, 'Có thể cho thuê', 'Ready to rent')
    },
    {
      icon: 'car',
      tone: 'violet',
      label: copy(language, 'Xe hoạt động', 'Active vehicles'),
      value: formatNumber(dashboardData.activeVehicles),
      helper: copy(language, 'Xe đã đăng ký', 'Registered vehicles')
    },
    {
      icon: 'tool',
      tone: 'warning',
      label: copy(language, 'Bảo trì đang mở', 'Open maintenance'),
      value: formatNumber(dashboardData.openMaintenance),
      helper: `${formatNumber(dashboardData.completedMaintenance)} ${copy(language, 'đã hoàn thành', 'completed')}`
    },
    {
      icon: 'activity',
      tone: 'danger',
      label: copy(language, 'Công việc đang mở', 'Open tasks'),
      value: formatNumber(dashboardData.openTasks),
      helper: `${formatNumber(dashboardData.overdueTasks)} ${copy(language, 'quá hạn', 'overdue')}`
    },
    {
      icon: 'activity',
      tone: 'warning',
      label: copy(language, 'Chỉ số cần ghi', 'Readings due'),
      value: formatNumber(dashboardData.roomsNeedingUtilityReading),
      helper: copy(language, 'Phòng chưa ghi tháng này', 'Rooms missing this month')
    },
    {
      icon: 'wallet',
      tone: 'cyan',
      label: copy(language, 'Thanh toán cần kiểm tra', 'Payments to verify'),
      value: formatNumber(dashboardData.pendingPaymentConfirmations),
      helper: copy(language, 'Chờ xác nhận thanh toán', 'Waiting for confirmation')
    },
    {
      icon: 'wallet',
      tone: 'success',
      label: copy(language, 'Chi phí đã tạo', 'Created expenses'),
      value: formatMoney(dashboardData.totalExpenseAmount, language),
      helper: `${formatNumber(summary.expenses.length)} ${copy(language, 'bản ghi', 'records')}`
    },
    {
      icon: 'fileText',
      tone: 'warning',
      label: copy(language, 'Chi phí chờ duyệt', 'Pending expenses'),
      value: formatNumber(dashboardData.pendingExpenses),
      helper: copy(language, 'Cần admin xử lý', 'Awaiting admin review')
    }
  ];

  const roomStatusItems = [
    { key: 'occupied', label: copy(language, 'Đang thuê', 'Occupied'), value: dashboardData.occupiedRooms, color: CHART_COLORS.paid },
    { key: 'empty', label: copy(language, 'Trống', 'Empty'), value: dashboardData.emptyRooms, color: CHART_COLORS.info },
    { key: 'maintenance', label: copy(language, 'Bảo trì', 'Maintenance'), value: dashboardData.maintenanceRooms, color: CHART_COLORS.warning }
  ];

  const workDistributionItems = [
    { key: 'maintenance', label: copy(language, 'Bảo trì đang mở', 'Open maintenance'), value: dashboardData.openMaintenance, color: CHART_COLORS.warning },
    { key: 'tasks', label: copy(language, 'Công việc đang mở', 'Open tasks'), value: dashboardData.openTasks, color: CHART_COLORS.info },
    { key: 'readings', label: copy(language, 'Chỉ số cần ghi', 'Readings due'), value: dashboardData.roomsNeedingUtilityReading, color: CHART_COLORS.violet },
    { key: 'payments', label: copy(language, 'Thanh toán cần kiểm tra', 'Payments to verify'), value: dashboardData.pendingPaymentConfirmations, color: CHART_COLORS.paid },
    { key: 'expenses', label: copy(language, 'Chi phí chờ duyệt', 'Pending expenses'), value: dashboardData.pendingExpenses, color: CHART_COLORS.paid },
    { key: 'overdue', label: copy(language, 'Công việc quá hạn', 'Overdue tasks'), value: dashboardData.overdueTasks, color: CHART_COLORS.unpaid }
  ];

  const workloadRows = [
    { key: 'readings', label: copy(language, 'Chỉ số cần ghi', 'Readings due'), value: dashboardData.roomsNeedingUtilityReading },
    { key: 'payments', label: copy(language, 'Thanh toán cần kiểm tra', 'Payments to verify'), value: dashboardData.pendingPaymentConfirmations },
    { key: 'maintenance', label: copy(language, 'Bảo trì đang mở', 'Open maintenance'), value: dashboardData.openMaintenance },
    { key: 'tasks', label: copy(language, 'Công việc đang mở', 'Open tasks'), value: dashboardData.openTasks },
    { key: 'overdue', label: copy(language, 'Công việc quá hạn', 'Overdue tasks'), value: dashboardData.overdueTasks },
    { key: 'expenses', label: copy(language, 'Chi phí chờ duyệt', 'Pending expenses'), value: dashboardData.pendingExpenses },
    { key: 'vehicles', label: copy(language, 'Xe đang hoạt động', 'Active vehicles'), value: dashboardData.activeVehicles }
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

  const recentExpenses = sortRecent(summary.expenses).slice(0, 4).map((item) => ({
    key: `expense-${item.id || item.expenseCode || item.code}`,
    title: getExpenseTitle(item, language),
    status: item.status,
    meta: [
      getRoomCode(item, copy(language, 'Việc chung tòa nhà', 'Building-wide')),
      item.category || item.type || copy(language, 'Chi phí', 'Expense'),
      formatMoney(item.amount, language)
    ]
  }));

  return (
    <div className="admin-ops-dashboard building-ops-dashboard staff-building-admin-match staff-building-ops-dashboard">
      {error && <div className="alert error-alert">{error}</div>}

      <div className="ops-dashboard-workspace">
        <section className="ops-overview-panel">
          <div className="ops-overview-title">
            <div>
              <span>{copy(language, 'Tổng quan', 'Overview')}</span>
              <h2>{copy(language, 'Vận hành hôm nay', 'Today operations')}</h2>
            </div>
            <strong>
              {formatNumber(dashboardData.attentionCount)} {copy(language, 'mục cần theo dõi', 'items to follow')}
            </strong>
          </div>
          <div className="ops-kpi-grid">
            {kpis.map((item) => (
              <KpiCard key={item.label} {...item} />
            ))}
          </div>
        </section>

        <div className="ops-chart-grid">
          <DonutPanel
            center={formatNumber(summary.rooms.length)}
            icon="building"
            items={roomStatusItems}
            locale={locale}
            title={copy(language, 'Tình trạng phòng', 'Room status')}
          />
          <DonutPanel
            center={formatNumber(dashboardData.attentionCount)}
            icon="activity"
            items={workDistributionItems}
            locale={locale}
            title={copy(language, 'Phân bổ việc cần xử lý', 'Work distribution')}
          />
        </div>

        <div className="ops-chart-grid staff-building-detail-grid">
          <ChartPanel
            className="staff-building-horizontal-chart"
            icon="barChart"
            title={copy(language, 'Khối lượng vận hành', 'Operation workload')}
          >
            <HorizontalBarChart
              emptyText={copy(language, 'Không có dữ liệu vận hành.', 'No operation data.')}
              rows={workloadRows}
              valueFormatter={(value) => formatNumber(value)}
            />
          </ChartPanel>
          <ProfilePanel building={building} language={language} occupancyPercent={dashboardData.occupancyPercent} />
        </div>

        <div className="ops-recent-grid staff-building-recent-grid">
          <RecentListPanel
            emptyText={copy(language, 'Chưa có yêu cầu bảo trì.', 'No maintenance requests yet.')}
            icon="tool"
            language={language}
            rows={recentMaintenance}
            title={copy(language, 'Bảo trì gần đây', 'Recent maintenance')}
          />
          <RecentListPanel
            emptyText={copy(language, 'Chưa có công việc.', 'No tasks yet.')}
            icon="checkShield"
            language={language}
            rows={recentTasks}
            title={copy(language, 'Công việc gần đây', 'Recent tasks')}
          />
        </div>

        <div className="ops-recent-grid ops-recent-grid-single">
          <RecentListPanel
            emptyText={copy(language, 'Chưa có chi phí.', 'No expenses yet.')}
            icon="wallet"
            language={language}
            rows={recentExpenses}
            title={copy(language, 'Chi phí gần đây', 'Recent expenses')}
          />
        </div>
      </div>
    </div>
  );
}
