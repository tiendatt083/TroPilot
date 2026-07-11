import { useTranslation } from 'react-i18next';
import { getVehicleStatusClass } from '../utils/vehicleOptions.js';
import { formatDisplayDate } from '../utils/dateFormat.js';
import { formatEnumLabel } from '../utils/i18nFormat.js';
import { formatRoomCode } from '../utils/roomDisplay.js';

function displayText(value, fallback) {
  return value || fallback;
}

function periodText(vehicle, t) {
  const startDate = formatDisplayDate(vehicle.startDate, t('common.notSet'));
  const endDate = formatDisplayDate(vehicle.endDate, t('common.open'));
  return `${startDate} ${t('common.to')} ${endDate}`;
}

function residentPeriodText(vehicle, t) {
  return formatDisplayDate(vehicle.startDate || vehicle.createdAt, t('common.notSet'));
}

export default function VehicleTable({ vehicles, renderActions, variant = 'default' }) {
  const { t } = useTranslation();
  const hasActions = Boolean(renderActions);

  if (variant === 'resident') {
    return (
      <div className="table-wrap vehicle-table-wrap-resident">
        <table className="data-table vehicle-table-resident">
          <thead>
            <tr>
              <th>{t('tables.common.licensePlate')}</th>
              <th>{t('tables.common.vehicleType')}</th>
              <th>{t('tables.common.owner')}</th>
              <th>{t('tables.common.period')}</th>
              <th>{t('tables.common.status')}</th>
              {hasActions && <th>{t('tables.common.actions')}</th>}
            </tr>
          </thead>
          <tbody>
            {vehicles.map((vehicle) => (
              <tr key={vehicle.id}>
                <td>
                  <strong>{vehicle.licensePlate}</strong>
                </td>
                <td>{formatEnumLabel(t, 'vehicleType', vehicle.vehicleType)}</td>
                <td>{vehicle.ownerName || t('common.notProvided')}</td>
                <td>{residentPeriodText(vehicle, t)}</td>
                <td>
                  <span className={getVehicleStatusClass(vehicle.status)}>
                    {formatEnumLabel(t, 'vehicleStatus', vehicle.status)}
                  </span>
                </td>
                {hasActions && <td>{renderActions(vehicle)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
        {vehicles.length === 0 && <div className="empty-state flat-empty-state">{t('tables.vehicles.empty')}</div>}
      </div>
    );
  }

  return (
    <div className={`vehicle-list ${hasActions ? 'vehicle-list-has-actions' : 'vehicle-list-readonly'}`}>
      {vehicles.map((vehicle) => (
        <article className={`vehicle-row${hasActions ? ' vehicle-row-has-actions' : ''}`} key={vehicle.id}>
          <div className="vehicle-main">
            <span>{t('tables.common.licensePlate')}</span>
            <strong>{vehicle.licensePlate}</strong>
            <small>
              {formatEnumLabel(t, 'vehicleType', vehicle.vehicleType)}
              {' - '}
              {displayText(vehicle.brand, t('common.notProvided'))}
              {vehicle.color ? `, ${vehicle.color}` : ''}
            </small>
          </div>

          <div className="vehicle-meta-grid">
            <div>
              <span>{t('tables.common.room')}</span>
              <strong>{formatRoomCode(vehicle)}</strong>
            </div>
            <div>
              <span>{t('tables.common.owner')}</span>
              <strong>{vehicle.ownerName}</strong>
              <small>{formatEnumLabel(t, 'vehicleOwnerType', vehicle.ownerType)}</small>
            </div>
            <div>
              <span>{t('tables.common.period')}</span>
              <strong>{periodText(vehicle, t)}</strong>
            </div>
          </div>

          <div className="vehicle-state-cell">
            <span className={getVehicleStatusClass(vehicle.status)}>
              {formatEnumLabel(t, 'vehicleStatus', vehicle.status)}
            </span>
          </div>

          {hasActions && <div className="vehicle-actions">{renderActions(vehicle)}</div>}
        </article>
      ))}
      {vehicles.length === 0 && <div className="empty-state flat-empty-state">{t('tables.vehicles.empty')}</div>}
    </div>
  );
}
