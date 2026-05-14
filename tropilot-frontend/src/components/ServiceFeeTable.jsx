import {
  getCalculationTypeLabel,
  getFeeTypeLabel,
  getServiceFeeVehicleTypeLabel,
  isServiceFeeActive
} from '../utils/serviceFeeOptions.js';

function formatNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue)
    ? numberValue.toLocaleString('en-US', { maximumFractionDigits: 2 })
    : value;
}

export default function ServiceFeeTable({ serviceFees, renderActions }) {
  const hasActions = Boolean(renderActions);

  return (
    <div className="table-wrap">
      <table className="data-table service-fee-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Name</th>
            <th>Fee type</th>
            <th>Calculation</th>
            <th>Vehicle type</th>
            <th>Unit price</th>
            <th>Status</th>
            {hasActions && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {serviceFees.map((serviceFee) => {
            const active = isServiceFeeActive(serviceFee);

            return (
              <tr key={serviceFee.id}>
                <td>{serviceFee.feeCode}</td>
                <td>{serviceFee.name}</td>
                <td>{getFeeTypeLabel(serviceFee.feeType)}</td>
                <td>{getCalculationTypeLabel(serviceFee.calculationType)}</td>
                <td>{getServiceFeeVehicleTypeLabel(serviceFee.vehicleType)}</td>
                <td>{formatNumber(serviceFee.unitPrice)}</td>
                <td>
                  <span className={`status-pill status-${active ? 'active' : 'inactive'}`}>
                    {active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                {hasActions && <td>{renderActions(serviceFee)}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
      {serviceFees.length === 0 && <div className="empty-state flat-empty-state">No service fees found.</div>}
    </div>
  );
}
