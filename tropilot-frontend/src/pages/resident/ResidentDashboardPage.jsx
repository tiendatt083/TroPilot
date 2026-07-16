import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as dashboardApi from '../../features/buildings/dashboardApi.js';
import * as invoiceApi from '../../features/invoices/api.js';
import * as utilityReadingApi from '../../features/invoices/utilityReadingApi.js';
import { ChartPanel, GroupedBarChart, HorizontalBarChart } from '../../components/common/DashboardCharts.jsx';
import DashboardMetricGrid from '../../components/DashboardMetricGrid.jsx';
import DashboardSection from '../../components/DashboardSection.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { formatDisplayDate, formatDisplayMonth } from '../../utils/dateFormat.js';
import { getInvoiceStatusClass } from '../../utils/invoiceStatusOptions.js';
import { getMaintenanceStatusClass } from '../../utils/maintenanceOptions.js';
import { formatRoomLabel } from '../../utils/roomDisplay.js';

function formatNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue)
    ? numberValue.toLocaleString('en-US', { maximumFractionDigits: 2 })
    : value;
}

function toNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function formatMoney(value, currencyUnit = 'đ') {
  return `${formatNumber(value)} ${currencyUnit}`;
}

function normalizeMonth(value) {
  if (!value) {
    return '';
  }

  const text = String(value);
  const isoMonth = text.match(/^(\d{4})-(\d{2})/);
  if (isoMonth) {
    return `${isoMonth[1]}-${isoMonth[2]}`;
  }

  const displayMonth = text.match(/^(\d{2})\/(\d{4})$/);
  if (displayMonth) {
    return `${displayMonth[2]}-${displayMonth[1]}`;
  }

  return text;
}

function extractResponseList(response) {
  return Array.isArray(response?.data) ? response.data : [];
}

function buildMonthlyRows(invoices, readings) {
  const rowsByMonth = new Map();

  readings.forEach((reading) => {
    const month = normalizeMonth(reading.month);
    if (!month) {
      return;
    }

    const row = rowsByMonth.get(month) || {
      month,
      electricity: 0,
      water: 0,
      cost: 0
    };

    row.electricity += toNumber(reading.electricityUsage);
    row.water += toNumber(reading.waterUsage);
    rowsByMonth.set(month, row);
  });

  invoices.forEach((invoice) => {
    const month = normalizeMonth(invoice.month);
    if (!month) {
      return;
    }

    const row = rowsByMonth.get(month) || {
      month,
      electricity: 0,
      water: 0,
      cost: 0
    };

    row.cost += toNumber(invoice.totalAmount);
    rowsByMonth.set(month, row);
  });

  return Array.from(rowsByMonth.values())
    .sort((left, right) => left.month.localeCompare(right.month))
    .slice(-6)
    .map((row) => ({
      ...row,
      label: formatDisplayMonth(row.month)
    }));
}

function getMonthlySummary(monthlyRows) {
  const latest = monthlyRows[monthlyRows.length - 1] || null;
  const totalCost = monthlyRows.reduce((sum, row) => sum + row.cost, 0);
  const averageCost = monthlyRows.length ? totalCost / monthlyRows.length : 0;

  return {
    latest,
    averageCost,
    totalElectricity: monthlyRows.reduce((sum, row) => sum + row.electricity, 0),
    totalWater: monthlyRows.reduce((sum, row) => sum + row.water, 0)
  };
}

