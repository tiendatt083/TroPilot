import { useTranslation } from 'react-i18next';
import { getMaintenanceStatusClass } from '../utils/maintenanceOptions.js';
import { openFileUrl, resolveFileUrl } from '../utils/fileUrl.js';
import { formatDateTime, formatEnumLabel } from '../utils/i18nFormat.js';
import { formatRoomLabel } from '../utils/roomDisplay.js';

/** Tạo nhãn phòng cho yêu cầu bảo trì, có thông báo thay thế khi chưa gán phòng. */
function roomText(request, t) {
  if (!request.roomId) {
    return t('equipment.scopes.BUILDING');
  }

  return request.roomCode || formatRoomLabel(request).split(' - ')[0];
}

/** Bảng danh sách yêu cầu bảo trì; hỗ trợ chọn một yêu cầu để xem chi tiết bên cạnh. */
export default function MaintenanceRequestTable({ requests, renderActions, onSelect, selectedId }) {
  const { t } = useTranslation();
  const hasActions = Boolean(renderActions);

  return (
    <div className="table-wrap">
      <table className="data-table maintenance-table">
        <thead>
          <tr>
            <th className="maintenance-col-request">{t('tables.common.request')}</th>
            <th className="maintenance-col-room">{t('tables.common.room')}</th>
            <th className="maintenance-col-requestedBy">{t('tables.common.requestedBy')}</th>
            <th className="maintenance-col-staff">{t('role.staff')}</th>
            <th className="maintenance-col-status">{t('tables.common.status')}</th>
            <th className="maintenance-col-images">{t('tables.common.images')}</th>
            <th className="maintenance-col-created">{t('tables.common.created')}</th>
            {hasActions && <th className="maintenance-col-actions">{t('tables.common.actions')}</th>}
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            <tr
              key={request.id}
              className={selectedId === request.id ? 'selected-row' : undefined}
              onClick={onSelect ? () => onSelect(request) : undefined}
            >
              <td className="maintenance-col-request">
                <strong>{request.title}</strong>
                <span className="table-subtext">{request.content}</span>
                {request.equipmentId && (
                  <span className="table-subtext">
                    {t('navigation.equipment')}: {request.equipmentCode} - {request.equipmentName}
                  </span>
                )}
              </td>
              <td className="maintenance-col-room">
                <strong>{roomText(request, t)}</strong>
              </td>
              <td className="maintenance-col-requestedBy">
                <strong>{request.requestedByName || request.residentHeadName || t('common.notProvided')}</strong>
              </td>
              <td className="maintenance-col-staff">
                {request.assignedToName ? (
                  <strong>{request.assignedToName}</strong>
                ) : (
                  t('common.notAssigned')
                )}
              </td>
              <td className="maintenance-col-status">
                <span className={getMaintenanceStatusClass(request.status)}>
                  {formatEnumLabel(t, 'maintenanceStatus', request.status)}
                </span>
              </td>
              <td className="maintenance-col-images">
                <div className="evidence-links">
                  {request.imageUrl && (
                    <a href={resolveFileUrl(request.imageUrl)} target="_blank" rel="noreferrer" onClick={(event) => openFileUrl(request.imageUrl, event)}>
                      {t('tables.maintenanceRequests.issue')}
                    </a>
                  )}
                  {request.resultImageUrl && (
                    <a
                      href={resolveFileUrl(request.resultImageUrl)}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(event) => openFileUrl(request.resultImageUrl, event)}
                    >
                      {t('tables.maintenanceRequests.result')}
                    </a>
                  )}
                  {!request.imageUrl && !request.resultImageUrl && t('common.notProvided')}
                </div>
              </td>
              <td className="maintenance-col-created">{formatDateTime(request.createdAt, t)}</td>
              {hasActions && (
                <td className="maintenance-col-actions" onClick={(event) => event.stopPropagation()}>
                  {renderActions(request)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {requests.length === 0 && <div className="empty-state flat-empty-state">{t('tables.maintenanceRequests.empty')}</div>}
    </div>
  );
}
