import { useTranslation } from 'react-i18next';
import { getMaintenanceStatusClass } from '../utils/maintenanceOptions.js';
import { formatEnumLabel } from '../utils/i18nFormat.js';

function canAssign(status) {
  return status === 'PENDING';
}

export default function MaintenanceAssignmentAction({
  request,
  staffUsers,
  assignedToId,
  processing,
  onAssignmentChange,
  onAssign
}) {
  const { t } = useTranslation();

  if (!canAssign(request.status)) {
    return (
      <span className={getMaintenanceStatusClass(request.status)}>
        {formatEnumLabel(t, 'maintenanceStatus', request.status)}
      </span>
    );
  }

  return (
    <div className="assignment-action-row">
      <select
        value={assignedToId || ''}
        disabled={processing}
        onChange={(event) => onAssignmentChange(request.id, event.target.value)}
      >
        <option value="">{t('maintenance.admin.selectStaff')}</option>
        {staffUsers.map((staff) => (
          <option key={staff.id} value={staff.id}>
            {staff.fullName}
          </option>
        ))}
      </select>
      <button
        className="secondary-button compact-button"
        type="button"
        disabled={processing}
        onClick={() => onAssign(request)}
      >
        {t('maintenance.admin.assign')}
      </button>
    </div>
  );
}
