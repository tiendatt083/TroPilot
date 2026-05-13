import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import * as roomApi from '../../api/roomApi.js';
import PageHeader from '../../components/PageHeader.jsx';
import { getRoomStatusLabel } from '../../utils/roomStatusOptions.js';

function formatNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue)
    ? numberValue.toLocaleString('en-US', { maximumFractionDigits: 2 })
    : value;
}

function statusClass(status) {
  return `status-pill room-status-${status.toLowerCase()}`;
}

export default function AdminRoomDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [message, setMessage] = useState(location.state?.message || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;

    roomApi
      .getAdminRoom(id)
      .then((response) => {
        if (active) {
          setRoom(response.data);
        }
      })
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
    </section>
  );
}
