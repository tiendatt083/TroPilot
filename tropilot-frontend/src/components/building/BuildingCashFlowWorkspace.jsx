import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';
import { ChartPanel, DonutChart } from '../common/DashboardCharts.jsx';
import LineIcon from '../common/LineIcon.jsx';
import ReceiptTable from '../ReceiptTable.jsx';
import { formatInvoiceAmount } from '../../utils/invoiceDisplay.js';
import { formatEnumLabel } from '../../utils/i18nFormat.js';
import { getInvoiceStatusClass } from '../../utils/invoiceStatusOptions.js';
import { formatRoomCode } from '../../utils/roomDisplay.js';

const MONTHS = Array.from({ length: 12 }, (_, index) => index + 1);

function toNumber(value) {
  const numberValue = Number(value ?? 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function getInvoiceList(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.data)) {
    return response.data.data;
  }

  return [];
}

function getInvoiceMonth(invoice) {
  const candidates = [
    invoice?.month,
    invoice?.invoiceMonth,
    invoice?.invoiceDate,
    invoice?.dueDate,
    invoice?.createdAt
  ].filter(Boolean);

  for (const value of candidates) {
    const monthValue = String(value);
    const isoMatch = monthValue.match(/^(\d{4})-(\d{2})/);

    if (isoMatch) {
      return {
        key: `${isoMatch[1]}-${isoMatch[2]}`,
        month: Number(isoMatch[2]),
        year: Number(isoMatch[1])
      };
    }

    const displayMatch = monthValue.match(/^(\d{1,2})\/(\d{4})/);

    if (displayMatch) {
      const month = String(displayMatch[1]).padStart(2, '0');
      return {
        key: `${displayMatch[2]}-${month}`,
        month: Number(month),
        year: Number(displayMatch[2])
      };
    }
  }

  return null;
}

function isPaidInvoice(invoice) {
  return String(invoice?.status || '').toUpperCase() === 'PAID';
}

function getRoomKey(invoice) {
  return invoice?.roomId || invoice?.roomCode || invoice?.roomName || invoice?.id;
}

function buildTopRevenueRooms(invoices) {
  const rooms = new Map();

  invoices.forEach((invoice) => {
    const key = getRoomKey(invoice);
    const current = rooms.get(key) || {
      amount: 0,
      invoice,
      key
    };

    current.amount += toNumber(invoice.totalAmount);
    rooms.set(key, current);
  });

  return [...rooms.values()]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);
}

function buildMonthlyRevenue(invoices, year) {
  return MONTHS.map((month) => {
    const value = invoices
      .filter((invoice) => {
        const invoiceMonth = getInvoiceMonth(invoice);
        return invoiceMonth?.year === year && invoiceMonth.month === month;
      })
      .reduce((sum, invoice) => sum + toNumber(invoice.totalAmount), 0);

    return {
      key: `${year}-${String(month).padStart(2, '0')}`,
      label: `T${month}`,
      value
    };
  });
}

function formatPercent(value) {
  return `${Math.round(value)}%`;
}

function formatMoney(value) {
  return formatInvoiceAmount(value);
}

function formatChartMoney(value) {
  const numberValue = toNumber(value);

  if (numberValue >= 1000000) {
    return `${formatInvoiceAmount(numberValue / 1000000)}M`;
  }

  if (numberValue >= 1000) {
    return `${formatInvoiceAmount(numberValue / 1000)}K`;
  }

  return formatInvoiceAmount(numberValue);
}

function getCurrentMonthInfo() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const monthText = String(month).padStart(2, '0');

  return {
    key: `${year}-${monthText}`,
    label: `${monthText}/${year}`,
    month,
    year
  };
}

