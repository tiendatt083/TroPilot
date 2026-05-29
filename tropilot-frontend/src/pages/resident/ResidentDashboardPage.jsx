import { useEffect, useState } from 'react';
import * as dashboardApi from '../../api/dashboardApi.js';
import DashboardMetricGrid from '../../components/DashboardMetricGrid.jsx';
import DashboardSection from '../../components/DashboardSection.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { getContractStatusLabel } from '../../utils/contractStatusOptions.js';
import { getInvoiceStatusClass, getInvoiceStatusLabel } from '../../utils/invoiceStatusOptions.js';
import { getMaintenanceStatusClass, getMaintenanceStatusLabel } from '../../utils/maintenanceOptions.js';
import { formatRoomLabel } from '../../utils/roomDisplay.js';
import { getRoomStatusLabel } from '../../utils/roomStatusOptions.js';
import { getVehicleTypeLabel } from '../../utils/vehicleOptions.js';

function formatNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue)
    ? numberValue.toLocaleString('en-US', { maximumFractionDigits: 2 })
    : value;
}

function formatEnumLabel(value) {
  if (!value) {
    return 'Not available';
  }

  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function statusClass(status) {
  return `status-pill room-status-${status.toLowerCase()}`;
}

export default function ResidentDashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    dashboardApi
      .getResidentDashboard()
      .then((response) => {
        if (active) {
          setDashboard(response.data);
        }
      })
      .catch((apiError) => {
        if (active) {
          setError(apiError.response?.data?.message || 'Resident dashboard could not be loaded');
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
  }, []);

  const currentRoom = dashboard?.currentRoom;
  const latestInvoice = dashboard?.latestInvoice;
  const currentContract = dashboard?.currentContract;
  const activeVehicles = dashboard?.activeVehicles || [];
  const recentMaintenanceRequests = dashboard?.recentMaintenanceRequests || [];
  const metrics = dashboard
    ? [
        { label: 'Approved members', value: formatNumber(dashboard.approvedMemberCount), tone: 'success' },
        { label: 'Active vehicles', value: formatNumber(activeVehicles.length), tone: 'primary' },
        { label: 'Unread notifications', value: formatNumber(dashboard.unreadNotifications), tone: 'warning' },
        { label: 'Recent maintenance requests', value: formatNumber(recentMaintenanceRequests.length), tone: 'primary' }
      ]
    : [];

  return (
    <section className="content-section dashboard-page">
      <div className="dashboard-hero">
        <div>
          <PageHeader eyebrow="Head resident" title="Dashboard" />
          <p>Room status, contract, invoice, vehicle, and maintenance overview for your assigned room.</p>
        </div>
        {dashboard && <DashboardMetricGrid metrics={metrics} compact />}
      </div>

      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">Loading dashboard...</div>
      ) : currentRoom?.assigned ? (
        <section className="resident-dashboard-workspace">
          <DashboardSection
            title="Room overview"
            description="Current assigned room, building, and contract summary."
          >
            <div className="detail-panel dashboard-detail-panel">
              <div>
                <span>Assigned room</span>
                <strong>{formatRoomLabel(currentRoom)}</strong>
              </div>
              <div>
                <span>Building</span>
                <strong>
                  {currentRoom.buildingCode} - {currentRoom.buildingName}
                </strong>
              </div>
              <div>
                <span>Room status</span>
                <strong>
                  <span className={statusClass(currentRoom.roomStatus)}>
                    {getRoomStatusLabel(currentRoom.roomStatus)}
                  </span>
                </strong>
              </div>
              <div>
                <span>Assignment period</span>
                <strong>
                  {currentRoom.assignmentStartDate} to {currentRoom.assignmentEndDate}
                </strong>
              </div>
              <div>
                <span>Deposit amount</span>
                <strong>{formatNumber(currentRoom.depositAmount)}</strong>
              </div>
              <div>
                <span>Contract status</span>
                <strong>{getContractStatusLabel(currentRoom.contractStatus)}</strong>
              </div>
            </div>
          </DashboardSection>

          <div className="dashboard-two-column">
            <article className="dashboard-panel">
              <h2>Current contract</h2>
              {currentContract ? (
                <dl>
                  <div>
                    <dt>Period</dt>
                    <dd>
                      {currentContract.startDate} to {currentContract.endDate}
                    </dd>
                  </div>
                  <div>
                    <dt>Status</dt>
                    <dd>{formatEnumLabel(currentContract.rentalStatus)}</dd>
                  </div>
                  <div>
                    <dt>Contract file</dt>
                    <dd>{getContractStatusLabel(currentContract.contractStatus)}</dd>
                  </div>
                </dl>
              ) : (
                <div className="empty-state flat-empty-state">No active contract is available.</div>
              )}
            </article>

            <article className="dashboard-panel">
              <h2>Latest invoice</h2>
              {latestInvoice ? (
                <dl>
                  <div>
                    <dt>Month</dt>
                    <dd>{latestInvoice.month}</dd>
                  </div>
                  <div>
                    <dt>Due date</dt>
                    <dd>{dashboard.paymentDueDate || latestInvoice.dueDate}</dd>
                  </div>
                  <div>
                    <dt>Total amount</dt>
                    <dd>{formatNumber(latestInvoice.totalAmount)}</dd>
                  </div>
                  <div>
                    <dt>Status</dt>
                    <dd>
                      <span className={getInvoiceStatusClass(latestInvoice.status)}>
                        {getInvoiceStatusLabel(latestInvoice.status)}
                      </span>
                    </dd>
                  </div>
                </dl>
              ) : (
                <div className="empty-state flat-empty-state">No invoice is available.</div>
              )}
            </article>
          </div>

          <div className="dashboard-two-column">
            <article className="dashboard-panel">
              <h2>Active vehicles</h2>
              {activeVehicles.length > 0 ? (
                <ul className="dashboard-list">
                  {activeVehicles.map((vehicle) => (
                    <li key={vehicle.id}>
                      <strong>{vehicle.licensePlate}</strong>
                      <span>
                        {getVehicleTypeLabel(vehicle.vehicleType)} - {vehicle.ownerName}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="empty-state flat-empty-state">No active vehicle is registered.</div>
              )}
            </article>

            <article className="dashboard-panel">
              <h2>Recent maintenance requests</h2>
              {recentMaintenanceRequests.length > 0 ? (
                <ul className="dashboard-list">
                  {recentMaintenanceRequests.map((request) => (
                    <li key={request.id}>
                      <strong>{request.title}</strong>
                      <span className={getMaintenanceStatusClass(request.status)}>
                        {getMaintenanceStatusLabel(request.status)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="empty-state flat-empty-state">No maintenance request is available.</div>
              )}
            </article>
          </div>
        </section>
      ) : (
        <div className="empty-state">No room is assigned to your account.</div>
      )}
    </section>
  );
}
