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

function vehicleRegistrationDateText(vehicle, t) {
  return formatDisplayDate(vehicle.startDate || vehicle.createdAt, t('common.notSet'));
}

function vehicleBrandText(vehicle, t) {
  if (!vehicle.brand && !vehicle.color) {
    return '';
  }

  const brand = vehicle.brand ? `${t('vehicles.form.brand')}: ${vehicle.brand}` : '';
  return [brand, vehicle.color].filter(Boolean).join(', ');
}

function residentPeriodText(vehicle, t) {
  return formatDisplayDate(vehicle.startDate || vehicle.createdAt, t('common.notSet'));
}

export default function VehicleTable({ vehicles, renderActions, variant = 'default' }) {
  const { t } = useTranslation();
  const hasActions = Boolean(renderActions);

  if (variant === 'building') {
    return (
      <div className={`table-wrap vehicle-table-wrap-building${hasActions ? ' vehicle-table-has-actions' : ''}`}>
        <table className="data-table vehicle-table-building">
          <thead>
            <tr>
              <th>{t('tables.common.licensePlate')}</th>
              <th>{t('tables.common.vehicleType')}</th>
              <th>{t('tables.common.room')}</th>
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
                  {vehicleBrandText(vehicle, t) && <small>{vehicleBrandText(vehicle, t)}</small>}
                </td>
                <td>{formatEnumLabel(t, 'vehicleType', vehicle.vehicleType)}</td>
                <td>
                  <strong>{formatRoomCode(vehicle)}</strong>
                </td>
                <td>
                  <strong>{vehicle.ownerName || t('common.notProvided')}</strong>
                  <small>{formatEnumLabel(t, 'vehicleOwnerType', vehicle.ownerType)}</small>
                </td>
                <td>{vehicleRegistrationDateText(vehicle, t)}</td>
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

  if (variant === 'resident') {
    return (
      <div className="table-wrap vehicle-table-wrap-resident">
        <table className="data-table vehicle-table-resident">
          <colgroup>
            <col className="vehicle-col-plate" />
            <col className="vehicle-col-type" />
            <col className="vehicle-col-owner" />
            <col className="vehicle-col-date" />
            <col className="vehicle-col-status" />
            {hasActions && <col className="vehicle-col-actions" />}
          </colgroup>
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
