import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import * as roomApi from '../../features/rooms/api.js';
import * as adminUserApi from '../../features/users/api.js';
import useRoomRouteContext from '../../features/rooms/useRoomRouteContext.js';
import HeadResidentAssignmentForm from '../../components/HeadResidentAssignmentForm.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { formatDateInputValue, formatDisplayDate } from '../../utils/dateFormat.js';
import { formatEnumLabel } from '../../utils/i18nFormat.js';
import { formatRoomCode } from '../../utils/roomDisplay.js';

function formatNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue)
    ? numberValue.toLocaleString('en-US', { maximumFractionDigits: 2 })
    : value;
}

function statusClass(status) {
  return `status-pill room-status-${status.toLowerCase()}`;
}

function getActiveResidentHeads(users) {
  return users.filter((user) => user.role === 'RESIDENT_HEAD' && user.status === 'ACTIVE');
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

export default function AdminRoomDetailPage() {
  const { t } = useTranslation();
  const { roomBasePath, roomId } = useRoomRouteContext('admin');
  const location = useLocation();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [headInfo, setHeadInfo] = useState(null);
  const [residentHeads, setResidentHeads] = useState([]);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [message, setMessage] = useState(location.state?.message || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [removingHead, setRemovingHead] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadRoomDetails = async () => {
    const [roomResponse, headResponse, usersResponse] = await Promise.all([
      roomApi.getAdminRoom(roomId),
      roomApi.getHeadResidentAssignment(roomId),
      adminUserApi.getUsers()
    ]);

    setRoom(roomResponse.data);
    setHeadInfo(headResponse.data);
    setResidentHeads(getActiveResidentHeads(usersResponse.data));
  };

  useEffect(() => {
    let active = true;

    loadRoomDetails()
      .catch((apiError) => {
        if (active) {
          setError(apiError.response?.data?.message || t('roomManagement.loadOneError'));
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
      setError(apiError.response?.data?.message || t('roomManagement.refreshError'));
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
      setError(apiError.response?.data?.message || t('roomManagement.assignment.assignError'));
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
      setError(apiError.response?.data?.message || t('roomManagement.assignment.endError'));
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
      setError(apiError.response?.data?.message || t('roomManagement.deleteError'));
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="empty-state">{t('roomManagement.loadingOne')}</div>;
  }

  if (!room) {
    return <div className="empty-state">{error || t('roomManagement.notFound')}</div>;
  }

  const hasHeadResident = Boolean(headInfo?.assigned);
  const canAssignHead = !hasHeadResident && room.status !== 'MAINTENANCE';

  return (
    <section className="content-section">
      <div className="page-title-row">
        <PageHeader eyebrow={formatRoomCode(room)} title={room.roomName} />
        <div className="button-row">
          <Link className="secondary-link" to={roomBasePath}>
            {t('roomManagement.back')}
          </Link>
          <Link className="button-link" to={`${roomBasePath}/${room.id}/edit`}>
            {t('common.edit')}
          </Link>
          <Link className="secondary-link" to={`${roomBasePath}/${room.id}/members`}>
            {t('roomManagement.members')}
          </Link>
          <button className="secondary-button inline-button" type="button" disabled={deleting} onClick={handleDelete}>
            {t('common.delete')}
          </button>
        </div>
      </div>

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      <div className="detail-panel">
        <div>
          <span>{t('tables.common.building')}</span>
          <strong>
            {room.buildingCode} - {room.buildingName}
          </strong>
        </div>
        <div>
          <span>{t('tables.common.status')}</span>
          <strong>
            <span className={statusClass(room.status)}>{formatEnumLabel(t, 'roomStatus', room.status)}</span>
          </strong>
        </div>
        <div>
          <span>{t('tables.common.floor')}</span>
          <strong>{room.floor}</strong>
        </div>
        <div>
          <span>{t('roomManagement.maximumOccupants')}</span>
          <strong>{room.maxOccupants}</strong>
        </div>
        <div>
          <span>{t('tables.common.price')}</span>
          <strong>{formatNumber(room.price)}</strong>
        </div>
        <div>
          <span>{t('tables.common.area')}</span>
          <strong>{formatNumber(room.area)}</strong>
        </div>
        <div className="detail-wide">
          <span>{t('tables.common.description')}</span>
          <p>{room.description || t('roomManagement.noDescription')}</p>
        </div>
      </div>

      <section className="assignment-panel">
        <div className="page-title-row compact-title-row">
          <PageHeader
            eyebrow={t('roomManagement.assignment.eyebrow')}
            title={t('roomManagement.assignment.title')}
          />
          {!hasHeadResident && (
            <button
              className="button-link"
              type="button"
              disabled={!canAssignHead}
              onClick={() => setShowAssignForm((current) => !current)}
            >
              {t('roomManagement.assignment.assign')}
            </button>
          )}
        </div>

        {hasHeadResident ? (
          <div className="detail-panel">
            <div>
              <span>{t('tables.common.headResident')}</span>
              <strong>{headInfo.residentHeadName}</strong>
            </div>
            <div>
              <span>{t('profile.fields.email')}</span>
              <strong>{headInfo.residentHeadEmail}</strong>
            </div>
            <div>
              <span>{t('roomManagement.assignment.period')}</span>
              <strong>
                {formatDisplayDate(headInfo.assignmentStartDate)} {t('common.to')}{' '}
                {formatDisplayDate(headInfo.assignmentEndDate)}
              </strong>
            </div>
            <div>
              <span>{t('roomManagement.assignment.status')}</span>
              <strong>{formatEnumLabel(t, 'rentalStatus', headInfo.assignmentStatus)}</strong>
            </div>
            <div>
              <span>{t('roomManagement.assignment.deposit')}</span>
              <strong>{formatNumber(headInfo.depositAmount)}</strong>
            </div>
            <div>
              <span>{t('roomManagement.assignment.rentalStatus')}</span>
              <strong>{formatEnumLabel(t, 'rentalStatus', headInfo.rentalStatus)}</strong>
            </div>
            <div>
              <span>{t('roomManagement.assignment.contractStatus')}</span>
              <strong>{formatEnumLabel(t, 'contractStatus', headInfo.contractStatus)}</strong>
            </div>
            <div>
              <span>{t('roomManagement.assignment.contractPeriod')}</span>
              <strong>
                {formatDisplayDate(headInfo.contractStartDate)} {t('common.to')}{' '}
                {formatDisplayDate(headInfo.contractEndDate)}
              </strong>
            </div>
            <div className="detail-wide">
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
            {room.status === 'MAINTENANCE'
              ? t('roomManagement.assignment.maintenanceBlocked')
              : t('roomManagement.assignment.unassigned')}
          </div>
        )}

        {showAssignForm && canAssignHead && (
          <HeadResidentAssignmentForm
            residentHeads={residentHeads}
            loading={assigning}
            onSubmit={handleAssignHead}
          />
        )}
      </section>
    </section>
  );
}