function formatFallbackEnumLabel(value) {
  if (!value) {
    return '';
  }

  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatEnumLabel(value, group, t) {
  if (!value) {
    return t('common.notAvailable');
  }

  return t(`enum.${group}.${value}`, { defaultValue: formatFallbackEnumLabel(value) });
}

function statusClass(status) {
  return `status-pill room-status-${String(status || 'empty').toLowerCase()}`;
}

function ResidentInsightStrip({ summary, t }) {
  const currencyUnit = t('invoices.currencyUnit', { defaultValue: 'đ' });
  const insightItems = [
    {
      label: t('dashboard.resident.charts.currentMonthCost'),
      value: summary.latest ? formatMoney(summary.latest.cost, currencyUnit) : t('common.notAvailable')
    },
    {
      label: t('dashboard.resident.charts.averageCost'),
      value: summary.averageCost ? formatMoney(summary.averageCost, currencyUnit) : t('common.notAvailable')
    },
    {
      label: t('dashboard.resident.charts.electricityTotal'),
      value: `${formatNumber(summary.totalElectricity)} kWh`
    },
    {
      label: t('dashboard.resident.charts.waterTotal'),
      value: `${formatNumber(summary.totalWater)} m³`
    }
  ];

  return (
    <div className="resident-insight-strip">
      {insightItems.map((item) => (
        <div className="resident-insight-item" key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}

function MonthlyUsageChart({ rows, t }) {
  return (
    <ChartPanel
      eyebrow={t('dashboard.resident.charts.lastMonths')}
      icon="chartPulse"
      title={t('dashboard.resident.charts.monthlyUsage')}
    >
      <GroupedBarChart
        emptyText={t('dashboard.resident.empty.noChartData')}
        rows={rows.map((row) => ({ ...row, label: row.label }))}
        series={[
          { key: 'electricity', label: t('dashboard.resident.charts.electricity'), color: 'warning' },
          { key: 'water', label: t('dashboard.resident.charts.water'), color: 'paid' }
        ]}
        tooltipFormatter={(value, item) => {
          const unit = item.key === 'electricity' ? 'kWh' : 'm³';
          return `${item.label}: ${formatNumber(value)} ${unit}`;
        }}
        valueFormatter={(value) => formatNumber(value)}
      />
    </ChartPanel>
  );
}

function MonthlyCostChart({ rows, t }) {
  const currencyUnit = t('invoices.currencyUnit', { defaultValue: 'đ' });

  return (
    <ChartPanel
      eyebrow={t('dashboard.resident.charts.paymentTrend')}
      icon="wallet"
      title={t('dashboard.resident.charts.monthlyCost')}
    >
      <HorizontalBarChart
        emptyText={t('dashboard.resident.empty.noChartData')}
        rows={rows}
        valueFormatter={(value) => formatMoney(value, currencyUnit)}
        valueKey="cost"
      />
    </ChartPanel>
  );
}

export default function ResidentDashboardPage() {
  const { t } = useTranslation();
  const [dashboard, setDashboard] = useState(null);
  const [invoiceHistory, setInvoiceHistory] = useState([]);
  const [utilityHistory, setUtilityHistory] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    Promise.allSettled([
      dashboardApi.getResidentDashboard(),
      invoiceApi.getResidentInvoices(),
      utilityReadingApi.getResidentUtilityReadings()
    ])
      .then(([dashboardResult, invoicesResult, utilityResult]) => {
        if (!active) {
          return;
        }

        if (dashboardResult.status === 'fulfilled') {
          setDashboard(dashboardResult.value.data);
        } else {
          setError(dashboardResult.reason?.response?.data?.message || t('dashboard.resident.loadError'));
        }

        if (invoicesResult.status === 'fulfilled') {
          setInvoiceHistory(extractResponseList(invoicesResult.value));
        }

        if (utilityResult.status === 'fulfilled') {
          setUtilityHistory(extractResponseList(utilityResult.value));
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

  const currentRoom = dashboard?.currentRoom;
  const latestInvoice = dashboard?.latestInvoice;
  const currentContract = dashboard?.currentContract;
  const activeVehicles = dashboard?.activeVehicles || [];
  const recentMaintenanceRequests = dashboard?.recentMaintenanceRequests || [];
  const monthlyRows = useMemo(() => buildMonthlyRows(invoiceHistory, utilityHistory), [invoiceHistory, utilityHistory]);
  const monthlySummary = useMemo(() => getMonthlySummary(monthlyRows), [monthlyRows]);
  const currencyUnit = t('invoices.currencyUnit', { defaultValue: 'đ' });
  const metrics = dashboard
    ? [
        { label: t('dashboard.resident.metrics.approvedMembers'), value: formatNumber(dashboard.approvedMemberCount), tone: 'success' },
        { label: t('dashboard.resident.metrics.activeVehicles'), value: formatNumber(activeVehicles.length), tone: 'primary' },
        { label: t('dashboard.resident.metrics.recentMaintenanceRequests'), value: formatNumber(recentMaintenanceRequests.length), tone: 'violet' }
      ]
    : [];

  return (
    <section className="content-section dashboard-page resident-dashboard-page">
      <div className="dashboard-hero">
        <div>
          <PageHeader eyebrow={t('dashboard.resident.eyebrow')} title={t('dashboard.resident.title')} />
          <p>{t('dashboard.resident.heroDescription')}</p>
        </div>
        {dashboard && <DashboardMetricGrid metrics={metrics} compact />}
      </div>

      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">{t('dashboard.resident.loading')}</div>
      ) : currentRoom?.assigned ? (
        <section className="resident-dashboard-workspace">
          <DashboardSection
            title={t('dashboard.resident.sections.roomOverviewTitle')}
            description={t('dashboard.resident.sections.roomOverviewDescription')}
          >
            <div className="detail-panel dashboard-detail-panel">
              <div>
                <span>{t('dashboard.resident.labels.assignedRoom')}</span>
                <strong>{formatRoomLabel(currentRoom)}</strong>
              </div>
              <div>
                <span>{t('dashboard.resident.labels.building')}</span>
                <strong>
                  {currentRoom.buildingCode} - {currentRoom.buildingName}
                </strong>
              </div>
              <div>
                <span>{t('dashboard.resident.labels.roomStatus')}</span>
                <strong>
                  <span className={statusClass(currentRoom.roomStatus)}>
                    {formatEnumLabel(currentRoom.roomStatus, 'roomStatus', t)}
                  </span>
                </strong>
              </div>
              <div>
                <span>{t('dashboard.resident.labels.assignmentPeriod')}</span>
                <strong>
                  {formatDisplayDate(currentRoom.assignmentStartDate)} {t('common.to')}{' '}
                  {formatDisplayDate(currentRoom.assignmentEndDate)}
                </strong>
              </div>
              <div>
                <span>{t('dashboard.resident.labels.depositAmount')}</span>
                <strong>{formatMoney(currentRoom.depositAmount, currencyUnit)}</strong>
              </div>
              <div>
                <span>{t('dashboard.resident.labels.contractStatus')}</span>
                <strong>{formatEnumLabel(currentRoom.contractStatus, 'contractStatus', t)}</strong>
              </div>
            </div>
          </DashboardSection>

          <section className="resident-analytics-section">
            <ResidentInsightStrip summary={monthlySummary} t={t} />
            <div className="resident-chart-grid">
              <MonthlyUsageChart rows={monthlyRows} t={t} />
              <MonthlyCostChart rows={monthlyRows} t={t} />
            </div>
          </section>

          <div className="dashboard-two-column">
            <article className="dashboard-panel">
              <h2>{t('dashboard.resident.labels.currentContract')}</h2>
              {currentContract ? (
                <dl>
                  <div>
                    <dt>{t('dashboard.resident.labels.period')}</dt>
                    <dd>
                      {formatDisplayDate(currentContract.startDate)} {t('common.to')}{' '}
                      {formatDisplayDate(currentContract.endDate)}
                    </dd>
                  </div>
                  <div>
                    <dt>{t('dashboard.resident.labels.status')}</dt>
                    <dd>{formatEnumLabel(currentContract.rentalStatus, 'rentalStatus', t)}</dd>
                  </div>
                  <div>
                    <dt>{t('dashboard.resident.labels.contractFile')}</dt>
                    <dd>{formatEnumLabel(currentContract.contractStatus, 'contractStatus', t)}</dd>
                  </div>
                </dl>
              ) : (
                <div className="empty-state flat-empty-state">{t('dashboard.resident.empty.noActiveContract')}</div>
              )}
            </article>

            <article className="dashboard-panel">
              <h2>{t('dashboard.resident.labels.latestInvoice')}</h2>
              {latestInvoice ? (
                <dl>
                  <div>
                    <dt>{t('dashboard.resident.labels.month')}</dt>
                    <dd>{formatDisplayMonth(latestInvoice.month)}</dd>
                  </div>
                  <div>
                    <dt>{t('dashboard.resident.labels.dueDate')}</dt>
                    <dd>{formatDisplayDate(dashboard.paymentDueDate || latestInvoice.dueDate)}</dd>
                  </div>
                  <div>
                    <dt>{t('dashboard.resident.labels.totalAmount')}</dt>
                    <dd>{formatNumber(latestInvoice.totalAmount)}</dd>
                  </div>
                  <div>
                    <dt>{t('dashboard.resident.labels.status')}</dt>
                    <dd>
                      <span className={getInvoiceStatusClass(latestInvoice.status)}>
                        {formatEnumLabel(latestInvoice.status, 'invoiceStatus', t)}
                      </span>
                    </dd>
                  </div>
                </dl>
              ) : (
                <div className="empty-state flat-empty-state">{t('dashboard.resident.empty.noInvoice')}</div>
              )}
            </article>
          </div>

          <div className="dashboard-two-column">
            <article className="dashboard-panel">
              <h2>{t('dashboard.resident.labels.activeVehicles')}</h2>
              {activeVehicles.length > 0 ? (
                <ul className="dashboard-list">
                  {activeVehicles.map((vehicle) => (
                    <li key={vehicle.id}>
                      <strong>{vehicle.licensePlate}</strong>
                      <span>
                        {formatEnumLabel(vehicle.vehicleType, 'vehicleType', t)} - {vehicle.ownerName}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="empty-state flat-empty-state">{t('dashboard.resident.empty.noActiveVehicle')}</div>
              )}
            </article>

            <article className="dashboard-panel">
              <h2>{t('dashboard.resident.labels.recentMaintenanceRequests')}</h2>
              {recentMaintenanceRequests.length > 0 ? (
                <ul className="dashboard-list">
                  {recentMaintenanceRequests.map((request) => (
                    <li key={request.id}>
                      <strong>{request.title}</strong>
                      <span className={getMaintenanceStatusClass(request.status)}>
                        {formatEnumLabel(request.status, 'maintenanceStatus', t)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="empty-state flat-empty-state">{t('dashboard.resident.empty.noMaintenanceRequest')}</div>
              )}
            </article>
          </div>
        </section>
      ) : (
        <div className="empty-state">{t('dashboard.resident.empty.noAssignedRoom')}</div>
      )}
    </section>
  );
}
