import { useEffect, useMemo, useState } from 'react';
import * as buildingApi from '../../api/buildingApi.js';
import * as equipmentApi from '../../api/equipmentApi.js';
import * as feedbackApi from '../../api/feedbackApi.js';
import * as invoiceApi from '../../api/invoiceApi.js';
import * as maintenanceApi from '../../api/maintenanceApi.js';
import * as roomApi from '../../api/roomApi.js';
import * as dashboardApi from '../../features/buildings/dashboardApi.js';
import LineIcon from '../../components/common/LineIcon.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { formatDisplayDate, formatDisplayMonth } from '../../utils/dateFormat.js';

const EMPTY_INSIGHTS = {
  buildings: [],
  rooms: [],
  invoices: [],
  feedbacks: [],
  maintenanceRequests: [],
  equipment: [],
  buildingUsers: []
};

const INVOICE_STATUS_LABELS = {
  UNPAID: 'Chưa thanh toán',
  PENDING_CONFIRMATION: 'Chờ xác nhận',
  PAID: 'Đã thanh toán',
  OVERDUE: 'Quá hạn',
  REJECTED: 'Bị từ chối'
};

const FEEDBACK_STATUS_LABELS = {
  PENDING: 'Chờ xử lý',
  IN_PROGRESS: 'Đang xử lý',
  RESOLVED: 'Đã giải quyết',
  REJECTED: 'Đã đóng'
};

const MAINTENANCE_STATUS_LABELS = {
  PENDING: 'Chờ xử lý',
  ASSIGNED: 'Đã phân công',
  IN_PROGRESS: 'Đang xử lý',
  COMPLETED: 'Hoàn thành',
  REJECTED: 'Từ chối'
};

const ROOM_STATUS_LABELS = {
  OCCUPIED: 'Đang thuê',
  EMPTY: 'Trống',
  MAINTENANCE: 'Bảo trì',
  RESERVED: 'Đã giữ chỗ'
};

function unwrap(result, fallback) {
  if (result.status !== 'fulfilled') {
    return fallback;
  }

  return result.value?.data ?? fallback;
}

