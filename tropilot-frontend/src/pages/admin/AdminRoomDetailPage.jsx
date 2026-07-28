import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import * as buildingApi from '../../api/buildingApi.js';
import * as roomApi from '../../api/roomApi.js';
import * as adminUserApi from '../../api/adminUserApi.js';
import * as memberApi from '../../api/memberApi.js';
import useRoomRouteContext from '../../hooks/useRoomRouteContext.js';
import HeadResidentAssignmentForm from '../../components/HeadResidentAssignmentForm.jsx';
import RoomForm from '../../components/RoomForm.jsx';
import ActionDialog from '../../components/common/ActionDialog.jsx';
import LineIcon from '../../components/common/LineIcon.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import { formatDateInputValue, formatDisplayDate } from '../../utils/dateFormat.js';
import { formatEnumLabel } from '../../utils/i18nFormat.js';
import { translateInterfaceText } from '../../utils/interfaceTranslations.js';
import { formatRoomCode } from '../../utils/roomDisplay.js';

function formatNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue)
    ? numberValue.toLocaleString('en-US', { maximumFractionDigits: 2 })
    : value;
}

function formatMoney(value) {
  return `${formatNumber(value)} đ`;
}

function formatArea(value) {
  return `${formatNumber(value)} m2`;
}

function statusClass(status) {
  return `status-pill room-status-${status.toLowerCase()}`;
}

function getActiveResidentHeads(users) {
  return users.filter((user) => (
    user.role === 'RESIDENT_HEAD'
    && user.status === 'ACTIVE'
    && !user.assignedRoomId
  ));
}

function isFutureDate(dateValue) {
  return Boolean(dateValue) && String(dateValue).slice(0, 10) > formatDateInputValue();
}

function getEndContractConfirmationMessage(room, headInfo, t) {
  const endDate = headInfo?.contractEndDate || headInfo?.assignmentEndDate;
  const roomCode = formatRoomCode(room);

  if (isFutureDate(endDate)) {
    return t('roomManagement.assignment.futureEndConfirm', {
      date: formatDisplayDate(endDate),
      room: roomCode
    });
  }

  return t('roomManagement.assignment.endConfirm', { room: roomCode });
}

function RoomDetailInfoItem({ icon, label, children }) {
  return (
    <div className="room-detail-info-item">
      <span className="room-detail-info-icon" aria-hidden="true">
        <LineIcon name={icon} />
      </span>
      <div className="room-detail-info-copy">
        <span>{label}</span>
        <strong>{children}</strong>
      </div>
    </div>
  );
}

