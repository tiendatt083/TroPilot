import {
  formatMaintenanceDateTime,
  getMaintenanceStatusClass,
  getMaintenanceStatusLabel
} from '../utils/maintenanceOptions.js';
import { resolveFileUrl } from '../utils/fileUrl.js';

export default function MaintenanceRequestDetail({ request }) {
  if (!request) {
    return <div className="empty-state">Select a maintenance request to view details.</div>;
  }

  return (
    <section className="maintenance-detail-panel">
      <div className="detail-panel">
        <div>
          <span>Title</span>
          <strong>{request.title}</strong>
        </div>
        <div>
          <span>Status</span>
          <strong>
            <span className={getMaintenanceStatusClass(request.status)}>
              {getMaintenanceStatusLabel(request.status)}
            </span>
          </strong>
        </div>
        <div>
          <span>Room</span>
          <strong>
            {request.roomCode} - {request.roomName}
          </strong>
        </div>
        <div>
          <span>Building</span>
          <strong>
            {request.buildingCode} - {request.buildingName}
          </strong>
        </div>
        <div>
          <span>Head resident</span>
          <strong>{request.residentHeadName}</strong>
        </div>
        <div>
          <span>Assigned staff</span>
          <strong>{request.assignedToName || 'Not assigned'}</strong>
        </div>
        <div>
          <span>Created</span>
          <strong>{formatMaintenanceDateTime(request.createdAt)}</strong>
        </div>
        <div>
          <span>Updated</span>
          <strong>{formatMaintenanceDateTime(request.updatedAt)}</strong>
        </div>
        <div className="detail-wide">
          <span>Content</span>
          <p>{request.content}</p>
        </div>
        <div className="detail-wide">
          <span>Result note</span>
          <p>{request.resultNote || 'No result note provided.'}</p>
        </div>
        <div className="detail-wide">
          <span>Images</span>
          <div className="evidence-links">
            {request.imageUrl && (
              <a href={resolveFileUrl(request.imageUrl)} target="_blank" rel="noreferrer">
                Issue image
              </a>
            )}
            {request.resultImageUrl && (
              <a href={resolveFileUrl(request.resultImageUrl)} target="_blank" rel="noreferrer">
                Result image
              </a>
            )}
            {!request.imageUrl && !request.resultImageUrl && 'Not provided'}
          </div>
        </div>
      </div>
    </section>
  );
}
