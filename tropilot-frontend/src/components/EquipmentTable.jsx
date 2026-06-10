import { useTranslation } from 'react-i18next';
import { formatDisplayDate } from '../utils/dateFormat.js';
import { getEquipmentConditionClass } from '../utils/equipmentOptions.js';
import { formatRoomLabel } from '../utils/roomDisplay.js';

export default function EquipmentTable({ equipment, renderActions }) {
  const { t } = useTranslation();
  const hasActions = Boolean(renderActions);

  return (
    <div className="table-wrap">
      <table className="data-table equipment-table">
        <thead>
          <tr>
            <th>{t('equipment.fields.code')}</th>
            <th>{t('equipment.fields.name')}</th>
            <th>{t('equipment.fields.assignedTo')}</th>
            <th>{t('equipment.fields.location')}</th>
            <th>{t('equipment.fields.installationDate')}</th>
            <th>{t('equipment.fields.condition')}</th>
            <th>{t('equipment.fields.maintenanceSchedule')}</th>
            {hasActions && <th>{t('tables.common.actions')}</th>}
          </tr>
        </thead>
        <tbody>
          {equipment.map((item) => (
            <tr key={item.id}>
              <td>
                <strong>{item.equipmentCode}</strong>
                <span className="table-subtext">{t(`equipment.scopes.${item.scope}`)}</span>
              </td>
              <td>
                <strong>{item.name}</strong>
                <span className="table-subtext">{item.buildingCode} - {item.buildingName}</span>
              </td>
              <td>
                <strong>
                  {item.scope === 'ROOM' ? formatRoomLabel(item) : t('equipment.scopes.BUILDING')}
                </strong>
                <span className="table-subtext">
                  {item.scope === 'ROOM' ? item.buildingName : item.buildingCode}
                </span>
              </td>
              <td>{item.locationDescription || t('common.notProvided')}</td>
              <td>{formatDisplayDate(item.installationDate, t('common.notProvided'))}</td>
              <td>
                <span className={getEquipmentConditionClass(item.condition)}>
                  {t(`equipment.conditions.${item.condition}`)}
                </span>
              </td>
              <td>
                <strong>
                  {formatDisplayDate(item.nextMaintenanceDate, t('equipment.messages.noScheduledMaintenance'))}
                </strong>
                <span className="table-subtext">
                  {t('equipment.labels.lastMaintenance')}:&nbsp;
                  {formatDisplayDate(item.lastMaintenanceDate, t('common.notProvided'))}
                </span>
              </td>
              {hasActions && <td>{renderActions(item)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
      {equipment.length === 0 && (
        <div className="empty-state flat-empty-state">{t('equipment.messages.empty')}</div>
      )}
    </div>
  );
}