export default function AdminRoomDetailPage() {
  const { t } = useTranslation();
  const { roomBasePath, roomId } = useRoomRouteContext('admin');
  const { building } = useOutletContext() || {};
  const location = useLocation();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [buildings, setBuildings] = useState([]);
  const [headInfo, setHeadInfo] = useState(null);
  const [roomMembers, setRoomMembers] = useState([]);
  const [residentHeads, setResidentHeads] = useState([]);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [message, setMessage] = useState(location.state?.message || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editError, setEditError] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [removingHead, setRemovingHead] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadRoomDetails = async () => {
    const [roomResponse, headResponse, usersResponse, buildingsResponse, membersResponse] = await Promise.all([
      roomApi.getAdminRoom(roomId),
      roomApi.getHeadResidentAssignment(roomId),
      adminUserApi.getUsers(),
      buildingApi.getAdminBuildings(),
      memberApi.getAdminRoomMembers(roomId)
    ]);

    setRoom(roomResponse.data);
    setHeadInfo(headResponse.data);
    setRoomMembers(membersResponse.data);
    setResidentHeads(getActiveResidentHeads(usersResponse.data));
    setBuildings(buildingsResponse.data);
  };

  useEffect(() => {
    let active = true;

    loadRoomDetails()
      .catch((apiError) => {
        if (active) {
          setError(translateInterfaceText(apiError.response?.data?.message || t('roomManagement.loadOneError')));
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [roomId]);

  const refreshRoomDetails = async () => {
    try {
      await loadRoomDetails();
    } catch (apiError) {
      setError(translateInterfaceText(apiError.response?.data?.message || t('roomManagement.refreshError')));
    }
  };

  const handleAssignHead = async (payload) => {
    setAssigning(true);
    setMessage('');
    setError('');

    try {
      await roomApi.assignHeadResident(room.id, payload);
      setMessage(t('roomManagement.assignment.assigned'));
      setShowAssignForm(false);
      await refreshRoomDetails();
    } catch (apiError) {
      setError(translateInterfaceText(apiError.response?.data?.message || t('roomManagement.assignment.assignError')));
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveHead = async () => {
    const confirmed = window.confirm(getEndContractConfirmationMessage(room, headInfo, t));
    if (!confirmed) {
      return;
    }

    setRemovingHead(true);
    setMessage('');
    setError('');

    try {
      await roomApi.removeHeadResident(room.id);
      setMessage(t('roomManagement.assignment.ended'));
      await refreshRoomDetails();
    } catch (apiError) {
      setError(translateInterfaceText(apiError.response?.data?.message || t('roomManagement.assignment.endError')));
    } finally {
      setRemovingHead(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(t('roomManagement.deleteConfirm', { room: formatRoomCode(room) }));
    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setMessage('');
    setError('');

    try {
      await roomApi.deleteAdminRoom(room.id);
      navigate(roomBasePath, { replace: true });
    } catch (apiError) {
      setError(translateInterfaceText(apiError.response?.data?.message || t('roomManagement.deleteError')));
    } finally {
      setDeleting(false);
    }
  };

  const handleCloseEdit = () => {
    if (savingEdit) {
      return;
    }

    setEditOpen(false);
    setEditError('');
  };

  const handleCloseAssign = () => {
    if (assigning) {
      return;
    }

    setShowAssignForm(false);
  };

  const handleUpdateRoom = async (payload) => {
    setSavingEdit(true);
    setEditError('');
    setMessage('');
    setError('');

    try {
      await roomApi.updateAdminRoom(room.id, payload);
      setMessage(t('roomManagement.updated'));
      setEditOpen(false);
      await refreshRoomDetails();
    } catch (apiError) {
      setEditError(translateInterfaceText(apiError.response?.data?.message || t('roomManagement.updateError')));
    } finally {
      setSavingEdit(false);
    }
  };

  if (loading) {
    return <div className="empty-state">{t('roomManagement.loadingOne')}</div>;
  }

  if (!room) {
    return <div className="empty-state">{error || t('roomManagement.notFound')}</div>;
  }

  const hasHeadResident = Boolean(headInfo?.assigned);
  const canAssignHead = !hasHeadResident && room.status === 'EMPTY';
  const currentOccupantCount = hasHeadResident
    ? 1 + roomMembers.filter((member) => member.status === 'APPROVED').length
    : 0;
  const buildingAddress = room.buildingAddress || building?.address || t('common.notProvided');

  return (
    <section className="content-section admin-room-detail-page">
      <div className="page-title-row">
        <PageHeader eyebrow={formatRoomCode(room)} />
        <div className="button-row room-detail-actions">
          <Link
            className="icon-action-button"
            data-tooltip={t('roomManagement.back')}
            to={roomBasePath}
            aria-label={t('roomManagement.back')}
          >
            <LineIcon name="logOut" />
          </Link>
          <button
            className="icon-action-button"
            data-tooltip={t('common.edit')}
            type="button"
            onClick={() => setEditOpen(true)}
            aria-label={t('common.edit')}
          >
            <LineIcon name="edit" />
          </button>
          <Link
            className="icon-action-button"
            data-tooltip={t('roomManagement.members')}
            to={`${roomBasePath}/${room.id}/members`}
            aria-label={t('roomManagement.members')}
          >
            <LineIcon name="users" />
          </Link>
          <button
            className="icon-action-button icon-action-danger"
            data-tooltip={t('common.delete')}
            type="button"
            disabled={deleting}
            onClick={handleDelete}
            aria-label={t('common.delete')}
          >
            <LineIcon name="trash" />
          </button>
        </div>
      </div>

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      <div className="detail-panel room-detail-card">
        <RoomDetailInfoItem icon="building" label={t('tables.common.building')}>
          {room.buildingCode} - {room.buildingName}
        </RoomDetailInfoItem>
        <RoomDetailInfoItem icon="mapPin" label={t('forms.building.address')}>
          {buildingAddress}
        </RoomDetailInfoItem>
        <RoomDetailInfoItem icon="checkShield" label={t('tables.common.status')}>
          <span className={statusClass(room.status)}>{formatEnumLabel(t, 'roomStatus', room.status)}</span>
        </RoomDetailInfoItem>
        <RoomDetailInfoItem icon="barChart" label={t('tables.common.floor')}>
          {room.floor}
        </RoomDetailInfoItem>
        <RoomDetailInfoItem icon="users" label={t('roomManagement.maximumOccupants')}>
          {room.maxOccupants}
        </RoomDetailInfoItem>
        <RoomDetailInfoItem icon="wallet" label={t('tables.common.price')}>
          <span className="room-detail-metric">{formatMoney(room.price)}</span>
        </RoomDetailInfoItem>
        <RoomDetailInfoItem icon="activity" label={t('tables.common.area')}>
          <span className="room-detail-metric">{formatArea(room.area)}</span>
        </RoomDetailInfoItem>
        <RoomDetailInfoItem icon="fileText" label={t('tables.common.description')}>
          {room.description || t('roomManagement.noDescription')}
        </RoomDetailInfoItem>
      </div>

      <section className="assignment-panel">
        <div className="page-title-row compact-title-row">
          <PageHeader eyebrow={t('roomManagement.assignment.eyebrow')} />
          {!hasHeadResident && (
            <button
              className="button-link"
              type="button"
              disabled={!canAssignHead}
              onClick={() => setShowAssignForm(true)}
            >
              {t('roomManagement.assignment.assign')}
            </button>
          )}
        </div>

        {hasHeadResident ? (
          <div className="detail-panel room-assignment-card">
            <RoomDetailInfoItem icon="user" label={t('tables.common.headResident')}>
              {headInfo.residentHeadName}
            </RoomDetailInfoItem>
            <RoomDetailInfoItem icon="mail" label={t('profile.fields.email')}>
              {headInfo.residentHeadEmail}
            </RoomDetailInfoItem>
            <RoomDetailInfoItem icon="calendar" label={t('roomManagement.assignment.period')}>
              {formatDisplayDate(headInfo.assignmentStartDate)} {t('common.to')}{' '}
              {formatDisplayDate(headInfo.assignmentEndDate)}
            </RoomDetailInfoItem>
            <RoomDetailInfoItem icon="activity" label={t('roomManagement.assignment.status')}>
              {formatEnumLabel(t, 'rentalStatus', headInfo.assignmentStatus)}
            </RoomDetailInfoItem>
            <RoomDetailInfoItem icon="wallet" label={t('roomManagement.assignment.deposit')}>
              {formatNumber(headInfo.depositAmount)}
            </RoomDetailInfoItem>
            <RoomDetailInfoItem icon="users" label={t('roomManagement.currentOccupants')}>
              {t('roomManagement.activeOccupants', {
                count: currentOccupantCount,
                max: room.maxOccupants
              })}
            </RoomDetailInfoItem>
            <RoomDetailInfoItem icon="fileText" label={t('roomManagement.assignment.contractStatus')}>
              {formatEnumLabel(t, 'contractStatus', headInfo.contractStatus)}
            </RoomDetailInfoItem>
            <RoomDetailInfoItem icon="calendar" label={t('roomManagement.assignment.contractPeriod')}>
              {formatDisplayDate(headInfo.contractStartDate)} {t('common.to')}{' '}
              {formatDisplayDate(headInfo.contractEndDate)}
            </RoomDetailInfoItem>
            <div className="detail-wide room-assignment-action-row">
              <button
                className="secondary-button inline-button"
                type="button"
                disabled={removingHead}
                onClick={handleRemoveHead}
              >
                {removingHead ? t('roomManagement.assignment.ending') : t('roomManagement.assignment.end')}
              </button>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            {room.status !== 'EMPTY'
              ? t('roomManagement.assignment.emptyOnlyBlocked')
              : t('roomManagement.assignment.unassigned')}
          </div>
        )}

        <ActionDialog
          className="assignment-dialog"
          eyebrow={formatRoomCode(room)}
          labelledBy="room-assign-dialog-title"
          open={showAssignForm && canAssignHead}
          title={t('roomManagement.assignment.title')}
          onClose={handleCloseAssign}
        >
          <HeadResidentAssignmentForm
            residentHeads={residentHeads}
            loading={assigning}
            onSubmit={handleAssignHead}
          />
        </ActionDialog>
      </section>

      <ActionDialog
        className="action-dialog-wide"
        eyebrow={formatRoomCode(room)}
        labelledBy="room-edit-dialog-title"
        open={editOpen}
        title={t('roomManagement.editTitle')}
        onClose={handleCloseEdit}
      >
        {editError && <div className="alert error-alert">{editError}</div>}
        <RoomForm
          buildingOptions={buildings}
          initialValues={room}
          lockBuilding
          lockOccupiedStatus={hasHeadResident}
          loading={savingEdit}
          submitLabel={t('roomManagement.saveChanges')}
          onSubmit={handleUpdateRoom}
        />
      </ActionDialog>
    </section>
  );
}
