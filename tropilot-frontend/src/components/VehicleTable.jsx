import {
  getVehicleOwnerTypeLabel,
  getVehicleStatusClass,
  getVehicleStatusLabel,
  getVehicleTypeLabel
} from '../utils/vehicleOptions.js';

function displayText(value, fallback = 'Not provided') {
  return value || fallback;
}

function periodText(vehicle) {
  const startDate = vehicle.startDate || 'Not set';
  const endDate = vehicle.endDate || 'Open';
  return `${startDate} to ${endDate}`;
}

function billableClass(vehicle) {
  return vehicle.billable ? 'billable-pill billable-active' : 'billable-pill billable-inactive';
}

export default function VehicleTable({ vehicles, renderActions }) {
  const hasActions = Boolean(renderActions);

  return (
    <div className="table-wrap">
      <table className="data-table vehicle-table">
        <thead>
          <tr>
            <th>Room</th>
            <th>Owner</th>
            <th>Vehicle</th>
            <th>License plate</th>
            <th>Period</th>
            <th>Status</th>
            <th>Billable</th>
            {hasActions && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {vehicles.map((vehicle) => (
            <tr key={vehicle.id}>
              <td>
                <strong>{vehicle.roomCode}</strong>
                <span className="table-subtext">{vehicle.buildingCode}</span>
              </td>
              <td>
                <strong>{vehicle.ownerName}</strong>
                <span className="table-subtext">{getVehicleOwnerTypeLabel(vehicle.ownerType)}</span>
              </td>
              <td>
                <strong>{getVehicleTypeLabel(vehicle.vehicleType)}</strong>
                <span className="table-subtext">
                  {displayText(vehicle.brand)}
                  {vehicle.color ? `, ${vehicle.color}` : ''}
                </span>
              </td>
              <td>{vehicle.licensePlate}</td>
              <td>{periodText(vehicle)}</td>
              <td>
                <span className={getVehicleStatusClass(vehicle.status)}>{getVehicleStatusLabel(vehicle.status)}</span>
              </td>
              <td>
                <span className={billableClass(vehicle)}>{vehicle.billable ? 'Billable' : 'Not billable'}</span>
              </td>
              {hasActions && <td>{renderActions(vehicle)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
      {vehicles.length === 0 && <div className="empty-state flat-empty-state">No vehicles found.</div>}
    </div>
  );
}
