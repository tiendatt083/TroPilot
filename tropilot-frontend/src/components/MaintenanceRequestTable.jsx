import { useTranslation } from 'react-i18next';
import { getMaintenanceStatusClass } from '../utils/maintenanceOptions.js';
import { resolveFileUrl } from '../utils/fileUrl.js';
import { formatDateTime, formatEnumLabel } from '../utils/i18nFormat.js';
import { formatRoomLabel } from '../utils/roomDisplay.js';

function roomText(request, t) {
  return request.roomId ? formatRoomLabel(request) : t('equipment.scopes.BUILDING');
}

export default function MaintenanceRequestTable({ requests, renderActions, onSelect, selectedId }) {
  const { t } = useTranslation();
  const hasActions = Boolean(renderActions);

  return (
    <div className="table-wrap">
      <table className="data-table maintenance-table">
        <thead>
          <tr>
            <th>{t('tables.common.request')}</th>
            <th>{t('tables.common.room')}</th>
            <th>{t('tables.common.requestedBy')}</th>
            <th>{t('tables.common.assignedStaff')}</th>
            <th>{t('tables.common.status')}</th>
            <th>{t('tables.common.images')}</th>
            <th>{t('tables.common.created')}</th>
            {hasActions && <th>{t('tables.common.actions')}</th>}
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
                {request.equipmentId && (
                  <span className="table-subtext">
                    {t('navigation.equipment')}: {request.equipmentCode} - {request.equipmentName}
                  </span>
                )}
              </td>
              <td>
                <strong>{roomText(request, t)}</strong>
                <span className="table-subtext">{request.buildingCode}</span>
              </td>
              <td>
                <strong>{request.requestedByName || request.residentHeadName || t('common.notProvided')}</strong>
                <span className="table-subtext">{request.requestedByEmail || request.residentHeadEmail}</span>
              </td>
              <td>
                {request.assignedToName ? (
                  <>
                    <strong>{request.assignedToName}</strong>
                    <span className="table-subtext">{request.assignedToEmail}</span>
                  </>
                ) : (
                  t('common.notAssigned')
                )}
              </td>
              <td>
                <span className={getMaintenanceStatusClass(request.status)}>
                  {formatEnumLabel(t, 'maintenanceStatus', request.status)}
                </span>
              </td>
              <td>
                <div className="evidence-links">
                  {request.imageUrl && (
                    <a href={resolveFileUrl(request.imageUrl)} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>
                      {t('tables.maintenanceRequests.issue')}
                    </a>
                  )}
                  {request.resultImageUrl && (
                    <a
                      href={resolveFileUrl(request.resultImageUrl)}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {t('tables.maintenanceRequests.result')}
                    </a>
                  )}
                  {!request.imageUrl && !request.resultImageUrl && t('common.notProvided')}
                </div>
              </td>
              <td>{formatDateTime(request.createdAt, t)}</td>
              {hasActions && <td onClick={(event) => event.stopPropagation()}>{renderActions(request)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
      {requests.length === 0 && <div className="empty-state flat-empty-state">{t('tables.maintenanceRequests.empty')}</div>}
    </div>
  );
}
