import {
  formatMaintenanceDateTime,
  getMaintenanceStatusClass,
  getMaintenanceStatusLabel
} from '../utils/maintenanceOptions.js';
import { resolveFileUrl } from '../utils/fileUrl.js';

function roomText(request) {
  return `${request.roomCode} - ${request.roomName}`;
}

export default function MaintenanceRequestTable({ requests, renderActions, onSelect, selectedId }) {
  const hasActions = Boolean(renderActions);

  return (
    <div className="table-wrap">
      <table className="data-table maintenance-table">
        <thead>
          <tr>
            <th>Request</th>
            <th>Room</th>
            <th>Head resident</th>
            <th>Assigned staff</th>
            <th>Status</th>
            <th>Images</th>
            <th>Created</th>
            {hasActions && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            <tr
              key={request.id}
              className={selectedId === request.id ? 'selected-row' : undefined}
              onClick={onSelect ? () => onSelect(request) : undefined}
            >
              <td>
                <strong>{request.title}</strong>
                <span className="table-subtext">{request.content}</span>
              </td>
              <td>
                <strong>{roomText(request)}</strong>
                <span className="table-subtext">{request.buildingCode}</span>
              </td>
              <td>
                <strong>{request.residentHeadName}</strong>
                <span className="table-subtext">{request.residentHeadEmail}</span>
              </td>
              <td>
                {request.assignedToName ? (
                  <>
                    <strong>{request.assignedToName}</strong>
                    <span className="table-subtext">{request.assignedToEmail}</span>
                  </>
                ) : (
                  'Not assigned'
                )}
              </td>
              <td>
                <span className={getMaintenanceStatusClass(request.status)}>
                  {getMaintenanceStatusLabel(request.status)}
                </span>
              </td>
              <td>
                <div className="evidence-links">
                  {request.imageUrl && (
                    <a href={resolveFileUrl(request.imageUrl)} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>
                      Issue
                    </a>
                  )}
                  {request.resultImageUrl && (
                    <a
                      href={resolveFileUrl(request.resultImageUrl)}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(event) => event.stopPropagation()}
                    >
                      Result
                    </a>
                  )}
                  {!request.imageUrl && !request.resultImageUrl && 'Not provided'}
                </div>
              </td>
              <td>{formatMaintenanceDateTime(request.createdAt)}</td>
              {hasActions && <td onClick={(event) => event.stopPropagation()}>{renderActions(request)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
      {requests.length === 0 && <div className="empty-state flat-empty-state">No maintenance requests found.</div>}
    </div>
  );
}
