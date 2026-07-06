import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as contractApi from '../../features/contracts/api.js';
import * as invoiceApi from '../../features/invoices/api.js';
import * as maintenanceApi from '../../features/maintenance/api.js';
import * as taskApi from '../../features/maintenance/taskApi.js';
import * as feedbackApi from '../../features/notifications/feedbackApi.js';
import * as notificationApi from '../../features/notifications/api.js';
import * as paymentApi from '../../features/payments/api.js';
import * as memberApi from '../../features/residents/api.js';
import * as vehicleApi from '../../features/residents/vehicleApi.js';
import * as roomApi from '../../features/rooms/api.js';
import * as expenseApi from '../../features/payments/expenseApi.js';
import LineIcon from '../../components/common/LineIcon.jsx';
import { formatDisplayDate, formatDisplayMonth } from '../../utils/dateFormat.js';

const EMPTY_BUILDING_OPERATIONS = {
  rooms: [],
  contracts: [],
  invoices: [],
  vehicles: [],
  pendingPayments: [],
  receipts: [],
  members: [],
  maintenanceRequests: [],
  expenses: [],
  tasks: [],
  feedbacks: [],
  invoiceComplaints: [],
  notificationCount: 0
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

function sumAmounts(items, amountKey) {
  return items.reduce((total, item) => total + toNumber(item[amountKey]), 0);
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

function SummaryTable({ rows }) {
  return (
    <section className="ops-panel">
      <PanelTitle icon="activity" title="Tổng hợp vận hành" />
      <div className="ops-table-scroll">
        <table className="ops-data-table">
          <thead>
            <tr>
              <th>Nhóm</th>
              <th>Chỉ số chính</th>
              <th>Số lượng</th>
              <th>Theo dõi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.group}>
                <td><strong>{row.group}</strong></td>
                <td>{row.primary}</td>
                <td>{row.secondary}</td>
                <td>{row.followUp}</td>
              </tr>
            ))}
          </tbody>
        </table>
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

