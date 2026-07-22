import { useTranslation } from 'react-i18next';
import { getMaintenanceStatusClass } from '../utils/maintenanceOptions.js';
import { resolveFileUrl } from '../utils/fileUrl.js';
import { formatDateTime, formatEnumLabel } from '../utils/i18nFormat.js';
import { formatRoomLabel } from '../utils/roomDisplay.js';
import LineIcon from './common/LineIcon.jsx';

function getStatusTone(status) {
  if (status === 'COMPLETED') {
    return 'green';
  }
  if (status === 'IN_PROGRESS') {
    return 'amber';
  }
  return 'blue';
}

function DetailItem({ icon, tone = 'blue', label, children }) {
  return (
    <div className="maintenance-detail-field">
      <span className={`maintenance-detail-icon maintenance-detail-icon-${tone}`} aria-hidden="true">
        <LineIcon name={icon} />
      </span>
      <div className="maintenance-detail-copy">
        <span>{label}</span>
        <strong>{children}</strong>
      </div>
    </div>
  );
}

export default function MaintenanceRequestDetail({ request }) {
  const { t } = useTranslation();

  if (!request) {
    return <div className="empty-state">{t('details.selectMaintenanceRequest')}</div>;
  }

  return (
    <section className="maintenance-detail-panel">
      <div className="detail-panel maintenance-detail-card">
        <DetailItem icon="fileText" label={t('details.title')}>
          {request.title}
        </DetailItem>
        <DetailItem icon="checkShield" label={t('tables.common.status')} tone={getStatusTone(request.status)}>
          <>
            <span className={getMaintenanceStatusClass(request.status)}>
              {formatEnumLabel(t, 'maintenanceStatus', request.status)}
            </span>
          </>
        </DetailItem>
        <DetailItem icon="home" label={t('tables.common.room')} tone="indigo">
          {request.roomId ? formatRoomLabel(request) : t('equipment.scopes.BUILDING')}
        </DetailItem>
        <DetailItem icon="building" label={t('tables.common.building')}>
          {request.buildingCode} - {request.buildingName}
        </DetailItem>
        <DetailItem icon="user" label={t('tables.common.requestedBy')} tone="cyan">
          {request.requestedByName || request.residentHeadName || t('common.notProvided')}
        </DetailItem>
        {request.equipmentId && (
          <DetailItem icon="tool" label={t('navigation.equipment')} tone="violet">
            {request.equipmentCode} - {request.equipmentName}
          </DetailItem>
        )}
        <DetailItem icon="userCheck" label={t('tables.common.assignedStaff')} tone="green">
          {request.assignedToName || t('common.notAssigned')}
        </DetailItem>
        <DetailItem icon="calendar" label={t('tables.common.created')} tone="amber">
          {formatDateTime(request.createdAt, t)}
        </DetailItem>
        <DetailItem icon="clock" label={t('tables.common.updated')} tone="blue">
          {formatDateTime(request.updatedAt, t)}
        </DetailItem>
      </div>

      <div className="maintenance-detail-note-grid">
        <div className="maintenance-detail-note-field">
          <span className="maintenance-detail-icon maintenance-detail-icon-blue" aria-hidden="true">
            <LineIcon name="fileText" />
          </span>
          <div className="maintenance-detail-copy">
            <span>{t('tables.common.content')}</span>
            <p>{request.content}</p>
          </div>
        </div>
        <div className="maintenance-detail-note-field maintenance-detail-result-field">
          <span className="maintenance-detail-icon maintenance-detail-icon-cyan" aria-hidden="true">
            <LineIcon name="feedback" />
          </span>
          <div className="maintenance-detail-copy">
            <span>{t('tables.common.resultNote')}</span>
            <p>{request.resultNote || t('details.noResultNote')}</p>
          </div>
        </div>
        <div className="maintenance-detail-note-field maintenance-detail-image-field">
          <span className="maintenance-detail-icon maintenance-detail-icon-indigo" aria-hidden="true">
            <LineIcon name="image" />
          </span>
          <div className="maintenance-detail-copy">
            <span>{t('tables.common.images')}</span>
            <div className="evidence-links">
            {request.imageUrl && (
              <a href={resolveFileUrl(request.imageUrl)} target="_blank" rel="noreferrer">
                {t('details.issueImage')}
              </a>
            )}
            {request.resultImageUrl && (
              <a href={resolveFileUrl(request.resultImageUrl)} target="_blank" rel="noreferrer">
                {t('details.resultImage')}
              </a>
            )}
            {!request.imageUrl && !request.resultImageUrl && t('common.notProvided')}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
