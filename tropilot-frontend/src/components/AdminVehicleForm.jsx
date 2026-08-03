import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { VEHICLE_OWNER_TYPE_OPTIONS, VEHICLE_TYPE_OPTIONS } from '../utils/vehicleOptions.js';
import { formatRoomCode } from '../utils/roomDisplay.js';

/** Tạo dữ liệu mặc định của form đăng ký xe từ danh sách phòng/thành viên có thể chọn. */
function createInitialForm(assignments) {
  const firstAssignment = assignments[0];

  return {
    residentHeadId: firstAssignment?.residentHeadId ? String(firstAssignment.residentHeadId) : '',
    roomId: firstAssignment?.roomId ? String(firstAssignment.roomId) : '',
    roomMemberId: '',
    ownerType: 'RESIDENT_HEAD',
    vehicleType: 'MOTORBIKE',
    licensePlate: ''
  };
}

/** Form để quản trị viên đăng ký xe cho một chủ hộ hoặc thành viên phòng. */
export default function AdminVehicleForm({ assignments, loading, members, onCancel, onSubmit }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(() => createInitialForm(assignments));

  const headAssignments = useMemo(() => {
    const seen = new Set();
    return assignments.filter((assignment) => {
      if (!assignment.residentHeadId || seen.has(assignment.residentHeadId)) {
        return false;
      }

      seen.add(assignment.residentHeadId);
      return true;
    });
  }, [assignments]);

  const roomOptions = useMemo(() => (
    assignments.filter((assignment) => String(assignment.residentHeadId) === form.residentHeadId)
  ), [assignments, form.residentHeadId]);

  const memberOptions = useMemo(() => (
    members.filter((member) => (
      String(member.residentHeadId) === form.residentHeadId
      && String(member.roomId) === form.roomId
      && member.status === 'APPROVED'
    ))
  ), [form.residentHeadId, form.roomId, members]);

  const requiresMemberOwner = form.ownerType === 'ROOM_MEMBER';
  const canSubmit = Boolean(form.residentHeadId && form.roomId && form.vehicleType && form.licensePlate.trim())
    && (!requiresMemberOwner || Boolean(form.roomMemberId));

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => {
      const nextForm = {
        ...current,
        [name]: value
      };

      if (name === 'residentHeadId') {
        const firstRoom = assignments.find((assignment) => String(assignment.residentHeadId) === value);
        nextForm.roomId = firstRoom?.roomId ? String(firstRoom.roomId) : '';
        nextForm.roomMemberId = '';
      }

      if (name === 'roomId') {
        nextForm.roomMemberId = '';
      }

      if (name === 'ownerType' && value === 'RESIDENT_HEAD') {
        nextForm.roomMemberId = '';
      }

      return nextForm;
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    onSubmit({
      residentHeadId: Number(form.residentHeadId),
      roomId: Number(form.roomId),
      roomMemberId: requiresMemberOwner ? Number(form.roomMemberId) : null,
      ownerType: form.ownerType,
      vehicleType: form.vehicleType,
      licensePlate: form.licensePlate.trim()
    });
  };

  return (
    <form className="panel-form admin-vehicle-form" onSubmit={handleSubmit}>
      <div className="admin-vehicle-field admin-vehicle-field-full">
        <label htmlFor="adminVehicleOwnerType">{t('workspace.vehicles.form.ownerType')}</label>
        <select
          id="adminVehicleOwnerType"
          name="ownerType"
          value={form.ownerType}
          onChange={handleChange}
          required
          disabled={loading || headAssignments.length === 0}
        >
          {VEHICLE_OWNER_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {t(`enum.vehicleOwnerType.${option.value}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="admin-vehicle-form-row">
        <div className="admin-vehicle-field">
          <label htmlFor="adminVehicleHead">{t('workspace.vehicles.form.headResident')}</label>
          <select
            id="adminVehicleHead"
            name="residentHeadId"
            value={form.residentHeadId}
            onChange={handleChange}
            required
            disabled={loading || headAssignments.length === 0}
          >
            <option value="">{t('workspace.vehicles.form.selectHeadResident')}</option>
            {headAssignments.map((assignment) => (
              <option key={assignment.residentHeadId} value={assignment.residentHeadId}>
                {assignment.residentHeadName}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-vehicle-field">
          <label htmlFor="adminVehicleMember">{t('workspace.vehicles.form.roomMember')}</label>
          <select
            id="adminVehicleMember"
            name="roomMemberId"
            value={form.roomMemberId}
            onChange={handleChange}
            required={requiresMemberOwner}
            disabled={loading || !requiresMemberOwner || memberOptions.length === 0}
          >
            <option value="">
              {memberOptions.length > 0
                ? t('workspace.vehicles.form.selectRoomMember')
                : t('workspace.vehicles.form.noRoomMembers')}
            </option>
            {memberOptions.map((member) => (
              <option key={member.id} value={member.id}>
                {member.fullName}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="admin-vehicle-form-row">
        <div className="admin-vehicle-field">
          <label htmlFor="adminVehicleRoom">{t('workspace.vehicles.form.room')}</label>
          <select
            id="adminVehicleRoom"
            name="roomId"
            value={form.roomId}
            onChange={handleChange}
            required
            disabled={loading || roomOptions.length === 0}
          >
            <option value="">{t('workspace.vehicles.form.selectRoom')}</option>
            {roomOptions.map((assignment) => (
              <option key={assignment.roomId} value={assignment.roomId}>
                {formatRoomCode(assignment)}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-vehicle-field">
          <label htmlFor="adminVehicleType">{t('workspace.vehicles.form.vehicleType')}</label>
          <select
            id="adminVehicleType"
            name="vehicleType"
            value={form.vehicleType}
            onChange={handleChange}
            required
            disabled={loading || headAssignments.length === 0}
          >
            {VEHICLE_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {t(`enum.vehicleType.${option.value}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="admin-vehicle-field admin-vehicle-field-full">
        <label htmlFor="adminVehicleLicensePlate">{t('workspace.vehicles.form.licensePlate')}</label>
        <input
          id="adminVehicleLicensePlate"
          name="licensePlate"
          value={form.licensePlate}
          onChange={handleChange}
          maxLength={30}
          required
          disabled={loading || headAssignments.length === 0}
        />
      </div>

      {headAssignments.length === 0 && (
        <p className="field-help">{t('workspace.vehicles.form.noHeadResidents')}</p>
      )}

      <div className="form-action-row form-action-row-right">
        <button type="submit" disabled={loading || !canSubmit}>
          {loading ? t('workspace.vehicles.form.creating') : t('workspace.vehicles.form.create')}
        </button>
        <button className="secondary-button inline-button" type="button" disabled={loading} onClick={onCancel}>
          {t('common.cancel')}
        </button>
      </div>
    </form>
  );
}
