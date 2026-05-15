import { resolveFileUrl } from '../utils/fileUrl.js';

function formatNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue)
    ? numberValue.toLocaleString('en-US', { maximumFractionDigits: 2 })
    : value;
}

function evidenceLinks(reading) {
  return (
    <div className="evidence-links">
      <a href={resolveFileUrl(reading.electricityImageUrl)} target="_blank" rel="noreferrer">
        Electricity
      </a>
      <a href={resolveFileUrl(reading.waterImageUrl)} target="_blank" rel="noreferrer">
        Water
      </a>
    </div>
  );
}

export default function UtilityReadingTable({ readings, renderActions }) {
  const hasActions = Boolean(renderActions);

  return (
    <div className="table-wrap">
      <table className="data-table utility-reading-table">
        <thead>
          <tr>
            <th>Room</th>
            <th>Month</th>
            <th>Electricity</th>
            <th>Water</th>
            <th>Evidence</th>
            <th>Created by</th>
            <th>Edit reason</th>
            {hasActions && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {readings.map((reading) => (
            <tr key={reading.id}>
              <td>
                <strong>{reading.roomCode}</strong>
                <span className="table-subtext">{reading.buildingCode}</span>
              </td>
              <td>{reading.month}</td>
              <td>
                {formatNumber(reading.oldElectricity)} to {formatNumber(reading.newElectricity)}
                <span className="table-subtext">Usage: {formatNumber(reading.electricityUsage)}</span>
              </td>
              <td>
                {formatNumber(reading.oldWater)} to {formatNumber(reading.newWater)}
                <span className="table-subtext">Usage: {formatNumber(reading.waterUsage)}</span>
              </td>
              <td>{evidenceLinks(reading)}</td>
              <td>
                <strong>{reading.createdByName}</strong>
                <span className="table-subtext">{reading.createdByRole}</span>
              </td>
              <td>{reading.editReason || 'Not edited'}</td>
              {hasActions && <td>{renderActions(reading)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
      {readings.length === 0 && <div className="empty-state flat-empty-state">No utility readings found.</div>}
    </div>
  );
}