export default function AdminBuildingDetailPage() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const [operations, setOperations] = useState(EMPTY_BUILDING_OPERATIONS);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';

  useEffect(() => {
    let active = true;
    const buildingId = Number(id);

    async function loadBuildingWorkspace() {
      setLoading(true);
      setError('');

      try {
        const [
          roomsResponse,
          contractsResponse,
          invoicesResponse,
          vehiclesResponse,
          paymentsResponse,
          receiptsResponse,
          membersResponse,
          maintenanceResponse,
          expensesResponse,
          tasksResponse,
          feedbacksResponse,
          invoiceComplaintsResponse,
          notificationsResponse
        ] = await Promise.all([
          roomApi.getAdminRooms({ buildingId }),
          contractApi.getAdminContracts({ buildingId }),
          invoiceApi.getAdminBuildingInvoices(buildingId),
          vehicleApi.getAdminVehicles({ buildingId }),
          paymentApi.getPendingPayments({ buildingId }),
          paymentApi.getAdminReceipts({ buildingId }),
          memberApi.getAdminBuildingMembers({ buildingId }),
          maintenanceApi.getAdminMaintenanceRequests({ buildingId }),
          expenseApi.getAdminExpenses({ buildingId }),
          taskApi.getAdminTasks({ buildingId }),
          feedbackApi.getAdminFeedbacks({ buildingId }),
          feedbackApi.getAdminInvoiceComplaints({ buildingId }),
          notificationApi.getAdminNotifications({ buildingId })
        ]);

        if (!active) {
          return;
        }

        setOperations({
          rooms: roomsResponse.data || [],
          contracts: contractsResponse.data || [],
          invoices: invoicesResponse.data || [],
          vehicles: vehiclesResponse.data || [],
          pendingPayments: paymentsResponse.data || [],
          receipts: receiptsResponse.data || [],
          members: membersResponse.data || [],
          maintenanceRequests: maintenanceResponse.data || [],
          expenses: expensesResponse.data || [],
          tasks: tasksResponse.data || [],
          feedbacks: feedbacksResponse.data || [],
          invoiceComplaints: invoiceComplaintsResponse.data || [],
          notificationCount: notificationsResponse.data?.length || 0
        });
      } catch (apiError) {
        if (active) {
          setError(apiError.response?.data?.message || t('buildingOverview.loadError'));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadBuildingWorkspace();

    return () => {
      active = false;
    };
  }, [id, t]);

  const {
    activeVehicles,
    approvedMembers,
    attentionSegments,
    emptyRooms,
    financeRows,
    kpis,
    maintenanceRooms,
    monthlyRevenue,
    openMaintenanceRequests,
    openTasks,
    outstandingAmount,
    paidInvoiceAmount,
    paymentSegments,
    paymentTotal,
    pendingMembers,
    recentFeedbacks,
    recentInvoices,
    recentMaintenance,
    roomSegments,
    summaryRows,
    totalOccupants,
    totalReceiptAmount,
    trackedItems,
    unpaidInvoiceRecords,
    unpaidInvoices,
    unresolvedFeedbacks,
    validReceipts
  } = useMemo(() => {
    const occupied = operations.rooms.filter((room) => room.status === 'OCCUPIED').length;
    const empty = operations.rooms.filter((room) => room.status === 'EMPTY').length;
    const maintenance = operations.rooms.filter((room) => room.status === 'MAINTENANCE').length;
    const vehicles = operations.vehicles.filter((vehicle) => vehicle.status === 'ACTIVE').length;
    const approved = operations.members.filter((member) => member.status === 'APPROVED').length;
    const pending = operations.members.filter((member) => member.status === 'PENDING').length;
    const occupants = operations.contracts.length + approved;
    const unpaidRecords = operations.invoices.filter((invoice) => invoice.status !== 'PAID');
    const unpaidCount = unpaidRecords.length;
    const receipts = operations.receipts.filter((receipt) => receipt.status === 'VALID');
    const openMaintenance = operations.maintenanceRequests.filter((request) =>
      ['PENDING', 'ASSIGNED', 'IN_PROGRESS'].includes(request.status)
    ).length;
    const tasksOpen = operations.tasks.filter((task) => ['NEW', 'IN_PROGRESS', 'OVERDUE'].includes(task.status)).length;
    const feedbacksOpen = operations.feedbacks.filter((feedback) =>
      ['PENDING', 'IN_PROGRESS'].includes(feedback.status)
    ).length;
    const expenses = operations.expenses.filter((expense) => expense.status === 'VALID');
    const invoiceAmount = sumAmounts(operations.invoices, 'totalAmount');
    const paidAmount = operations.invoices
      .filter((invoice) => invoice.status === 'PAID')
      .reduce((sum, invoice) => sum + toNumber(invoice.totalAmount), 0);
    const receiptAmount = sumAmounts(receipts, 'amount');
    const expenseAmount = sumAmounts(expenses, 'amount');
    const debtAmount = sumAmounts(unpaidRecords, 'totalAmount');
    const occupancyPercent = getPercent(occupied, operations.rooms.length);
    const attentionCount = pending
      + operations.pendingPayments.length
      + openMaintenance
      + tasksOpen
      + feedbacksOpen
      + operations.invoiceComplaints.length;
    const paymentPaid = paidAmount || receiptAmount;
    const paymentUnpaid = debtAmount;
    const paymentTotalValue = paymentPaid + paymentUnpaid;

    return {
      activeVehicles: vehicles,
      approvedMembers: approved,
      emptyRooms: empty,
      maintenanceRooms: maintenance,
      monthlyRevenue: buildMonthlyRevenue(operations.invoices),
      openMaintenanceRequests: openMaintenance,
      openTasks: tasksOpen,
      outstandingAmount: debtAmount,
      paidInvoiceAmount: paymentPaid,
      paymentTotal: paymentTotalValue,
      pendingMembers: pending,
      recentFeedbacks: sortRecent(operations.feedbacks).slice(0, 5),
      recentInvoices: sortRecent(operations.invoices, ['createdAt', 'invoiceDate', 'dueDate']).slice(0, 5),
      recentMaintenance: sortRecent(operations.maintenanceRequests).slice(0, 5),
      totalOccupants: occupants,
      totalReceiptAmount: receiptAmount,
      trackedItems: attentionCount,
      unpaidInvoiceRecords: unpaidRecords,
      unpaidInvoices: unpaidCount,
      unresolvedFeedbacks: feedbacksOpen,
      validReceipts: receipts,
      roomSegments: [
        { label: 'Đang thuê', value: occupied, color: '#10b981' },
        { label: 'Trống', value: empty, color: '#3b82f6' },
        { label: 'Bảo trì', value: maintenance, color: '#f59e0b' }
      ],
      attentionSegments: [
        { label: 'Thành viên chờ duyệt', value: pending, color: '#f59e0b' },
        { label: 'Thanh toán chờ duyệt', value: operations.pendingPayments.length, color: '#ef4444' },
        { label: 'Bảo trì đang mở', value: openMaintenance, color: '#10b981' },
        { label: 'Công việc đang mở', value: tasksOpen, color: '#6b7280' },
        { label: 'Phản hồi chờ xử lý', value: feedbacksOpen, color: '#3b82f6' }
      ],
      paymentSegments: [
        { label: 'Đã thanh toán', value: paymentPaid, color: '#10b981' },
        { label: 'Chưa thanh toán', value: paymentUnpaid, color: '#ef4444' }
      ],
      financeRows: [
        { label: 'Tổng hóa đơn', value: invoiceAmount, tone: 'primary' },
        { label: 'Đã thu', value: receiptAmount, tone: 'success' },
        { label: 'Chi phí', value: expenseAmount, tone: 'danger' },
        { label: 'Công nợ', value: debtAmount, tone: 'warning' }
      ],
      kpis: [
        {
          icon: 'dashboard',
          tone: 'primary',
          value: formatNumber(operations.rooms.length, locale),
          label: 'Tổng phòng',
          helper: 'Số phòng trong tòa'
        },
        {
          icon: 'home',
          tone: 'success',
          value: formatNumber(occupied, locale),
          label: 'Phòng đang thuê',
          helper: `${occupancyPercent}% tỷ lệ thuê`
        },
        {
          icon: 'building',
          tone: 'cyan',
          value: formatNumber(empty, locale),
          label: 'Phòng trống',
          helper: 'Có thể cho thuê'
        },
        {
          icon: 'users',
          tone: 'violet',
          value: formatNumber(occupants, locale),
          label: 'Người thuê',
          helper: 'Hồ sơ đang ở'
        },
        {
          icon: 'fileText',
          tone: 'danger',
          value: formatNumber(unpaidCount, locale),
          label: 'HĐ chưa thanh toán',
          helper: formatCurrency(debtAmount, locale)
        },
        {
          icon: 'wallet',
          tone: 'success',
          value: formatCompactCurrency(receiptAmount),
          label: 'Đã thu',
          helper: `${formatNumber(receipts.length, locale)} biên lai hợp lệ`
        },
        {
          icon: 'feedback',
          tone: 'warning',
          value: formatNumber(feedbacksOpen, locale),
          label: 'Phản hồi chờ xử lý',
          helper: 'Cần phản hồi'
        },
        {
          icon: 'tool',
          tone: attentionCount > 0 ? 'primary' : 'success',
          value: formatNumber(openMaintenance + tasksOpen, locale),
          label: 'Việc đang mở',
          helper: 'Bảo trì và công việc'
        }
      ],
      summaryRows: [
        {
          group: 'Thuê phòng',
          primary: `${formatNumber(operations.contracts.length, locale)} hợp đồng`,
          secondary: `${formatNumber(approved, locale)} người thuê`,
          followUp: `${formatNumber(pending, locale)} chờ duyệt`
        },
        {
          group: 'Thanh toán',
          primary: `${formatNumber(operations.invoices.length, locale)} hóa đơn`,
          secondary: `${formatNumber(operations.pendingPayments.length, locale)} chờ duyệt`,
          followUp: `${formatNumber(receipts.length, locale)} biên lai`
        },
        {
          group: 'Vận hành',
          primary: `${formatNumber(openMaintenance, locale)} bảo trì`,
          secondary: `${formatNumber(tasksOpen, locale)} công việc`,
          followUp: `${formatNumber(vehicles, locale)} xe`
        },
        {
          group: 'Liên hệ',
          primary: `${formatNumber(feedbacksOpen, locale)} phản hồi`,
          secondary: `${formatNumber(operations.invoiceComplaints.length, locale)} khiếu nại`,
          followUp: `${formatNumber(operations.notificationCount, locale)} thông báo`
        }
      ]
    };
  }, [locale, operations]);

  if (loading) {
    return <div className="empty-state">Đang tải tổng quan tòa nhà...</div>;
  }

  return (
    <div className="admin-ops-dashboard building-ops-dashboard">
      {error && <div className="alert error-alert">{error}</div>}

      <div className="ops-dashboard-workspace">
        <section className="ops-overview-panel">
          <div className="ops-overview-title">
            <div>
              <span>Tổng quan</span>
              <h2>Vận hành hôm nay</h2>
            </div>
            <strong>{formatNumber(trackedItems, locale)} mục cần theo dõi</strong>
          </div>
          <div className="ops-kpi-grid">
            {kpis.map((metric) => (
              <KpiCard key={metric.label} {...metric} />
            ))}
          </div>
        </section>

        <div className="ops-chart-grid">
          <MonthlyRevenueChart rows={monthlyRevenue} />
          <DonutPanel
            center={`${getPercent(paidInvoiceAmount, paymentTotal)}%`}
            icon="chartPulse"
            segments={paymentSegments}
            title="Tỷ lệ thanh toán"
          />
        </div>

        <div className="ops-chart-grid">
          <DonutPanel
            center={formatNumber(operations.rooms.length, locale)}
            icon="building"
            segments={roomSegments}
            title="Tình trạng phòng"
          />
          <DonutPanel
            center={formatNumber(trackedItems, locale)}
            icon="activity"
            segments={attentionSegments}
            title="Phân bố việc cần xử lý"
          />
        </div>

        <div className="ops-chart-grid">
          <section className="ops-panel">
            <PanelTitle icon="wallet" title="Tài chính tòa nhà" />
            <div className="ops-finance-list">
              {financeRows.map((row) => (
                <div className={`ops-finance-row ops-finance-${row.tone}`} key={row.label}>
                  <span>{row.label}</span>
                  <strong>{formatCurrency(row.value, locale)}</strong>
                </div>
              ))}
            </div>
          </section>
          <SummaryTable rows={summaryRows} />
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
    </div>
  );
}
