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

function billableClass(vehicle) {
  return vehicle.billable ? 'billable-pill billable-active' : 'billable-pill billable-inactive';
}

export default function VehicleTable({ vehicles, renderActions }) {
  const { t } = useTranslation();
  const hasActions = Boolean(renderActions);

  return (
    <div className="table-wrap">
      <table className="data-table vehicle-table">
        <thead>
          <tr>
            <th>{t('tables.common.room')}</th>
            <th>{t('tables.common.owner')}</th>
            <th>{t('tables.common.vehicle')}</th>
            <th>{t('tables.common.licensePlate')}</th>
            <th>{t('tables.common.period')}</th>
            <th>{t('tables.common.status')}</th>
            <th>{t('common.billable')}</th>
            {hasActions && <th>{t('tables.common.actions')}</th>}
          </tr>
        </thead>
        <tbody>
          {vehicles.map((vehicle) => (
            <tr key={vehicle.id}>
              <td>
                <strong>{formatRoomCode(vehicle)}</strong>
                <span className="table-subtext">{vehicle.buildingCode}</span>
              </td>
              <td>
                <strong>{vehicle.ownerName}</strong>
                <span className="table-subtext">{formatEnumLabel(t, 'vehicleOwnerType', vehicle.ownerType)}</span>
              </td>
              <td>
                <strong>{formatEnumLabel(t, 'vehicleType', vehicle.vehicleType)}</strong>
                <span className="table-subtext">
                  {displayText(vehicle.brand, t('common.notProvided'))}
                  {vehicle.color ? `, ${vehicle.color}` : ''}
                </span>
              </td>
              <td>{vehicle.licensePlate}</td>
              <td>{periodText(vehicle, t)}</td>
              <td>
                <span className={getVehicleStatusClass(vehicle.status)}>{formatEnumLabel(t, 'vehicleStatus', vehicle.status)}</span>
              </td>
              <td>
                <span className={billableClass(vehicle)}>{vehicle.billable ? t('common.billable') : t('common.notBillable')}</span>
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
