import { useTranslation } from 'react-i18next';
import { getMaintenanceStatusClass } from '../utils/maintenanceOptions.js';
import { resolveFileUrl } from '../utils/fileUrl.js';
import { formatDateTime, formatEnumLabel } from '../utils/i18nFormat.js';
import { formatRoomLabel } from '../utils/roomDisplay.js';

export default function MaintenanceRequestDetail({ request }) {
  const { t } = useTranslation();

  if (!request) {
    return <div className="empty-state">{t('details.selectMaintenanceRequest')}</div>;
  }

  return (
    <section className="maintenance-detail-panel">
      <div className="detail-panel">
        <div>
          <span>{t('details.title')}</span>
          <strong>{request.title}</strong>
        </div>
        <div>
          <span>{t('tables.common.status')}</span>
          <strong>
            <span className={getMaintenanceStatusClass(request.status)}>
              {formatEnumLabel(t, 'maintenanceStatus', request.status)}
            </span>
          </strong>
        </div>
        <div>
          <span>{t('tables.common.room')}</span>
          <strong>{request.roomId ? formatRoomLabel(request) : t('equipment.scopes.BUILDING')}</strong>
        </div>
        <div>
          <span>{t('tables.common.building')}</span>
          <strong>
            {request.buildingCode} - {request.buildingName}
          </strong>
        </div>
        <div>
          <span>{t('tables.common.requestedBy')}</span>
          <strong>{request.requestedByName || request.residentHeadName || t('common.notProvided')}</strong>
        </div>
        {request.equipmentId && (
          <div>
            <span>{t('navigation.equipment')}</span>
            <strong>{request.equipmentCode} - {request.equipmentName}</strong>
          </div>
        )}
        <div>
          <span>{t('tables.common.assignedStaff')}</span>
          <strong>{request.assignedToName || t('common.notAssigned')}</strong>
        </div>
        <div>
          <span>{t('tables.common.created')}</span>
          <strong>{formatDateTime(request.createdAt, t)}</strong>
        </div>
        <div>
          <span>{t('tables.common.updated')}</span>
          <strong>{formatDateTime(request.updatedAt, t)}</strong>
        </div>
        <div className="detail-wide">
          <span>{t('tables.common.content')}</span>
          <p>{request.content}</p>
        </div>
        <div className="detail-wide">
          <span>{t('tables.common.resultNote')}</span>
          <p>{request.resultNote || t('details.noResultNote')}</p>
        </div>
        <div className="detail-wide">
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
    </section>
  );
}
