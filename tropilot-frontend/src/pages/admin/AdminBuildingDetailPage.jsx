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
import { CHART_COLORS, ChartPanel, DonutChart, GroupedBarChart } from '../../components/common/DashboardCharts.jsx';
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
  notificationCount: 0
};

function toNumber(value) {
  const numberValue = Number(value ?? 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function formatNumber(value, locale = 'vi-VN') {
  return toNumber(value).toLocaleString(locale, { maximumFractionDigits: 2 });
}

function formatCurrency(value, locale = 'vi-VN', currencyLabel = 'VND') {
  return `${formatNumber(value, locale)} ${currencyLabel}`;
}

function formatCompactCurrency(value, locale = 'vi-VN', t) {
  const amount = toNumber(value);

  if (Math.abs(amount) >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toLocaleString(locale, { maximumFractionDigits: 1 })} ${t('dashboard.ops.units.billion')}`;
  }

  if (Math.abs(amount) >= 1_000_000) {
    return `${(amount / 1_000_000).toLocaleString(locale, { maximumFractionDigits: 1 })} ${t('dashboard.ops.units.million')}`;
  }

  return formatCurrency(amount, locale, t('dashboard.ops.units.currency'));
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

function getDaysUntil(value) {
  if (!value) {
    return null;
  }

  const target = new Date(value);

  if (!Number.isFinite(target.getTime())) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
}

function getRoomLabel(record, fallback) {
  return record.roomCode || record.roomName || fallback;
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

function getLocale(language) {
  return String(language || '').startsWith('en') ? 'en-US' : 'vi-VN';
}

function statusLabel(t, group, status) {
  return t(`dashboard.ops.status.${group}.${status}`, { defaultValue: status || '' });
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

function PanelTitle({ icon, title, action, tone = 'primary' }) {
  return (
    <div className={`ops-panel-title ops-panel-title-${tone}`}>
      <div>
        <LineIcon name={icon} />
        <h2>{title}</h2>
      </div>
      {action}
    </div>
  );
}

function MonthlyRevenueChart({ rows, locale, t }) {
  return (
    <ChartPanel icon="barChart" title={t('dashboard.ops.charts.monthlyRevenue')}>
      <GroupedBarChart
        rows={rows.map((row) => ({ ...row, label: formatDisplayMonth(row.month) }))}
        series={[
          { key: 'paid', label: t('dashboard.ops.labels.paid'), color: 'paid' },
          { key: 'unpaid', label: t('dashboard.ops.labels.unpaid'), color: 'unpaid' }
        ]}
        valueFormatter={(value) => formatCompactCurrency(value, locale, t)}
      />
    </ChartPanel>
  );
}

function DonutPanel({ center, icon, locale, segments, title, valueFormatter = null }) {
  return (
    <ChartPanel className="ops-donut-panel" icon={icon} title={title}>
      <DonutChart center={center} items={segments} locale={locale} valueFormatter={valueFormatter} />
    </ChartPanel>
  );
}

function SummaryTable({ rows, t }) {
  return (
    <section className="ops-panel">
      <PanelTitle icon="activity" title={t('dashboard.ops.charts.operationalSummary')} />
      <div className="ops-table-scroll">
        <table className="ops-data-table">
          <thead>
            <tr>
              <th>{t('dashboard.ops.columns.group')}</th>
              <th>{t('dashboard.ops.columns.primary')}</th>
              <th>{t('dashboard.ops.columns.secondary')}</th>
              <th>{t('dashboard.ops.columns.followUp')}</th>
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

function RecentTable({ columns, emptyText, icon, rows, title, tone = 'primary' }) {
  return (
    <section className="ops-panel ops-recent-panel">
      <PanelTitle icon={icon} title={title} tone={tone} />
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
  const locale = getLocale(i18n.resolvedLanguage || i18n.language);
  const currencyLabel = t('dashboard.ops.units.currency');

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
    expiringContracts,
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
      + feedbacksOpen;
    const expiring = operations.contracts
      .map((contract) => ({ ...contract, remainingDays: getDaysUntil(contract.endDate) }))
      .filter((contract) => contract.remainingDays !== null && contract.remainingDays >= 0 && contract.remainingDays <= 30)
      .sort((left, right) => left.remainingDays - right.remainingDays || getDateTime(left.endDate) - getDateTime(right.endDate));
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
      expiringContracts: expiring,
      totalOccupants: occupants,
      totalReceiptAmount: receiptAmount,
      trackedItems: attentionCount + expiring.length,
      unpaidInvoiceRecords: unpaidRecords,
      unpaidInvoices: unpaidCount,
      unresolvedFeedbacks: feedbacksOpen,
      validReceipts: receipts,
      roomSegments: [
        { label: statusLabel(t, 'room', 'OCCUPIED'), value: occupied, color: CHART_COLORS.paid },
        { label: statusLabel(t, 'room', 'EMPTY'), value: empty, color: CHART_COLORS.info },
        { label: statusLabel(t, 'room', 'MAINTENANCE'), value: maintenance, color: CHART_COLORS.warning }
      ],
      attentionSegments: [
        { label: t('navigation.pendingMembers'), value: pending, color: CHART_COLORS.warning },
        { label: t('navigation.pendingPayments'), value: operations.pendingPayments.length, color: CHART_COLORS.unpaid },
        { label: t('dashboard.ops.labels.scheduledMaintenance'), value: openMaintenance, color: CHART_COLORS.paid },
        { label: t('dashboard.ops.labels.openWork'), value: tasksOpen, color: CHART_COLORS.neutral },
        { label: t('dashboard.ops.labels.pendingFeedback'), value: feedbacksOpen, color: CHART_COLORS.info }
      ],
      paymentSegments: [
        { label: statusLabel(t, 'invoice', 'PAID'), value: paymentPaid, color: CHART_COLORS.paid },
        { label: statusLabel(t, 'invoice', 'UNPAID'), value: paymentUnpaid, color: CHART_COLORS.unpaid }
      ],
      financeRows: [
        { label: t('dashboard.ops.labels.totalInvoices'), value: invoiceAmount, tone: 'primary' },
        { label: t('dashboard.ops.labels.paid'), value: receiptAmount, tone: 'success' },
        { label: t('dashboard.ops.labels.expenses'), value: expenseAmount, tone: 'danger' },
        { label: t('dashboard.ops.labels.unpaid'), value: debtAmount, tone: 'warning' }
      ],
      kpis: [
        {
          icon: 'dashboard',
          tone: 'primary',
          value: formatNumber(operations.rooms.length, locale),
          label: t('dashboard.ops.labels.totalRooms'),
          helper: t('dashboard.ops.helpers.roomsInBuilding')
        },
        {
          icon: 'home',
          tone: 'success',
          value: formatNumber(occupied, locale),
          label: t('dashboard.ops.labels.occupiedRooms'),
          helper: t('dashboard.ops.helpers.occupancyRate', { percent: occupancyPercent })
        },
        {
          icon: 'building',
          tone: 'cyan',
          value: formatNumber(empty, locale),
          label: t('dashboard.ops.labels.emptyRooms'),
          helper: t('dashboard.ops.helpers.rentable')
        },
        {
          icon: 'users',
          tone: 'violet',
          value: formatNumber(occupants, locale),
          label: t('dashboard.ops.labels.residents'),
          helper: t('dashboard.ops.helpers.residentRecords')
        },
        {
          icon: 'fileText',
          tone: 'danger',
          value: formatNumber(unpaidCount, locale),
          label: t('dashboard.ops.labels.unpaidInvoices'),
          helper: formatCurrency(debtAmount, locale, currencyLabel)
        },
        {
          icon: 'wallet',
          tone: 'success',
          value: formatCompactCurrency(receiptAmount, locale, t),
          label: t('dashboard.ops.labels.paid'),
          helper: t('dashboard.ops.helpers.validReceipts', { count: formatNumber(receipts.length, locale) })
        },
        {
          icon: 'feedback',
          tone: 'warning',
          value: formatNumber(feedbacksOpen, locale),
          label: t('dashboard.ops.labels.pendingFeedback'),
          helper: t('dashboard.ops.helpers.needsReply')
        },
        {
          icon: 'tool',
          tone: attentionCount > 0 ? 'primary' : 'success',
          value: formatNumber(openMaintenance + tasksOpen, locale),
          label: t('dashboard.ops.labels.openWork'),
          helper: t('dashboard.ops.helpers.workAndMaintenance')
        }
      ],
      summaryRows: [
        {
          group: t('dashboard.ops.summaryGroups.rentals'),
          primary: t('dashboard.ops.counts.contracts', { count: formatNumber(operations.contracts.length, locale) }),
          secondary: t('dashboard.ops.counts.residents', { count: formatNumber(approved, locale) }),
          followUp: t('dashboard.ops.counts.pending', { count: formatNumber(pending, locale) })
        },
        {
          group: t('dashboard.ops.summaryGroups.payments'),
          primary: t('dashboard.ops.counts.invoices', { count: formatNumber(operations.invoices.length, locale) }),
          secondary: t('dashboard.ops.counts.pending', { count: formatNumber(operations.pendingPayments.length, locale) }),
          followUp: t('dashboard.ops.counts.receipts', { count: formatNumber(receipts.length, locale) })
        },
        {
          group: t('dashboard.ops.summaryGroups.operations'),
          primary: t('dashboard.ops.counts.maintenance', { count: formatNumber(openMaintenance, locale) }),
          secondary: t('dashboard.ops.counts.tasks', { count: formatNumber(tasksOpen, locale) }),
          followUp: t('dashboard.ops.counts.vehicles', { count: formatNumber(vehicles, locale) })
        },
        {
          group: t('dashboard.ops.summaryGroups.contact'),
          primary: t('dashboard.ops.counts.feedbacks', { count: formatNumber(feedbacksOpen, locale) }),
          secondary: t('dashboard.ops.counts.totalFeedbacks', { count: formatNumber(operations.feedbacks.length, locale) }),
          followUp: t('dashboard.ops.counts.notifications', { count: formatNumber(operations.notificationCount, locale) })
        }
      ]
    };
  }, [currencyLabel, locale, operations, t]);

  if (loading) {
    return <div className="empty-state">{t('dashboard.ops.loadingBuilding')}</div>;
  }

  return (
    <div className="admin-ops-dashboard building-ops-dashboard">
      {error && <div className="alert error-alert">{error}</div>}

      <div className="ops-dashboard-workspace">
        <section className="ops-overview-panel">
          <div className="ops-overview-title">
            <div>
              <span>{t('dashboard.ops.eyebrow')}</span>
              <h2>{t('dashboard.ops.todayOperations')}</h2>
            </div>
          </div>
          <div className="ops-kpi-grid">
            {kpis.map((metric) => (
              <KpiCard key={metric.label} {...metric} />
            ))}
          </div>
        </section>

        <div className="ops-chart-grid">
          <MonthlyRevenueChart rows={monthlyRevenue} locale={locale} t={t} />
          <DonutPanel
            center={`${getPercent(paidInvoiceAmount, paymentTotal)}%`}
            icon="chartPulse"
            locale={locale}
            segments={paymentSegments}
            title={t('dashboard.ops.charts.paymentRate')}
            valueFormatter={(value) => formatCurrency(value, locale, currencyLabel)}
          />
        </div>

        <div className="ops-chart-grid">
          <DonutPanel
            center={formatNumber(operations.rooms.length, locale)}
            icon="building"
            locale={locale}
            segments={roomSegments}
            title={t('dashboard.ops.charts.roomStatus')}
          />
          <DonutPanel
            center={formatNumber(trackedItems, locale)}
            icon="activity"
            locale={locale}
            segments={attentionSegments}
            title={t('dashboard.ops.charts.attentionDistribution')}
          />
        </div>

        <div className="ops-chart-grid">
          <section className="ops-panel">
            <PanelTitle icon="wallet" title={t('dashboard.ops.charts.buildingFinance')} />
            <div className="ops-finance-list">
              {financeRows.map((row) => (
                <div className={`ops-finance-row ops-finance-${row.tone}`} key={row.label}>
                  <span>{row.label}</span>
                  <strong>{formatCurrency(row.value, locale, currencyLabel)}</strong>
                </div>
              ))}
            </div>
          </section>
          <SummaryTable rows={summaryRows} t={t} />
        </div>

        <div className="ops-recent-grid">
          <RecentTable
            columns={[
              {
                key: 'room',
                label: t('dashboard.ops.columns.room'),
                render: (row) => (
                  <strong>{[row.buildingCode, row.roomCode].filter(Boolean).join(' - ') || t('dashboard.ops.fallback.noRoom')}</strong>
                )
              },
              { key: 'resident', label: t('dashboard.ops.columns.resident'), render: (row) => row.residentHeadName || t('dashboard.ops.fallback.notSet') },
              { key: 'endDate', label: t('dashboard.ops.columns.endDate'), render: (row) => formatDisplayDate(row.endDate, t('dashboard.ops.fallback.notSet')) },
              {
                key: 'remainingDays',
                label: t('dashboard.ops.columns.remainingDays'),
                render: (row) => t('dashboard.ops.remainingDays', { count: row.remainingDays })
              }
            ]}
            emptyText={t('dashboard.ops.empty.expiringContracts')}
            icon="fileText"
            rows={expiringContracts}
            title={t('dashboard.ops.recent.expiringContracts')}
            tone="warning"
          />
          <RecentTable
            columns={[
              { key: 'title', label: t('dashboard.ops.columns.title'), render: (row) => <strong>{row.title || row.content || t('dashboard.ops.fallback.noTitle')}</strong> },
              { key: 'room', label: t('dashboard.ops.columns.room'), render: (row) => getRoomLabel(row, t('dashboard.ops.fallback.noRoom')) },
              {
                key: 'status',
                label: t('dashboard.ops.columns.status'),
                render: (row) => (
                  <span className={getStatusClass('feedback-status', row.status)}>
                    {statusLabel(t, 'feedback', row.status)}
                  </span>
                )
              }
            ]}
            emptyText={t('dashboard.ops.empty.recentFeedbacks')}
            icon="feedback"
            rows={recentFeedbacks}
            title={t('dashboard.ops.recent.feedbacks')}
            tone="cyan"
          />
          <RecentTable
            columns={[
              { key: 'code', label: t('dashboard.ops.columns.invoiceCode'), render: (row) => <strong>{getInvoiceCode(row)}</strong> },
              { key: 'amount', label: t('dashboard.ops.columns.amount'), render: (row) => formatCurrency(row.totalAmount, locale, currencyLabel) },
              { key: 'dueDate', label: t('dashboard.ops.columns.dueDate'), render: (row) => formatDisplayDate(row.dueDate, t('dashboard.ops.fallback.notSet')) },
              {
                key: 'status',
                label: t('dashboard.ops.columns.status'),
                render: (row) => (
                  <span className={getStatusClass('invoice-status', row.status)}>
                    {statusLabel(t, 'invoice', row.status)}
                  </span>
                )
              }
            ]}
            emptyText={t('dashboard.ops.empty.recentInvoices')}
            icon="fileText"
            rows={recentInvoices}
            title={t('dashboard.ops.recent.invoices')}
            tone="success"
          />
          <RecentTable
            columns={[
              { key: 'title', label: t('dashboard.ops.columns.description'), render: (row) => <strong>{row.title || row.content || t('dashboard.ops.fallback.noDescription')}</strong> },
              { key: 'equipment', label: t('dashboard.ops.columns.equipment'), render: (row) => row.equipmentName || row.equipmentCode || t('dashboard.ops.fallback.noEquipment') },
              { key: 'startDate', label: t('dashboard.ops.columns.startDate'), render: (row) => formatDisplayDate(row.createdAt, t('dashboard.ops.fallback.notSet')) },
              { key: 'finishDate', label: t('dashboard.ops.columns.finishDate'), render: (row) => formatDisplayDate(getMaintenanceFinishedDate(row), statusLabel(t, 'maintenance', row.status) || t('dashboard.ops.fallback.tracking')) },
              { key: 'cost', label: t('dashboard.ops.columns.cost'), render: (row) => formatCurrency(getMaintenanceCost(row), locale, currencyLabel) }
            ]}
            emptyText={t('dashboard.ops.empty.recentMaintenance')}
            icon="tool"
            rows={recentMaintenance}
            title={t('dashboard.ops.recent.maintenance')}
            tone="primary"
          />
        </div>
      </div>
    </div>
  );
}
