import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as dashboardApi from '../../features/buildings/dashboardApi.js';
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

export default function ResidentDashboardPage() {
  const { t } = useTranslation();
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
          setError(apiError.response?.data?.message || t('dashboard.resident.loadError'));
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
  const metrics = dashboard
    ? [
        { label: t('dashboard.resident.metrics.approvedMembers'), value: formatNumber(dashboard.approvedMemberCount), tone: 'success' },
        { label: t('dashboard.resident.metrics.activeVehicles'), value: formatNumber(activeVehicles.length), tone: 'primary' },
        { label: t('dashboard.resident.metrics.unreadNotifications'), value: formatNumber(dashboard.unreadNotifications), tone: 'warning' },
        { label: t('dashboard.resident.metrics.recentMaintenanceRequests'), value: formatNumber(recentMaintenanceRequests.length), tone: 'primary' }
      ]
    : [];

  return (
    <section className="content-section dashboard-page">
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
                <strong>{formatNumber(currentRoom.depositAmount)}</strong>
              </div>
              <div>
                <span>{t('dashboard.resident.labels.contractStatus')}</span>
                <strong>{formatEnumLabel(currentRoom.contractStatus, 'contractStatus', t)}</strong>
              </div>
            </div>
          </DashboardSection>

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