function toNumber(value) {
  const numberValue = Number(value ?? 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function formatNumber(value, locale = 'vi-VN') {
  return toNumber(value).toLocaleString(locale, { maximumFractionDigits: 2 });
}

function formatCurrency(value, locale = 'vi-VN') {
  return `${formatNumber(value, locale)} đ`;
}

function formatCompactCurrency(value) {
  const amount = toNumber(value);

  if (Math.abs(amount) >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} tỷ`;
  }

  if (Math.abs(amount) >= 1_000_000) {
    return `${(amount / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} tr`;
  }

  return formatCurrency(amount);
}

function getPercent(value, total) {
  const totalValue = toNumber(total);

  if (totalValue <= 0) {
    return 0;
  }

  return Math.round((toNumber(value) / totalValue) * 100);
}

function getDateTime(value) {
  if (!value) {
    return 0;
  }

  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

function sortRecent(items, dateFields = ['createdAt', 'updatedAt']) {
  return [...items].sort((left, right) => {
    const leftTime = Math.max(...dateFields.map((field) => getDateTime(left[field])));
    const rightTime = Math.max(...dateFields.map((field) => getDateTime(right[field])));
    return rightTime - leftTime;
  });
}

function getMonthKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function getLastMonthKeys(count = 6) {
  const current = new Date();

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(current.getFullYear(), current.getMonth() - (count - index - 1), 1);
    return getMonthKey(date);
  });
}

function getInvoiceMonth(invoice) {
  if (invoice.month) {
    return String(invoice.month).slice(0, 7);
  }

  if (invoice.invoiceDate) {
    return String(invoice.invoiceDate).slice(0, 7);
  }

  return '';
}

function getInvoiceCode(invoice) {
  const rawMonth = getInvoiceMonth(invoice);
  const month = rawMonth ? formatDisplayMonth(rawMonth) : 'HD';
  return `HD-${month}-${String(invoice.id || '').padStart(3, '0')}`;
}

function getRoomLabel(record) {
  return record.roomCode || record.roomName || 'Chưa có phòng';
}

function getMaintenanceCost(record) {
  return record.cost ?? record.totalCost ?? record.expenseAmount ?? record.amount ?? 0;
}

function getMaintenanceFinishedDate(record) {
  if (record.status !== 'COMPLETED') {
    return '';
  }

  return record.completedAt || record.finishedAt || record.updatedAt;
}

function getBuildingName(building) {
  return [building.name, building.buildingCode ? `(${building.buildingCode})` : '']
    .filter(Boolean)
    .join(' ');
}

function getStatusClass(prefix, status) {
  return `status-pill ${prefix}-${String(status || '').toLowerCase().replaceAll('_', '-')}`;
}

function createDonutStyle(segments) {
  const total = segments.reduce((sum, segment) => sum + toNumber(segment.value), 0);

  if (total <= 0) {
    return { background: 'conic-gradient(#d7e0e5 0deg 360deg)' };
  }

  let cursor = 0;
  const stops = segments.map((segment) => {
    const start = cursor;
    const size = (toNumber(segment.value) / total) * 360;
    cursor += size;
    return `${segment.color} ${start}deg ${cursor}deg`;
  });

  return { background: `conic-gradient(${stops.join(', ')})` };
}

function formatLongDate(value = new Date()) {
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(value);
}

function buildMonthlyRevenue(invoices) {
  const monthKeys = getLastMonthKeys(6);
  const rows = monthKeys.map((month) => ({ month, paid: 0, unpaid: 0 }));

  invoices.forEach((invoice) => {
    const row = rows.find((item) => item.month === getInvoiceMonth(invoice));

    if (!row) {
      return;
    }

    const amount = toNumber(invoice.totalAmount);

    if (invoice.status === 'PAID') {
      row.paid += amount;
      return;
    }

    row.unpaid += amount;
  });

  return rows;
}

function buildBuildingRows(buildings, rooms, invoices, buildingUsers, locale) {
  return buildings.map((building) => {
    const buildingRooms = rooms.filter((room) => String(room.buildingId) === String(building.id));
    const buildingInvoices = invoices.filter((invoice) => String(invoice.buildingId) === String(building.id));
    const residentCount = buildingUsers.filter((user) => (
      String(user.buildingId) === String(building.id)
      && String(user.role || '').includes('RESIDENT')
      && user.status !== 'LEFT'
    )).length;
    const collected = buildingInvoices
      .filter((invoice) => invoice.status === 'PAID')
      .reduce((sum, invoice) => sum + toNumber(invoice.totalAmount), 0);
    const debt = buildingInvoices
      .filter((invoice) => invoice.status !== 'PAID')
      .reduce((sum, invoice) => sum + toNumber(invoice.totalAmount), 0);

    return {
      id: building.id,
      name: getBuildingName(building),
      rooms: buildingRooms.length,
      residents: residentCount,
      debt: formatCurrency(debt, locale),
      collected: formatCurrency(collected, locale)
    };
  });
}

function KpiCard({ helper, icon, label, tone, value }) {
  return (
    <article className={`ops-kpi-card ops-kpi-${tone}`}>
      <span className="ops-kpi-icon">
        <LineIcon name={icon} />
      </span>
      <strong>{value}</strong>
      <h3>{label}</h3>
      <p>{helper}</p>
    </article>
  );
}

function PanelTitle({ icon, title, action }) {
  return (
    <div className="ops-panel-title">
      <div>
        <LineIcon name={icon} />
        <h2>{title}</h2>
      </div>
      {action}
    </div>
  );
}

function BuildingSummaryTable({ rows }) {
  return (
    <section className="ops-panel ops-building-summary-panel">
      <PanelTitle icon="building" title="Tổng hợp theo khu trọ" />
      <div className="ops-table-scroll">
        <table className="ops-data-table">
          <thead>
            <tr>
              <th>Khu / Dãy</th>
              <th>Phòng</th>
              <th>Người thuê</th>
              <th>Công nợ</th>
              <th>Đã thu</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? rows.map((row) => (
              <tr key={row.id}>
                <td><strong>{row.name}</strong></td>
                <td>{row.rooms}</td>
                <td>{row.residents}</td>
                <td>{row.debt}</td>
                <td>{row.collected}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan="5">Chưa có dữ liệu khu trọ.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function MonthlyRevenueChart({ rows }) {
  const maxValue = Math.max(
    ...rows.flatMap((row) => [row.paid, row.unpaid]),
    1
  );

  return (
    <section className="ops-panel">
      <PanelTitle icon="barChart" title="Doanh thu theo tháng" />
      <div className="ops-chart-legend">
        <span><i className="ops-legend-paid" />Đã thu</span>
        <span><i className="ops-legend-unpaid" />Chưa thu</span>
      </div>
      <div className="ops-revenue-chart">
        {rows.map((row) => (
          <div className="ops-revenue-month" key={row.month}>
            <div className="ops-revenue-bars">
              <span
                className="ops-revenue-bar ops-revenue-paid"
                style={{ height: `${Math.max(3, getPercent(row.paid, maxValue))}%` }}
                title={`Đã thu ${formatCompactCurrency(row.paid)}`}
              />
              <span
                className="ops-revenue-bar ops-revenue-unpaid"
                style={{ height: `${Math.max(3, getPercent(row.unpaid, maxValue))}%` }}
                title={`Chưa thu ${formatCompactCurrency(row.unpaid)}`}
              />
            </div>
            <span>{formatDisplayMonth(row.month)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function DonutPanel({ center, icon, segments, title }) {
  return (
    <section className="ops-panel ops-donut-panel">
      <PanelTitle icon={icon} title={title} />
      <div className="ops-donut-layout">
        <div className="ops-donut" style={createDonutStyle(segments)}>
          <div>{center}</div>
        </div>
        <div className="ops-donut-legend">
          {segments.map((segment) => (
            <span key={segment.label}>
              <i style={{ backgroundColor: segment.color }} />
              {segment.label}
              <strong>{formatNumber(segment.value)}</strong>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function RecentTable({ columns, emptyText, icon, rows, title }) {
  return (
    <section className="ops-panel ops-recent-panel">
      <PanelTitle icon={icon} title={title} />
      <div className="ops-table-scroll">
        <table className="ops-data-table">
          <thead>
            <tr>
              {columns.map((column) => <th key={column.key}>{column.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.length ? rows.map((row) => (
              <tr key={row.id}>
                {columns.map((column) => (
                  <td key={column.key}>{column.render(row)}</td>
                ))}
              </tr>
            )) : (
              <tr>
                <td colSpan={columns.length}>{emptyText}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [insights, setInsights] = useState(EMPTY_INSIGHTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const locale = 'vi-VN';

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setError('');

      const [
        dashboardResult,
        buildingsResult,
        roomsResult,
        feedbacksResult,
        maintenanceResult,
        equipmentResult
      ] = await Promise.allSettled([
        dashboardApi.getAdminDashboard(),
        buildingApi.getAdminBuildings(),
        roomApi.getAdminRooms(),
        feedbackApi.getAdminFeedbacks(),
        maintenanceApi.getAdminMaintenanceRequests(),
        equipmentApi.getAdminEquipment()
      ]);

      const nextDashboard = unwrap(dashboardResult, null);
      const buildings = unwrap(buildingsResult, []);
      const buildingInvoiceResults = await Promise.allSettled(
        buildings.map((building) => invoiceApi.getAdminBuildingInvoices(building.id))
      );
      const buildingUserResults = await Promise.allSettled(
        buildings.map((building) => buildingApi.getAdminBuildingUsers(building.id))
      );

      if (!active) {
        return;
      }

      setDashboard(nextDashboard);
      setInsights({
        buildings,
        rooms: unwrap(roomsResult, []),
        invoices: buildingInvoiceResults.flatMap((result) => unwrap(result, [])),
        feedbacks: unwrap(feedbacksResult, []),
        maintenanceRequests: unwrap(maintenanceResult, []),
        equipment: unwrap(equipmentResult, []),
        buildingUsers: buildingUserResults.flatMap((result) => unwrap(result, []))
      });

      if (!nextDashboard) {
        setError('Không thể tải dữ liệu tổng quan quản trị.');
      }

      setLoading(false);
    }

    loadDashboard().catch((apiError) => {
      if (active) {
        setError(apiError.response?.data?.message || 'Không thể tải dữ liệu tổng quan quản trị.');
        setDashboard(null);
        setInsights(EMPTY_INSIGHTS);
        setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const todayText = formatLongDate(new Date());
  const monthlyRevenue = useMemo(() => buildMonthlyRevenue(insights.invoices), [insights.invoices]);
  const buildingRows = useMemo(
    () => buildBuildingRows(
      insights.buildings,
      insights.rooms,
      insights.invoices,
      insights.buildingUsers,
      locale
    ),
    [insights.buildingUsers, insights.buildings, insights.invoices, insights.rooms]
  );
  const paidInvoiceAmount = insights.invoices
    .filter((invoice) => invoice.status === 'PAID')
    .reduce((sum, invoice) => sum + toNumber(invoice.totalAmount), 0);
  const unpaidInvoiceAmount = insights.invoices
    .filter((invoice) => invoice.status !== 'PAID')
    .reduce((sum, invoice) => sum + toNumber(invoice.totalAmount), 0);
  const paymentPaidValue = paidInvoiceAmount || toNumber(dashboard?.totalIncome);
  const paymentUnpaidValue = unpaidInvoiceAmount || toNumber(dashboard?.unpaidAmount);
  const paymentTotal = paymentPaidValue + paymentUnpaidValue;
  const roomSegments = [
    { label: ROOM_STATUS_LABELS.OCCUPIED, value: dashboard?.occupiedRooms || 0, color: '#10b981' },
    { label: ROOM_STATUS_LABELS.EMPTY, value: dashboard?.emptyRooms || 0, color: '#3b82f6' },
    { label: ROOM_STATUS_LABELS.MAINTENANCE, value: dashboard?.maintenanceRooms || 0, color: '#f59e0b' }
  ];
  const feedbackSegments = [
    { label: FEEDBACK_STATUS_LABELS.PENDING, value: insights.feedbacks.filter((item) => item.status === 'PENDING').length, color: '#f59e0b' },
    { label: FEEDBACK_STATUS_LABELS.IN_PROGRESS, value: insights.feedbacks.filter((item) => item.status === 'IN_PROGRESS').length, color: '#3b82f6' },
    { label: FEEDBACK_STATUS_LABELS.RESOLVED, value: insights.feedbacks.filter((item) => item.status === 'RESOLVED').length, color: '#10b981' },
    { label: FEEDBACK_STATUS_LABELS.REJECTED, value: insights.feedbacks.filter((item) => item.status === 'REJECTED').length, color: '#6b7280' }
  ];
  const paymentSegments = [
    { label: 'Đã thanh toán', value: paymentPaidValue, color: '#10b981' },
    { label: 'Chưa thanh toán', value: paymentUnpaidValue, color: '#ef4444' }
  ];
  const trackedItems = toNumber(dashboard?.unpaidInvoices)
    + toNumber(dashboard?.pendingMaintenanceRequests)
    + toNumber(dashboard?.unresolvedFeedbacks)
    + toNumber(dashboard?.totalPendingRoomMembers);
  const kpis = [
    {
      icon: 'building',
      tone: 'primary',
      value: formatNumber(dashboard?.totalBuildings),
      label: 'Dãy trọ',
      helper: 'Phân khu/phân dãy'
    },
    {
      icon: 'dashboard',
      tone: 'primary',
      value: formatNumber(dashboard?.totalRooms),
      label: 'Tổng phòng',
      helper: 'Số phòng đang quản lý'
    },
    {
      icon: 'users',
      tone: 'violet',
      value: formatNumber(dashboard?.totalOccupants),
      label: 'Người thuê',
      helper: 'Hồ sơ người thuê'
    },
    {
      icon: 'monitor',
      tone: 'cyan',
      value: formatNumber(insights.equipment.length),
      label: 'Thiết bị',
      helper: 'Thiết bị vận hành'
    },
    {
      icon: 'fileText',
      tone: 'danger',
      value: formatNumber(dashboard?.unpaidInvoices),
      label: 'HĐ chưa thanh toán',
      helper: 'Cần theo dõi'
    },
    {
      icon: 'feedback',
      tone: 'warning',
      value: formatNumber(dashboard?.unresolvedFeedbacks),
      label: 'Phản hồi chờ xử lý',
      helper: 'Cần phản hồi'
    },
    {
      icon: 'tool',
      tone: 'success',
      value: formatNumber(dashboard?.pendingMaintenanceRequests),
      label: 'Bảo trì đã lên lịch',
      helper: 'Công việc sắp tới'
    }
  ];
  const recentFeedbacks = sortRecent(insights.feedbacks).slice(0, 5);
  const recentInvoices = sortRecent(insights.invoices, ['createdAt', 'invoiceDate', 'dueDate']).slice(0, 5);
  const recentMaintenance = sortRecent(insights.maintenanceRequests).slice(0, 5);

  return (
    <section className="content-section dashboard-page admin-ops-dashboard">
      <header className="ops-dashboard-topbar">
        <div>
          <span>Hệ thống quản lý phòng trọ</span>
          <h1>Tổng quan</h1>
        </div>
      </header>

      <section className="ops-welcome-card">
        <div>
          <h2>Xin chào, {user?.fullName || 'admin'}!</h2>
          <p>Chào mừng bạn đến với hệ thống quản lý phòng trọ Copilot.</p>
        </div>
        <div className="ops-welcome-actions">
          <span>
            <LineIcon name="calendar" />
            {todayText}
          </span>
        </div>
      </section>

      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">Đang tải dữ liệu tổng quan...</div>
      ) : !dashboard ? (
        <div className="empty-state">Chưa có dữ liệu dashboard.</div>
      ) : (
        <div className="ops-dashboard-workspace">
          <section className="ops-overview-panel">
            <div className="ops-overview-title">
              <div>
                <span>Tổng quan</span>
                <h2>Vận hành hôm nay</h2>
              </div>
              <strong>{formatNumber(trackedItems)} mục cần theo dõi</strong>
            </div>
            <div className="ops-kpi-grid">
              {kpis.map((metric) => (
                <KpiCard key={metric.label} {...metric} />
              ))}
            </div>
          </section>

          <BuildingSummaryTable rows={buildingRows} />

          <div className="ops-chart-grid">
            <MonthlyRevenueChart rows={monthlyRevenue} />
            <DonutPanel
              center={`${getPercent(paymentPaidValue, paymentTotal)}%`}
              icon="chartPulse"
              segments={paymentSegments}
              title="Tỷ lệ thanh toán"
            />
          </div>

          <div className="ops-chart-grid">
            <DonutPanel
              center={formatNumber(dashboard.totalRooms)}
              icon="building"
              segments={roomSegments}
              title="Tình trạng phòng"
            />
            <DonutPanel
              center={formatNumber(insights.feedbacks.length)}
              icon="feedback"
              segments={feedbackSegments}
              title="Phân bố phản hồi"
            />
          </div>

          <div className="ops-recent-grid">
            <RecentTable
              columns={[
                { key: 'title', label: 'Tiêu đề', render: (row) => <strong>{row.title || row.content || 'Không có tiêu đề'}</strong> },
                { key: 'room', label: 'Phòng', render: (row) => getRoomLabel(row) },
                {
                  key: 'status',
                  label: 'Trạng thái',
                  render: (row) => (
                    <span className={getStatusClass('feedback-status', row.status)}>
                      {FEEDBACK_STATUS_LABELS[row.status] || row.status}
                    </span>
                  )
                }
              ]}
              emptyText="Chưa có phản hồi gần đây."
              icon="feedback"
              rows={recentFeedbacks}
              title="Phản hồi gần đây"
            />
            <RecentTable
              columns={[
                { key: 'code', label: 'Mã HĐ', render: (row) => <strong>{getInvoiceCode(row)}</strong> },
                { key: 'amount', label: 'Tổng tiền', render: (row) => formatCurrency(row.totalAmount, locale) },
                { key: 'dueDate', label: 'Hạn', render: (row) => formatDisplayDate(row.dueDate, 'Chưa đặt') },
                {
                  key: 'status',
                  label: 'Trạng thái',
                  render: (row) => (
                    <span className={getStatusClass('invoice-status', row.status)}>
                      {INVOICE_STATUS_LABELS[row.status] || row.status}
                    </span>
                  )
                }
              ]}
              emptyText="Chưa có hóa đơn gần đây."
              icon="fileText"
              rows={recentInvoices}
              title="Hóa đơn gần đây"
            />
          </div>

          <div className="ops-recent-grid ops-recent-grid-single">
            <RecentTable
              columns={[
                { key: 'title', label: 'Mô tả', render: (row) => <strong>{row.title || row.content || 'Không có mô tả'}</strong> },
                { key: 'equipment', label: 'Thiết bị', render: (row) => row.equipmentName || row.equipmentCode || 'Không gắn thiết bị' },
                { key: 'startDate', label: 'Ngày bắt đầu', render: (row) => formatDisplayDate(row.createdAt, 'Chưa đặt') },
                { key: 'finishDate', label: 'Ngày hoàn thành', render: (row) => formatDisplayDate(getMaintenanceFinishedDate(row), MAINTENANCE_STATUS_LABELS[row.status] || 'Đang theo dõi') },
                { key: 'cost', label: 'Chi phí', render: (row) => formatCurrency(getMaintenanceCost(row), locale) }
              ]}
              emptyText="Chưa có lịch bảo trì gần đây."
              icon="tool"
              rows={recentMaintenance}
              title="Lịch bảo trì gần đây"
            />
          </div>
        </div>
      )}
    </section>
  );
}