function CashFlowLineChart({ emptyText, rows }) {
  const width = 720;
  const height = 300;
  const padding = { top: 28, right: 26, bottom: 44, left: 64 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maxValue = Math.max(...rows.map((row) => toNumber(row.value)), 0);
  const hasData = maxValue > 0;
  const yMax = hasData ? maxValue : 1;
  const points = rows.map((row, index) => {
    const x = padding.left + (chartWidth / Math.max(rows.length - 1, 1)) * index;
    const y = padding.top + chartHeight - (toNumber(row.value) / yMax) * chartHeight;
    return { ...row, x, y };
  });
  const pathData = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const areaData = `${pathData} L ${padding.left + chartWidth} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z`;
  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="cashflow-line-chart">
      <svg className="cashflow-line-chart-svg" role="img" viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id="cashflow-line-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(63, 130, 246, 0.24)" />
            <stop offset="100%" stopColor="rgba(63, 130, 246, 0)" />
          </linearGradient>
        </defs>
        {gridLines.map((step) => {
          const y = padding.top + chartHeight - chartHeight * step;
          const value = yMax * step;

          return (
            <g key={step}>
              <line className="cashflow-line-grid" x1={padding.left} x2={padding.left + chartWidth} y1={y} y2={y} />
              <text className="cashflow-line-y-label" x={padding.left - 12} y={y + 4}>
                {formatChartMoney(value)}
              </text>
            </g>
          );
        })}
        {hasData && <path className="cashflow-line-area" d={areaData} />}
        <path className="cashflow-line-path" d={pathData} />
        {points.map((point) => (
          <g key={point.key}>
            <circle
              className="cashflow-line-point"
              cx={point.x}
              cy={point.y}
              data-tooltip={`${point.label}: ${formatMoney(point.value)}`}
              data-tooltip-follow="true"
              r="4"
            />
            <text className="cashflow-line-x-label" x={point.x} y={height - 16}>
              {point.label}
            </text>
          </g>
        ))}
      </svg>
      {!hasData && <div className="cashflow-line-empty">{emptyText}</div>}
    </div>
  );
}

