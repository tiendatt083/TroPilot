import { useEffect, useState } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
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
import PageHeader from '../../components/PageHeader.jsx';

const emptyBuildingOperations = {
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

function toNumber(value) {
  const numberValue = Number(value ?? 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function formatNumber(value, locale) {
  return toNumber(value).toLocaleString(locale, { maximumFractionDigits: 2 });
}

function sumAmounts(items, amountKey) {
  return items.reduce((total, item) => total + toNumber(item[amountKey]), 0);
}

function getPercent(value, total) {
  const totalValue = toNumber(total);
  return totalValue > 0 ? Math.min(100, Math.round((toNumber(value) / totalValue) * 100)) : 0;
}

function getDonutStyle(segments) {
  const total = segments.reduce((sum, segment) => sum + toNumber(segment.value), 0);
  let cursor = 0;
  const stops = segments.map((segment) => {
    const start = cursor;
    cursor += total > 0 ? (toNumber(segment.value) / total) * 360 : 0;
    return `${segment.color} ${start}deg ${cursor}deg`;
  });

  return {
    background: total > 0
      ? `conic-gradient(${stops.join(', ')})`
      : 'conic-gradient(var(--color-border) 0deg 360deg)'
  };
}

function MetricCard({ label, value, helper, tone = 'primary' }) {
  return (
    <article className={`home-metric-card home-metric-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{helper}</small>
    </article>
  );
}

function DonutPanel({ title, subtitle, totalLabel, totalValue, segments, locale }) {
  return (
    <section className="home-analytics-card">
      <div className="home-panel-title">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>
      <div className="home-donut-layout">
        <div className="home-donut" style={getDonutStyle(segments)}>
          <div>
            <strong>{totalValue}</strong>
            <span>{totalLabel}</span>
          </div>
        </div>
        <div className="home-chart-legend">
          {segments.map((segment) => (
            <div key={segment.label}>
              <i style={{ backgroundColor: segment.color }} aria-hidden="true" />
              <span>{segment.label}</span>
              <strong>{formatNumber(segment.value, locale)}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BarPanel({ title, subtitle, rows, locale }) {
  const maxValue = Math.max(...rows.map((row) => toNumber(row.value)), 1);

  return (
    <section className="home-analytics-card">
      <div className="home-panel-title">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>
      <div className="home-bar-list">
        {rows.map((row) => (
          <div className="home-bar-row" key={row.label}>
            <div>
              <span>{row.label}</span>
              <strong>{formatNumber(row.value, locale)}</strong>
            </div>
            <div className="home-bar-track">
              <i
                className={`home-bar-fill home-bar-${row.tone}`}
                style={{ width: `${Math.max(4, getPercent(row.value, maxValue))}%` }}
                aria-hidden="true"
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function OperationsTable({ title, rows, t }) {
  return (
    <section className="home-table-card">
      <div className="home-panel-title">
        <h2>{title}</h2>
      </div>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>{t('buildingOverview.table.group')}</th>
              <th>{t('buildingOverview.table.primary')}</th>
              <th>{t('buildingOverview.table.secondary')}</th>
              <th>{t('buildingOverview.table.followUp')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.name}>
                <td><strong>{row.name}</strong></td>
                {row.metrics.map((metric) => (
                  <td key={metric.label}>
                    <span className="home-table-label">{metric.label}</span>
                    <strong>{metric.value}</strong>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function AdminBuildingDetailPage() {
  const { id } = useParams();
  const { building } = useOutletContext();
  const { t, i18n } = useTranslation();
  const [operations, setOperations] = useState(emptyBuildingOperations);
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

  if (loading) {
    return <div className="empty-state">{t('buildingOverview.loading')}</div>;
  }

  const occupiedRooms = operations.rooms.filter((room) => room.status === 'OCCUPIED').length;
  const emptyRooms = operations.rooms.filter((room) => room.status === 'EMPTY').length;
  const maintenanceRooms = operations.rooms.filter((room) => room.status === 'MAINTENANCE').length;
  const activeVehicles = operations.vehicles.filter((vehicle) => vehicle.status === 'ACTIVE').length;
  const approvedMembers = operations.members.filter((member) => member.status === 'APPROVED').length;
  const pendingMembers = operations.members.filter((member) => member.status === 'PENDING').length;
  const totalOccupants = operations.contracts.length + approvedMembers;
  const unpaidInvoiceRecords = operations.invoices.filter((invoice) => invoice.status !== 'PAID');
  const unpaidInvoices = unpaidInvoiceRecords.length;
  const validReceipts = operations.receipts.filter((receipt) => receipt.status === 'VALID');
  const openMaintenanceRequests = operations.maintenanceRequests.filter((request) =>
    ['PENDING', 'ASSIGNED', 'IN_PROGRESS'].includes(request.status)
  ).length;
  const openTasks = operations.tasks.filter((task) => ['NEW', 'IN_PROGRESS', 'OVERDUE'].includes(task.status)).length;
  const unresolvedFeedbacks = operations.feedbacks.filter((feedback) =>
    ['PENDING', 'IN_PROGRESS'].includes(feedback.status)
  ).length;
  const validExpenses = operations.expenses.filter((expense) => expense.status === 'VALID');
  const totalInvoiceAmount = sumAmounts(operations.invoices, 'totalAmount');
  const totalReceiptAmount = sumAmounts(validReceipts, 'amount');
  const totalExpenseAmount = sumAmounts(validExpenses, 'amount');
  const outstandingAmount = sumAmounts(unpaidInvoiceRecords, 'totalAmount');
  const occupancyPercent = getPercent(occupiedRooms, operations.rooms.length);
  const trackedItems = pendingMembers
    + operations.pendingPayments.length
    + openMaintenanceRequests
    + openTasks
    + unresolvedFeedbacks
    + operations.invoiceComplaints.length;

  const quickMetrics = [
    {
      label: t('buildingOverview.metrics.totalRooms'),
      value: formatNumber(operations.rooms.length, locale),
      helper: t('buildingOverview.helpers.roomOccupancy', { percent: occupancyPercent }),
      tone: 'primary'
    },
    {
      label: t('buildingOverview.metrics.occupiedRooms'),
      value: formatNumber(occupiedRooms, locale),
      helper: t('buildingOverview.helpers.activeContracts', { count: operations.contracts.length }),
      tone: 'info'
    },
    {
      label: t('buildingOverview.metrics.totalOccupants'),
      value: formatNumber(totalOccupants, locale),
      helper: t('buildingOverview.helpers.occupants'),
      tone: 'success'
    },
    {
      label: t('buildingOverview.metrics.unpaidInvoices'),
      value: formatNumber(unpaidInvoices, locale),
      helper: t('buildingOverview.helpers.outstandingAmount', { amount: formatNumber(outstandingAmount, locale) }),
      tone: 'warning'
    },
    {
      label: t('buildingOverview.metrics.activeVehicles'),
      value: formatNumber(activeVehicles, locale),
      helper: t('buildingOverview.helpers.activeVehicles'),
      tone: 'cyan'
    },
    {
      label: t('buildingOverview.metrics.trackedItems'),
      value: formatNumber(trackedItems, locale),
      helper: t('buildingOverview.helpers.trackedItems'),
      tone: trackedItems > 0 ? 'danger' : 'success'
    }
  ];

  const roomSegments = [
    { label: t('buildingOverview.metrics.occupiedRooms'), value: occupiedRooms, color: 'var(--color-success)' },
    { label: t('buildingOverview.metrics.emptyRooms'), value: emptyRooms, color: 'var(--color-info)' },
    { label: t('buildingOverview.metrics.maintenanceRooms'), value: maintenanceRooms, color: 'var(--color-warning)' }
  ];

  const attentionSegments = [
    { label: t('buildingOverview.metrics.pendingMembers'), value: pendingMembers, color: 'var(--color-warning)' },
    { label: t('buildingOverview.metrics.pendingPayments'), value: operations.pendingPayments.length, color: 'var(--color-danger)' },
    { label: t('buildingOverview.metrics.openMaintenance'), value: openMaintenanceRequests, color: 'var(--color-primary)' },
    { label: t('buildingOverview.metrics.openTasks'), value: openTasks, color: 'var(--color-text-muted)' }
  ];

  const financeRows = [
    { label: t('buildingOverview.metrics.totalInvoiceAmount'), value: totalInvoiceAmount, tone: 'primary' },
    { label: t('buildingOverview.metrics.totalIncome'), value: totalReceiptAmount, tone: 'success' },
    { label: t('buildingOverview.metrics.totalExpense'), value: totalExpenseAmount, tone: 'danger' },
    { label: t('buildingOverview.metrics.outstandingAmount'), value: outstandingAmount, tone: 'warning' }
  ];

  const summaryRows = [
    {
      name: t('buildingOverview.groups.rental'),
      metrics: [
        { label: t('buildingOverview.metrics.activeContracts'), value: formatNumber(operations.contracts.length, locale) },
        { label: t('buildingOverview.metrics.approvedMembers'), value: formatNumber(approvedMembers, locale) },
        { label: t('buildingOverview.metrics.pendingMembers'), value: formatNumber(pendingMembers, locale) }
      ]
    },
    {
      name: t('buildingOverview.groups.billing'),
      metrics: [
        { label: t('buildingOverview.metrics.invoices'), value: formatNumber(operations.invoices.length, locale) },
        { label: t('buildingOverview.metrics.pendingPayments'), value: formatNumber(operations.pendingPayments.length, locale) },
        { label: t('buildingOverview.metrics.receipts'), value: formatNumber(validReceipts.length, locale) }
      ]
    },
    {
      name: t('buildingOverview.groups.operations'),
      metrics: [
        { label: t('buildingOverview.metrics.openMaintenance'), value: formatNumber(openMaintenanceRequests, locale) },
        { label: t('buildingOverview.metrics.openTasks'), value: formatNumber(openTasks, locale) },
        { label: t('buildingOverview.metrics.activeVehicles'), value: formatNumber(activeVehicles, locale) }
      ]
    },
    {
      name: t('buildingOverview.groups.communication'),
      metrics: [
        { label: t('buildingOverview.metrics.unresolvedFeedbacks'), value: formatNumber(unresolvedFeedbacks, locale) },
        { label: t('buildingOverview.metrics.invoiceComplaints'), value: formatNumber(operations.invoiceComplaints.length, locale) },
        { label: t('buildingOverview.metrics.notifications'), value: formatNumber(operations.notificationCount, locale) }
      ]
    }
  ];

  return (
    <div className="building-workspace admin-home-page building-overview-page">
      {error && <div className="alert error-alert">{error}</div>}

      <div className="admin-home-hero building-overview-hero">
        <div>
          <PageHeader eyebrow={t('buildingOverview.eyebrow')} title={t('buildingOverview.title')} />
          <p>{t('buildingOverview.description', { name: building.name })}</p>
          <p className="building-overview-description">
            {building.description || t('buildingOverview.noDescription')}
          </p>
        </div>
        <div className="admin-home-date-card building-overview-facts">
          <div className="building-overview-fact">
            <span>{t('buildingOverview.fields.code')}</span>
            <strong>{building.buildingCode}</strong>
          </div>
          <div className="building-overview-fact">
            <span>{t('buildingOverview.fields.floors')}</span>
            <strong>{formatNumber(building.floors, locale)}</strong>
          </div>
          <div className="building-overview-fact building-overview-fact-wide">
            <span>{t('buildingOverview.fields.address')}</span>
            <strong>{building.address}</strong>
          </div>
          <small>{t('buildingOverview.occupancySummary', { percent: occupancyPercent })}</small>
        </div>
      </div>

      <div className="admin-home-workspace">
        <section className="admin-home-overview-card">
          <div className="home-panel-title">
            <div>
              <span>{t('buildingOverview.sections.snapshotLabel')}</span>
              <h2>{t('buildingOverview.sections.snapshotTitle')}</h2>
            </div>
            <strong>{t('buildingOverview.sections.trackingCount', { count: formatNumber(trackedItems, locale) })}</strong>
          </div>
          <div className="admin-home-metrics">
            {quickMetrics.map((metric) => (
              <MetricCard key={metric.label} {...metric} />
            ))}
          </div>
        </section>

        <div className="admin-home-chart-grid">
          <DonutPanel
            title={t('buildingOverview.sections.roomStatusTitle')}
            subtitle={t('buildingOverview.sections.roomStatusDescription')}
            totalLabel={t('buildingOverview.metrics.rooms')}
            totalValue={formatNumber(operations.rooms.length, locale)}
            segments={roomSegments}
            locale={locale}
          />
          <DonutPanel
            title={t('buildingOverview.sections.attentionTitle')}
            subtitle={t('buildingOverview.sections.attentionDescription')}
            totalLabel={t('buildingOverview.metrics.trackedItems')}
            totalValue={formatNumber(trackedItems, locale)}
            segments={attentionSegments}
            locale={locale}
          />
        </div>

        <div className="admin-home-chart-grid">
          <BarPanel
            title={t('buildingOverview.sections.financeTitle')}
            subtitle={t('buildingOverview.sections.financeDescription')}
            rows={financeRows}
            locale={locale}
          />
          <OperationsTable
            title={t('buildingOverview.sections.summaryTitle')}
            rows={summaryRows}
            t={t}
          />
        </div>
      </div>
    </div>
  );
}
