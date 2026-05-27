import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import * as adminUserApi from '../../api/adminUserApi.js';
import * as roomApi from '../../api/roomApi.js';
import HeadResidentAssignmentForm from '../../components/HeadResidentAssignmentForm.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { getRoomStatusLabel } from '../../utils/roomStatusOptions.js';

function formatNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue)
    ? numberValue.toLocaleString('en-US', { maximumFractionDigits: 2 })
    : value;
}

function formatEnumLabel(value) {
  if (!value) {
    return 'Not available';
  }

  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function statusClass(status) {
  return `status-pill room-status-${status.toLowerCase()}`;
}

function getActiveResidentHeads(users) {
  return users.filter((user) => user.role === 'RESIDENT_HEAD' && user.status === 'ACTIVE');
}

function getTodayIsoDate() {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
}

function isFutureDate(dateValue) {
  return Boolean(dateValue) && String(dateValue).slice(0, 10) > getTodayIsoDate();
}

function getEndContractConfirmationMessage(room, headInfo) {
  const endDate = headInfo?.contractEndDate || headInfo?.assignmentEndDate;

  if (isFutureDate(endDate)) {
    return `The contract has not reached its end date yet (${endDate}). Do you want to end it now and remove the Head Resident and room members from room ${room.roomCode}?`;
  }

  return `End the contract and remove the Head Resident and room members from room ${room.roomCode}?`;
}

export default function AdminRoomDetailPage() {
  const { id } = useParams();
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
      roomApi.getAdminRoom(id),
      roomApi.getRoomHead(id),
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
          setError(apiError.response?.data?.message || 'Room could not be loaded');
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
  }, [id]);

  const refreshRoomDetails = async () => {
    try {
      await loadRoomDetails();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Room details could not be refreshed');
    }
  };

  const handleAssignHead = async (payload) => {
    setAssigning(true);
    setMessage('');
    setError('');

    try {
      await roomApi.assignHeadResident(room.id, payload);
      setMessage('Head Resident assigned successfully.');
      setShowAssignForm(false);
      await refreshRoomDetails();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Head Resident could not be assigned');
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveHead = async () => {
    const confirmed = window.confirm(getEndContractConfirmationMessage(room, headInfo));
    if (!confirmed) {
      return;
    }

    setRemovingHead(true);
    setMessage('');
    setError('');

    try {
      await roomApi.removeHeadResident(room.id);
      setMessage('Contract ended. Head Resident and room members were removed successfully.');
      await refreshRoomDetails();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Contract could not be ended');
    } finally {
      setRemovingHead(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(`Delete room ${room.roomCode}?`);
    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setMessage('');
    setError('');

    try {
      await roomApi.deleteAdminRoom(room.id);
      navigate('/admin/rooms', { replace: true });
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Room could not be deleted');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="empty-state">Loading room...</div>;
  }

  if (!room) {
    return <div className="empty-state">{error || 'Room not found.'}</div>;
  }

  const hasHeadResident = Boolean(headInfo?.assigned);
  const canAssignHead = !hasHeadResident && room.status !== 'MAINTENANCE';

  return (
    <section className="content-section">
      <div className="page-title-row">
        <PageHeader eyebrow={room.roomCode} title={room.roomName} />
        <div className="button-row">
          <Link className="secondary-link" to="/admin/rooms">
            Back
          </Link>
          <Link className="button-link" to={`/admin/rooms/${room.id}/edit`}>
            Edit
          </Link>
          <Link className="secondary-link" to={`/admin/rooms/${room.id}/members`}>
            Members
          </Link>
          <button className="secondary-button inline-button" type="button" disabled={deleting} onClick={handleDelete}>
            Delete
          </button>
        </div>
      </div>

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      <div className="detail-panel">
        <div>
          <span>Building</span>
          <strong>
            {room.buildingCode} - {room.buildingName}
          </strong>
        </div>
        <div>
          <span>Status</span>
          <strong>
            <span className={statusClass(room.status)}>{getRoomStatusLabel(room.status)}</span>
          </strong>
        </div>
        <div>
          <span>Floor</span>
          <strong>{room.floor}</strong>
        </div>
        <div>
          <span>Maximum occupants</span>
          <strong>{room.maxOccupants}</strong>
        </div>
        <div>
          <span>Price</span>
          <strong>{formatNumber(room.price)}</strong>
        </div>
        <div>
          <span>Area</span>
          <strong>{formatNumber(room.area)}</strong>
        </div>
        <div className="detail-wide">
          <span>Description</span>
          <p>{room.description || 'No description provided.'}</p>
        </div>
      </div>

      <section className="assignment-panel">
        <div className="page-title-row compact-title-row">
          <PageHeader eyebrow="Head Resident" title="Room assignment" />
          {!hasHeadResident && (
            <button
              className="button-link"
              type="button"
              disabled={!canAssignHead}
              onClick={() => setShowAssignForm((current) => !current)}
            >
              Assign Head Resident
            </button>
          )}
        </div>

        {hasHeadResident ? (
          <div className="detail-panel">
            <div>
              <span>Head Resident</span>
              <strong>{headInfo.residentHeadName}</strong>
            </div>
            <div>
              <span>Email</span>
              <strong>{headInfo.residentHeadEmail}</strong>
            </div>
            <div>
              <span>Assignment period</span>
              <strong>
                {headInfo.assignmentStartDate} to {headInfo.assignmentEndDate}
              </strong>
            </div>
            <div>
              <span>Assignment status</span>
              <strong>{formatEnumLabel(headInfo.assignmentStatus)}</strong>
            </div>
            <div>
              <span>Deposit amount</span>
              <strong>{formatNumber(headInfo.depositAmount)}</strong>
            </div>
            <div>
              <span>Rental status</span>
              <strong>{formatEnumLabel(headInfo.rentalStatus)}</strong>
            </div>
            <div>
              <span>Contract status</span>
              <strong>{formatEnumLabel(headInfo.contractStatus)}</strong>
            </div>
            <div>
              <span>Contract period</span>
              <strong>
                {headInfo.contractStartDate} to {headInfo.contractEndDate}
              </strong>
            </div>
            <div className="detail-wide">
              <button
                className="secondary-button inline-button"
                type="button"
                disabled={removingHead}
                onClick={handleRemoveHead}
              >
                {removingHead ? 'Ending contract...' : 'End contract'}
              </button>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            {room.status === 'MAINTENANCE'
              ? 'Rooms in maintenance status cannot receive a Head Resident.'
              : 'No Head Resident is assigned to this room.'}
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