function CashFlowRoomTable({ emptyText, icon, rows, showStatus = false, t, title }) {
  return (
    <section className="cashflow-room-panel">
      <div className="cashflow-room-panel-header">
        <div className="cashflow-room-panel-title">
          <span className="cashflow-room-panel-icon">
            <LineIcon name={icon} />
          </span>
          <span>{title}</span>
        </div>
      </div>
      <div className="table-wrap cashflow-room-table-wrap">
        <table className="data-table cashflow-room-table">
          <thead>
            <tr>
              <th>{t('tables.common.room')}</th>
              <th>{t('tables.common.headResident')}</th>
              <th>{t('tables.common.amount')}</th>
              {showStatus && <th>{t('tables.common.status')}</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const invoice = row.invoice || row;
              const amount = row.amount ?? invoice.totalAmount;
              const key = row.key || invoice.id;

              return (
                <tr key={key}>
                  <td>
                    <span className="cashflow-room-primary">{formatRoomCode(invoice)}</span>
                    {invoice.roomName && <span className="table-subtext">{invoice.roomName}</span>}
                  </td>
                  <td>
                    <span className="cashflow-room-primary">{invoice.residentHeadName || t('common.notProvided')}</span>
                    {invoice.residentHeadEmail && <span className="table-subtext">{invoice.residentHeadEmail}</span>}
                  </td>
                  <td>{formatMoney(amount)}</td>
                  {showStatus && (
                    <td>
                      <span className={getInvoiceStatusClass(invoice.status)}>
                        {formatEnumLabel(t, 'invoiceStatus', invoice.status)}
                      </span>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && <div className="empty-state flat-empty-state">{emptyText}</div>}
      </div>
    </section>
  );
}

export default function BuildingCashFlowWorkspace({ getInvoices, getReceipts }) {
  const { t } = useTranslation();
  const { building } = useOutletContext();
  const currentYear = new Date().getFullYear();
  const currentMonthInfo = useMemo(() => getCurrentMonthInfo(), []);
  const [invoices, setInvoices] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError('');

    Promise.all([
      getInvoices(building.id),
      getReceipts({ buildingId: building.id })
    ])
      .then(([invoiceResponse, receiptResponse]) => {
        if (isMounted) {
          setInvoices(getInvoiceList(invoiceResponse));
          setReceipts(getInvoiceList(receiptResponse));
        }
      })
      .catch((apiError) => {
        if (isMounted) {
          setError(apiError.response?.data?.message || t('workspace.cashFlow.loadError'));
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [building.id, getInvoices, getReceipts, t]);

  const dashboard = useMemo(() => {
    const yearInvoices = invoices.filter((invoice) => getInvoiceMonth(invoice)?.year === currentYear);
    const currentMonthInvoices = invoices.filter((invoice) => getInvoiceMonth(invoice)?.key === currentMonthInfo.key);
    const paidInvoices = yearInvoices.filter(isPaidInvoice);
    const unpaidInvoices = yearInvoices.filter((invoice) => !isPaidInvoice(invoice));
    const paidCurrentMonthInvoices = currentMonthInvoices.filter(isPaidInvoice);
    const unpaidCurrentMonthInvoices = currentMonthInvoices.filter((invoice) => !isPaidInvoice(invoice));
    const totalRevenue = yearInvoices.reduce((sum, invoice) => sum + toNumber(invoice.totalAmount), 0);
    const paidAmount = paidInvoices.reduce((sum, invoice) => sum + toNumber(invoice.totalAmount), 0);
    const unpaidAmount = unpaidInvoices.reduce((sum, invoice) => sum + toNumber(invoice.totalAmount), 0);
    const collectionRate = totalRevenue > 0 ? (paidAmount / totalRevenue) * 100 : 0;

    return {
      collectionRate,
      currentMonthInvoices,
      monthlyRevenue: buildMonthlyRevenue(invoices, currentYear),
      paidAmount,
      paidCurrentMonthInvoices,
      paidInvoices,
      topRevenueRooms: buildTopRevenueRooms(currentMonthInvoices),
      totalRevenue,
      unpaidAmount,
      unpaidCurrentMonthInvoices,
      unpaidInvoices,
      yearInvoices
    };
  }, [currentMonthInfo.key, currentYear, invoices]);

  const metrics = [
    {
      key: 'totalRevenue',
      icon: 'wallet',
      label: t('cashFlow.totalRevenue'),
      meta: t('cashFlow.totalRevenueMeta'),
      value: formatMoney(dashboard.totalRevenue),
      tone: 'income'
    },
    {
      key: 'paidAmount',
      icon: 'checkShield',
      label: t('cashFlow.paidAmount'),
      meta: t('cashFlow.paidAmountMeta'),
      value: formatMoney(dashboard.paidAmount),
      tone: 'paid'
    },
    {
      key: 'unpaidAmount',
      icon: 'clock',
      label: t('cashFlow.unpaidAmount'),
      meta: t('cashFlow.unpaidAmountMeta'),
      value: formatMoney(dashboard.unpaidAmount),
      tone: 'unpaid'
    },
    {
      key: 'collectionRate',
      icon: 'activity',
      label: t('cashFlow.collectionRate'),
      meta: t('cashFlow.collectionRateMeta'),
      value: formatPercent(dashboard.collectionRate),
      tone: 'rate'
    }
  ];

  return (
    <div className="building-workspace">
      <div className="building-section-header">
        <span className="page-eyebrow">{t('workspace.cashFlow.eyebrow')}</span>
      </div>

      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">{t('workspace.cashFlow.loading')}</div>
      ) : (
        <section className="cashflow-workspace">
          <section className="cashflow-summary" aria-label={t('workspace.cashFlow.title')}>
            {metrics.map((metric) => (
              <div className={`invoice-summary-card cashflow-metric cashflow-metric-${metric.tone}`} key={metric.key}>
                <span className="invoice-summary-icon">
                  <LineIcon name={metric.icon} />
                </span>
                <div className="invoice-summary-copy">
                  <span>{metric.label}</span>
                  <small>{metric.meta}</small>
                </div>
                <strong>{metric.value}</strong>
              </div>
            ))}
          </section>

          <section className="cashflow-chart-grid">
            <ChartPanel
              className="cashflow-line-panel"
              eyebrow={t('workspace.cashFlow.eyebrow')}
              icon="barChart"
              title=""
            >
              <CashFlowLineChart emptyText={t('cashFlow.empty')} rows={dashboard.monthlyRevenue} />
            </ChartPanel>

            <ChartPanel
              className="cashflow-donut-panel"
              eyebrow={t('cashFlow.invoiceStatusMonth', { month: currentMonthInfo.label })}
              icon="wallet"
              title=""
            >
              <DonutChart
                center={dashboard.currentMonthInvoices.length}
                items={[
                  {
                    key: 'paid',
                    label: t('cashFlow.paidInvoices'),
                    value: dashboard.paidCurrentMonthInvoices.length,
                    color: 'paid'
                  },
                  {
                    key: 'unpaid',
                    label: t('cashFlow.unpaidInvoices'),
                    value: dashboard.unpaidCurrentMonthInvoices.length,
                    color: 'warning'
                  }
                ]}
              />
            </ChartPanel>
          </section>

          <section className="cashflow-room-grid">
            <CashFlowRoomTable
              emptyText={t('cashFlow.noTopRooms')}
              icon="barChart"
              rows={dashboard.topRevenueRooms}
              t={t}
              title={t('cashFlow.topRevenueRooms')}
            />
            <CashFlowRoomTable
              emptyText={t('cashFlow.noUnpaidRooms')}
              icon="clock"
              rows={dashboard.unpaidCurrentMonthInvoices}
              showStatus
              t={t}
              title={t('cashFlow.unpaidRoomsInMonth')}
            />
          </section>

          <section className="cashflow-receipt-section">
            <div className="cashflow-section-heading">
              <span>{t('workspace.receipts.eyebrow')}</span>
            </div>
            <ReceiptTable receipts={receipts} />
          </section>
        </section>
      )}
    </div>
  );
}
