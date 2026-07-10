import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { getUserDisplayName } from '../../utils/userDisplay.js';

const EMPTY_INSIGHTS = {
  buildings: [],
  rooms: [],
  invoices: [],
  feedbacks: [],
  maintenanceRequests: [],
  equipment: [],
  buildingUsers: []
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

function formatLongDate(value = new Date(), locale = 'vi-VN') {
  return new Intl.DateTimeFormat(locale, {
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

function buildBuildingRows(buildings, rooms, invoices, buildingUsers, locale, currencyLabel) {
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
      debt: formatCurrency(debt, locale, currencyLabel),
      collected: formatCurrency(collected, locale, currencyLabel)
    };
  });
}

function getLocale(language) {
  return String(language || '').startsWith('en') ? 'en-US' : 'vi-VN';
}

function statusLabel(t, group, status) {
  return t(`dashboard.ops.status.${group}.${status}`, { defaultValue: status || '' });
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

function BuildingSummaryTable({ rows, t }) {
  return (
    <section className="ops-panel ops-building-summary-panel">
      <PanelTitle icon="building" title={t('dashboard.ops.buildingSummary.title')} />
      <div className="ops-table-scroll">
        <table className="ops-data-table">
          <thead>
            <tr>
              <th>{t('dashboard.ops.buildingSummary.area')}</th>
              <th>{t('dashboard.ops.buildingSummary.rooms')}</th>
              <th>{t('dashboard.ops.buildingSummary.residents')}</th>
              <th>{t('dashboard.ops.buildingSummary.unpaid')}</th>
              <th>{t('dashboard.ops.buildingSummary.paid')}</th>
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
                <td colSpan="5">{t('dashboard.ops.buildingSummary.empty')}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function MonthlyRevenueChart({ rows, locale, t }) {
  const maxValue = Math.max(
    ...rows.flatMap((row) => [row.paid, row.unpaid]),
    1
  );

  return (
    <section className="ops-panel">
      <PanelTitle icon="barChart" title={t('dashboard.ops.charts.monthlyRevenue')} />
      <div className="ops-chart-legend">
        <span><i className="ops-legend-paid" />{t('dashboard.ops.labels.paid')}</span>
        <span><i className="ops-legend-unpaid" />{t('dashboard.ops.labels.unpaid')}</span>
      </div>
      <div className="ops-revenue-chart">
        {rows.map((row) => (
          <div className="ops-revenue-month" key={row.month}>
            <div className="ops-revenue-bars">
              <span
                className="ops-revenue-bar ops-revenue-paid"
                style={{ height: `${Math.max(3, getPercent(row.paid, maxValue))}%` }}
                title={`${t('dashboard.ops.labels.paid')} ${formatCompactCurrency(row.paid, locale, t)}`}
              />
              <span
                className="ops-revenue-bar ops-revenue-unpaid"
                style={{ height: `${Math.max(3, getPercent(row.unpaid, maxValue))}%` }}
                title={`${t('dashboard.ops.labels.unpaid')} ${formatCompactCurrency(row.unpaid, locale, t)}`}
              />
            </div>
            <span>{formatDisplayMonth(row.month)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function DonutPanel({ center, icon, locale, segments, title }) {
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
              <strong>{formatNumber(segment.value, locale)}</strong>
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
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [insights, setInsights] = useState(EMPTY_INSIGHTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const locale = getLocale(i18n.resolvedLanguage || i18n.language);
  const currencyLabel = t('dashboard.ops.units.currency');

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
        setError(t('dashboard.ops.adminLoadError'));
      }

      setLoading(false);
    }

    loadDashboard().catch((apiError) => {
      if (active) {
        setError(apiError.response?.data?.message || t('dashboard.ops.adminLoadError'));
        setDashboard(null);
        setInsights(EMPTY_INSIGHTS);
        setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [t]);

  const todayText = formatLongDate(new Date(), locale);
  const monthlyRevenue = useMemo(() => buildMonthlyRevenue(insights.invoices), [insights.invoices]);
  const buildingRows = useMemo(
    () => buildBuildingRows(
      insights.buildings,
      insights.rooms,
      insights.invoices,
      insights.buildingUsers,
      locale,
      currencyLabel
    ),
    [currencyLabel, insights.buildingUsers, insights.buildings, insights.invoices, insights.rooms, locale]
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
    { label: statusLabel(t, 'room', 'OCCUPIED'), value: dashboard?.occupiedRooms || 0, color: '#10b981' },
    { label: statusLabel(t, 'room', 'EMPTY'), value: dashboard?.emptyRooms || 0, color: '#3b82f6' },
    { label: statusLabel(t, 'room', 'MAINTENANCE'), value: dashboard?.maintenanceRooms || 0, color: '#f59e0b' }
  ];
  const feedbackSegments = [
    { label: statusLabel(t, 'feedback', 'PENDING'), value: insights.feedbacks.filter((item) => item.status === 'PENDING').length, color: '#f59e0b' },
    { label: statusLabel(t, 'feedback', 'IN_PROGRESS'), value: insights.feedbacks.filter((item) => item.status === 'IN_PROGRESS').length, color: '#3b82f6' },
    { label: statusLabel(t, 'feedback', 'RESOLVED'), value: insights.feedbacks.filter((item) => item.status === 'RESOLVED').length, color: '#10b981' },
    { label: statusLabel(t, 'feedback', 'REJECTED'), value: insights.feedbacks.filter((item) => item.status === 'REJECTED').length, color: '#6b7280' }
  ];
  const paymentSegments = [
    { label: statusLabel(t, 'invoice', 'PAID'), value: paymentPaidValue, color: '#10b981' },
    { label: statusLabel(t, 'invoice', 'UNPAID'), value: paymentUnpaidValue, color: '#ef4444' }
  ];
  const trackedItems = toNumber(dashboard?.unpaidInvoices)
    + toNumber(dashboard?.pendingMaintenanceRequests)
    + toNumber(dashboard?.unresolvedFeedbacks)
    + toNumber(dashboard?.totalPendingRoomMembers);
  const kpis = [
    {
      icon: 'building',
      tone: 'primary',
      value: formatNumber(dashboard?.totalBuildings, locale),
      label: t('dashboard.ops.labels.buildings'),
      helper: t('dashboard.ops.helpers.managedBuildings')
    },
    {
      icon: 'dashboard',
      tone: 'primary',
      value: formatNumber(dashboard?.totalRooms, locale),
      label: t('dashboard.ops.labels.totalRooms'),
      helper: t('dashboard.ops.helpers.managedRooms')
    },
    {
      icon: 'users',
      tone: 'violet',
      value: formatNumber(dashboard?.totalOccupants, locale),
      label: t('dashboard.ops.labels.residents'),
      helper: t('dashboard.ops.helpers.residentProfiles')
    },
    {
      icon: 'monitor',
      tone: 'cyan',
      value: formatNumber(insights.equipment.length, locale),
      label: t('dashboard.ops.labels.devices'),
      helper: t('dashboard.ops.helpers.runningDevices')
    },
    {
      icon: 'fileText',
      tone: 'danger',
      value: formatNumber(dashboard?.unpaidInvoices, locale),
      label: t('dashboard.ops.labels.unpaidInvoices'),
      helper: t('dashboard.ops.helpers.needsReview')
    },
    {
      icon: 'feedback',
      tone: 'warning',
      value: formatNumber(dashboard?.unresolvedFeedbacks, locale),
      label: t('dashboard.ops.labels.pendingFeedback'),
      helper: t('dashboard.ops.helpers.needsReply')
    },
    {
      icon: 'tool',
      tone: 'success',
      value: formatNumber(dashboard?.pendingMaintenanceRequests, locale),
      label: t('dashboard.ops.labels.scheduledMaintenance'),
      helper: t('dashboard.ops.helpers.upcomingWork')
    }
  ];
  const recentFeedbacks = sortRecent(insights.feedbacks).slice(0, 5);
  const recentInvoices = sortRecent(insights.invoices, ['createdAt', 'invoiceDate', 'dueDate']).slice(0, 5);
  const recentMaintenance = sortRecent(insights.maintenanceRequests).slice(0, 5);
  const greetingName = getUserDisplayName(user, 'admin');

  return (
    <section className="content-section dashboard-page admin-ops-dashboard">
      <section className="ops-welcome-card">
        <div>
          <h2>{t('dashboard.ops.hero.greeting', { name: greetingName })}</h2>
          <p>{t('dashboard.ops.hero.description')}</p>
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
        <div className="empty-state">{t('dashboard.ops.loadingAdmin')}</div>
      ) : !dashboard ? (
        <div className="empty-state">{t('dashboard.ops.emptyAdmin')}</div>
      ) : (
        <div className="ops-dashboard-workspace">
          <section className="ops-overview-panel">
            <div className="ops-overview-title">
              <div>
                <span>{t('dashboard.ops.eyebrow')}</span>
                <h2>{t('dashboard.ops.todayOperations')}</h2>
              </div>
              <strong>{t('dashboard.ops.trackedItems', { count: formatNumber(trackedItems, locale) })}</strong>
            </div>
            <div className="ops-kpi-grid">
              {kpis.map((metric) => (
                <KpiCard key={metric.label} {...metric} />
              ))}
            </div>
          </section>

          <BuildingSummaryTable rows={buildingRows} t={t} />

          <div className="ops-chart-grid">
            <MonthlyRevenueChart rows={monthlyRevenue} locale={locale} t={t} />
            <DonutPanel
              center={`${getPercent(paymentPaidValue, paymentTotal)}%`}
              icon="chartPulse"
              locale={locale}
              segments={paymentSegments}
              title={t('dashboard.ops.charts.paymentRate')}
            />
          </div>

          <div className="ops-chart-grid">
            <DonutPanel
              center={formatNumber(dashboard.totalRooms, locale)}
              icon="building"
              locale={locale}
              segments={roomSegments}
              title={t('dashboard.ops.charts.roomStatus')}
            />
            <DonutPanel
              center={formatNumber(insights.feedbacks.length, locale)}
              icon="feedback"
              locale={locale}
              segments={feedbackSegments}
              title={t('dashboard.ops.charts.feedbackDistribution')}
            />
          </div>

          <div className="ops-recent-grid">
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
            />
          </div>

          <div className="ops-recent-grid ops-recent-grid-single">
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
            />
          </div>
        </div>
      )}
    </section>
  );
}
