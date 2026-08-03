import { useTranslation } from 'react-i18next';
import { formatDisplayDate } from '../utils/dateFormat.js';
import { getEquipmentConditionClass } from '../utils/equipmentOptions.js';
import { formatRoomLabel } from '../utils/roomDisplay.js';

const DEFAULT_COLUMNS = [
  'code',
  'name',
  'assignedTo',
  'location',
  'installationDate',
  'condition',
  'maintenanceSchedule'
];

/** Tạo nhãn tòa nhà dễ đọc cho một thiết bị trong bảng. */
function formatBuildingLabel(item) {
  return item.buildingName || item.buildingCode || '';
}

/** Lấy riêng mã phòng khi thiết bị được gán cho một phòng. */
function formatRoomCodeOnly(item) {
  const roomCode = item.roomCode || '';
  const buildingCode = item.buildingCode || '';
  const prefix = `${buildingCode}-`;

  if (buildingCode && roomCode.startsWith(prefix)) {
    return roomCode.slice(prefix.length);
  }

  return roomCode || item.roomName || formatRoomLabel(item);
}

/** Bảng thiết bị dùng chung, cho phép trang gọi chọn cột và ô thao tác cần hiển thị. */
export default function EquipmentTable({ equipment, renderActions, visibleColumns = DEFAULT_COLUMNS }) {
  const { t } = useTranslation();
  const hasActions = Boolean(renderActions);
  const activeColumns = hasActions && !visibleColumns.includes('actions')
    ? [...visibleColumns, 'actions']
    : visibleColumns;

  const columns = {
    code: {
      header: t('equipment.fields.code'),
      cell: (item) => (
        <span className="equipment-code-cell">
          <strong>{item.equipmentCode}</strong>
        </span>
      )
    },
    name: {
      header: t('equipment.fields.name'),
      cell: (item) => (
        <span className="equipment-name-cell">
          <strong>{item.name}</strong>
        </span>
      )
    },
    assignedTo: {
      header: t('equipment.fields.assignedTo'),
      cell: (item) => (
        <span className="equipment-assigned-cell">
          <strong>{item.scope === 'ROOM' ? formatRoomCodeOnly(item) : formatBuildingLabel(item)}</strong>
        </span>
      )
    },
    location: {
      header: t('equipment.fields.location'),
      cell: (item) => item.locationDescription || t('common.notProvided')
    },
    installationDate: {
      header: t('equipment.fields.installationDate'),
      cell: (item) => formatDisplayDate(item.installationDate, t('common.notProvided'))
    },
    condition: {
      header: t('equipment.fields.condition'),
      cell: (item) => (
        <span className={getEquipmentConditionClass(item.condition)}>
          {t(`equipment.conditions.${item.condition}`)}
        </span>
      )
    },
    maintenanceSchedule: {
      header: t('equipment.fields.maintenanceSchedule'),
      cell: (item) => (
        <>
          <strong>
            {formatDisplayDate(item.nextMaintenanceDate, t('equipment.messages.noScheduledMaintenance'))}
          </strong>
          <span className="table-subtext">
            {t('equipment.labels.lastMaintenance')}:&nbsp;
            {formatDisplayDate(item.lastMaintenanceDate, t('common.notProvided'))}
          </span>
        </>
      )
    },
    actions: {
      header: t('tables.common.actions'),
      cell: (item) => renderActions(item)
    }
  };

  return (
    <div className="table-wrap">
      <table className={`data-table equipment-table ${activeColumns.length <= 5 ? 'compact-equipment-table' : ''}`}>
        <thead>
          <tr>
            {activeColumns.map((columnKey) => (
              <th key={columnKey} className={`equipment-col-${columnKey}`}>{columns[columnKey].header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {equipment.map((item) => (
            <tr key={item.id}>
              {activeColumns.map((columnKey) => (
                <td key={columnKey} className={`equipment-col-${columnKey}`}>{columns[columnKey].cell(item)}</td>
              ))}
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
