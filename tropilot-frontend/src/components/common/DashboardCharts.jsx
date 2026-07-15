import { Link } from 'react-router-dom';
import LineIcon from './LineIcon.jsx';

export const CHART_COLORS = {
  paid: '#18b894',
  unpaid: '#ef4444',
  info: '#3f82f6',
  warning: '#f59e0b',
  violet: '#8b5cf6',
  neutral: '#64748b',
  cyan: '#06b6d4'
};

function toNumber(value) {
  const numberValue = Number(value ?? 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function getColor(color) {
  return CHART_COLORS[color] || color || CHART_COLORS.info;
}

function buildDonutGradient(items) {
  const total = items.reduce((sum, item) => sum + toNumber(item.value), 0);

  if (total <= 0) {
    return 'conic-gradient(#d7e0e5 0deg 360deg)';
  }

  let cursor = 0;
  const stops = items.map((item) => {
    const start = cursor;
    const size = (toNumber(item.value) / total) * 360;
    cursor += size;
    return `${getColor(item.color)} ${start}deg ${cursor}deg`;
  });

  return `conic-gradient(${stops.join(', ')})`;
}

export function ChartPanel({ action, children, className = '', eyebrow, icon, title }) {
  return (
    <section className={`ops-panel shared-chart-panel ${className}`.trim()}>
      <div className="shared-chart-header">
        <div className="shared-chart-title">
          {icon && (
            <span className="shared-chart-icon">
              <LineIcon name={icon} />
            </span>
          )}
          <div>
            {eyebrow && <span>{eyebrow}</span>}
            <h2>{title}</h2>
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function ChartLegend({ items }) {
  return (
    <div className="shared-chart-legend">
      {items.map((item) => (
        <span key={item.key || item.label}>
          <i style={{ backgroundColor: getColor(item.color) }} />
          {item.label}
        </span>
      ))}
    </div>
  );
}

export function GroupedBarChart({
  emptyText,
  rows,
  series,
  tooltipFormatter = null,
  valueFormatter = (value) => value
}) {
  const maxValue = Math.max(
    ...rows.flatMap((row) => series.map((item) => toNumber(row[item.key]))),
    1
  );

  if (!rows.length) {
    return <div className="empty-state flat-empty-state">{emptyText}</div>;
  }

  return (
    <>
      <ChartLegend items={series} />
      <div className="shared-bar-chart">
        {rows.map((row) => (
          <div className="shared-bar-group" key={row.key || row.month || row.label}>
            <div className="shared-bar-bars">
              {series.map((item) => {
                const value = toNumber(row[item.key]);
                const height = Math.max(4, Math.round((value / maxValue) * 100));
                const tooltipText = tooltipFormatter
                  ? tooltipFormatter(value, item, row)
                  : `${item.label}: ${valueFormatter(value)}`;

                return (
                  <span
                    aria-label={tooltipText}
                    className="shared-bar"
                    data-tooltip={tooltipText}
                    data-tooltip-follow="true"
                    key={item.key}
                    style={{
                      '--chart-color': getColor(item.color),
                      height: `${height}%`
                    }}
                  />
                );
              })}
            </div>
            <strong>{row.label}</strong>
          </div>
        ))}
      </div>
    </>
  );
}

export function HorizontalBarChart({ emptyText, labelKey = 'label', rows, valueFormatter = (value) => value, valueKey = 'value' }) {
  const maxValue = Math.max(...rows.map((row) => toNumber(row[valueKey])), 1);

  if (!rows.length) {
    return <div className="empty-state flat-empty-state">{emptyText}</div>;
  }

  return (
    <div className="shared-horizontal-chart">
      {rows.map((row) => {
        const value = toNumber(row[valueKey]);
        const width = Math.max(8, Math.round((value / maxValue) * 100));

        return (
          <div className="shared-horizontal-row" key={row.key || row.month || row[labelKey]}>
            <span>{row[labelKey]}</span>
            <div className="shared-horizontal-track">
              <i style={{ width: `${width}%` }} />
            </div>
            <strong>{valueFormatter(value)}</strong>
          </div>
        );
      })}
    </div>
  );
}

export function DonutChart({ center, items, locale = 'vi-VN' }) {
  return (
    <div className="shared-donut-layout">
      <div className="shared-donut" style={{ background: buildDonutGradient(items) }}>
        <div>{center}</div>
      </div>
      <div className="shared-donut-legend">
        {items.map((item) => {
          const content = (
            <>
              <i style={{ backgroundColor: getColor(item.color) }} />
              {item.label}
              <strong>{toNumber(item.value).toLocaleString(locale, { maximumFractionDigits: 2 })}</strong>
            </>
          );

          return item.to ? (
            <Link className="shared-donut-legend-action" key={item.key || item.label} to={item.to}>
              {content}
            </Link>
          ) : (
            <span key={item.key || item.label}>{content}</span>
          );
        })}
      </div>
    </div>
  );
}
