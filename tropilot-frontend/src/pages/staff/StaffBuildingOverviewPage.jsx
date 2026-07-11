import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as maintenanceApi from '../../features/maintenance/api.js';
import * as taskApi from '../../features/maintenance/taskApi.js';
import * as vehicleApi from '../../features/residents/vehicleApi.js';
import * as roomApi from '../../features/rooms/api.js';
import * as expenseApi from '../../features/payments/expenseApi.js';
import LineIcon from '../../components/common/LineIcon.jsx';
import { translateInterfaceText } from '../../utils/interfaceTranslations.js';
import { formatNumber } from '../../utils/numberFormat.js';

const emptySummary = {
  rooms: [],
  vehicles: [],
  maintenanceRequests: [],
  expenses: [],
  tasks: []
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

function toNumber(value) {
  const numericValue = Number(value ?? 0);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function formatCurrency(value) {
  return `${formatNumber(toNumber(value))} đ`;
}

function countByStatus(items, statuses) {
  const statusSet = new Set(statuses);
  return items.filter((item) => statusSet.has(item.status)).length;
}

function MetricCard({ helper, icon, label, tone, value }) {
  return (
    <article className={`staff-overview-metric staff-overview-metric-${tone}`}>
      <span className="staff-overview-metric-icon">
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

function InfoTile({ label, value }) {
  return (
    <div className="staff-overview-info-tile">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ProgressRow({ label, percent, value }) {
  return (
    <div className="staff-overview-progress-row">
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div className="staff-overview-progress-track">
        <i style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export default function StaffBuildingOverviewPage() {
  useTranslation();
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
        const [roomsResponse, vehiclesResponse, maintenanceResponse, expensesResponse, tasksResponse] =
          await Promise.all([
            roomApi.getStaffRooms(buildingFilter),
            vehicleApi.getStaffVehicles(buildingFilter),
            maintenanceApi.getStaffMaintenanceRequests(buildingFilter),
            expenseApi.getStaffExpenses(buildingFilter),
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

  if (loading) {
    return <div className="empty-state">{translateInterfaceText('Loading building summary...')}</div>;
  }

  const activeVehicles = summary.vehicles.filter((vehicle) => vehicle.status === 'ACTIVE').length;
  const occupiedRooms = countByStatus(summary.rooms, ['OCCUPIED']);
  const emptyRooms = countByStatus(summary.rooms, ['EMPTY', 'AVAILABLE']);
  const openMaintenance = countByStatus(summary.maintenanceRequests, ['PENDING', 'ASSIGNED', 'IN_PROGRESS']);
  const completedMaintenance = countByStatus(summary.maintenanceRequests, ['COMPLETED']);
  const openTasks = countByStatus(summary.tasks, ['NEW', 'IN_PROGRESS', 'OVERDUE']);
  const overdueTasks = countByStatus(summary.tasks, ['OVERDUE']);
  const pendingExpenses = countByStatus(summary.expenses, ['PENDING']);
  const totalExpenseAmount = summary.expenses.reduce((total, expense) => total + toNumber(expense.amount), 0);
  const attentionCount = openMaintenance + openTasks + pendingExpenses + overdueTasks;
  const occupancyPercent = summary.rooms.length ? Math.round((occupiedRooms / summary.rooms.length) * 100) : 0;
  const emptyPercent = summary.rooms.length ? Math.round((emptyRooms / summary.rooms.length) * 100) : 0;
  const buildingDescription = building.description || translateInterfaceText('No description provided.');
  const buildingName = building.name || building.address || building.buildingCode;

  const metrics = [
    {
      icon: 'dashboard',
      tone: 'primary',
      label: translateInterfaceText('Total rooms'),
      value: formatNumber(summary.rooms.length),
      helper: `${formatNumber(occupiedRooms)} ${translateInterfaceText('occupied')}`
    },
    {
      icon: 'home',
      tone: 'success',
      label: translateInterfaceText('Occupied rooms'),
      value: formatNumber(occupiedRooms),
      helper: `${formatNumber(occupancyPercent)}% ${translateInterfaceText('occupancy')}`
    },
    {
      icon: 'car',
      tone: 'cyan',
      label: translateInterfaceText('Active vehicles'),
      value: formatNumber(activeVehicles),
      helper: translateInterfaceText('Registered vehicles')
    },
    {
      icon: 'tool',
      tone: 'warning',
      label: translateInterfaceText('Open maintenance'),
      value: formatNumber(openMaintenance),
      helper: `${formatNumber(completedMaintenance)} ${translateInterfaceText('completed')}`
    },
    {
      icon: 'activity',
      tone: 'danger',
      label: translateInterfaceText('Open tasks'),
      value: formatNumber(openTasks),
      helper: `${formatNumber(overdueTasks)} ${translateInterfaceText('overdue')}`
    },
    {
      icon: 'wallet',
      tone: 'success',
      label: translateInterfaceText('Created expenses'),
      value: formatCurrency(totalExpenseAmount),
      helper: `${formatNumber(summary.expenses.length)} ${translateInterfaceText('records')}`
    }
  ];

  const focusItems = [
    {
      label: translateInterfaceText('Maintenance requests'),
      value: formatNumber(openMaintenance),
      helper: translateInterfaceText('Need progress tracking'),
      tone: 'warning'
    },
    {
      label: translateInterfaceText('Assigned tasks'),
      value: formatNumber(openTasks),
      helper: translateInterfaceText('Open staff work'),
      tone: 'primary'
    },
    {
      label: translateInterfaceText('Expense requests'),
      value: formatNumber(pendingExpenses),
      helper: translateInterfaceText('Waiting for approval'),
      tone: 'success'
    }
  ];

  return (
    <div className="building-workspace staff-building-overview-page staff-overview-page">
      {error && <div className="alert error-alert">{error}</div>}

      <section className="staff-overview-board">
        <div className="staff-overview-heading">
          <div>
            <span className="section-eyebrow">{translateInterfaceText('Staff workspace')}</span>
            <h2>{translateInterfaceText('Building operations')}</h2>
          </div>
          <strong>{`${formatNumber(attentionCount)} ${translateInterfaceText('items need attention')}`}</strong>
        </div>
        <div className="staff-overview-metrics">
          {metrics.map((metric) => (
            <MetricCard key={metric.label} {...metric} />
          ))}
        </div>
      </section>

      <div className="staff-overview-panels">
        <section className="staff-overview-panel staff-overview-profile-panel">
          <div className="staff-overview-panel-title">
            <LineIcon name="building" />
            <h3>{translateInterfaceText('Building profile')}</h3>
          </div>
          <div className="staff-overview-profile">
            <div className="staff-overview-profile-copy">
              <span>{building.buildingCode}</span>
              <strong>{buildingName}</strong>
              <p>{buildingDescription}</p>
            </div>
            <div className="staff-overview-info-grid">
              <InfoTile label={translateInterfaceText('Address')} value={building.address || translateInterfaceText('Not provided')} />
              <InfoTile label={translateInterfaceText('Floors')} value={formatNumber(building.floors || 0)} />
              <InfoTile label={translateInterfaceText('Occupancy')} value={`${formatNumber(occupancyPercent)}%`} />
            </div>
          </div>
        </section>

        <section className="staff-overview-panel">
          <div className="staff-overview-panel-title">
            <LineIcon name="activity" />
            <h3>{translateInterfaceText('Work to follow')}</h3>
          </div>
          <div className="staff-overview-queue">
            {focusItems.map((item) => (
              <div className={`staff-overview-queue-row staff-overview-queue-${item.tone}`} key={item.label}>
                <div>
                  <strong>{item.label}</strong>
                  <span>{item.helper}</span>
                </div>
                <b>{item.value}</b>
              </div>
            ))}
          </div>
        </section>

        <section className="staff-overview-panel">
          <div className="staff-overview-panel-title">
            <LineIcon name="home" />
            <h3>{translateInterfaceText('Occupancy overview')}</h3>
          </div>
          <div className="staff-overview-progress">
            <ProgressRow
              label={translateInterfaceText('Occupied rooms')}
              percent={occupancyPercent}
              value={`${formatNumber(occupiedRooms)} / ${formatNumber(summary.rooms.length)}`}
            />
            <ProgressRow
              label={translateInterfaceText('Empty rooms')}
              percent={emptyPercent}
              value={`${formatNumber(emptyRooms)} / ${formatNumber(summary.rooms.length)}`}
            />
          </div>
        </section>

        <section className="staff-overview-panel staff-overview-money-panel">
          <div className="staff-overview-panel-title">
            <LineIcon name="wallet" />
            <h3>{translateInterfaceText('Expense overview')}</h3>
          </div>
          <div className="staff-overview-money">
            <div>
              <span>{translateInterfaceText('Created expenses')}</span>
              <strong>{formatCurrency(totalExpenseAmount)}</strong>
            </div>
            <div>
              <span>{translateInterfaceText('Waiting for approval')}</span>
              <strong>{formatNumber(pendingExpenses)}</strong>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
