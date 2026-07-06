import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as maintenanceApi from '../../features/maintenance/api.js';
import * as taskApi from '../../features/maintenance/taskApi.js';
import * as vehicleApi from '../../features/residents/vehicleApi.js';
import * as roomApi from '../../features/rooms/api.js';
import * as expenseApi from '../../features/payments/expenseApi.js';
import PageHeader from '../../components/PageHeader.jsx';
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
  const openMaintenance = summary.maintenanceRequests.filter((request) =>
    ['PENDING', 'ASSIGNED', 'IN_PROGRESS'].includes(request.status)
  ).length;
  const openTasks = summary.tasks.filter((task) => ['NEW', 'IN_PROGRESS', 'OVERDUE'].includes(task.status)).length;

  return (
    <div className="building-workspace staff-building-overview-page">
      {error && <div className="alert error-alert">{error}</div>}

      <div className="detail-panel">
        <div>
          <span>{translateInterfaceText('Building code')}</span>
          <strong>{building.buildingCode}</strong>
        </div>
        <div>
          <span>{translateInterfaceText('Address')}</span>
          <strong>{building.address}</strong>
        </div>
        <div>
          <span>{translateInterfaceText('Floors')}</span>
          <strong>{building.floors}</strong>
        </div>
        <div className="detail-wide">
          <span>{translateInterfaceText('Description')}</span>
          <p>{building.description || translateInterfaceText('No description provided.')}</p>
        </div>
      </div>

      <PageHeader eyebrow={translateInterfaceText('Staff workspace')} title={translateInterfaceText('Building operations')} />
      <div className="dashboard-grid building-summary-grid">
        <div className="dashboard-card">
          <span>{translateInterfaceText('Total rooms')}</span>
          <strong>{formatNumber(summary.rooms.length)}</strong>
        </div>
        <div className="dashboard-card">
          <span>{translateInterfaceText('Active vehicles')}</span>
          <strong>{formatNumber(activeVehicles)}</strong>
        </div>
        <div className="dashboard-card">
          <span>{translateInterfaceText('Open maintenance')}</span>
          <strong>{formatNumber(openMaintenance)}</strong>
        </div>
        <div className="dashboard-card">
          <span>{translateInterfaceText('Created expenses')}</span>
          <strong>{formatNumber(summary.expenses.length)}</strong>
        </div>
        <div className="dashboard-card">
          <span>{translateInterfaceText('Open tasks')}</span>
          <strong>{formatNumber(openTasks)}</strong>
        </div>
      </div>
    </div>
  );
}
