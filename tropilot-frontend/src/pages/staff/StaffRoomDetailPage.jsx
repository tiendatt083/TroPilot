import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import * as roomApi from '../../features/rooms/api.js';
import PageHeader from '../../components/PageHeader.jsx';
import { formatRoomCode } from '../../utils/roomDisplay.js';
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

export default function StaffRoomDetailPage() {
  const { id } = useParams();
  const [room, setRoom] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    roomApi
      .getStaffRoom(id)
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

  if (loading) {
    return <div className="empty-state">Loading room...</div>;
  }

  if (!room) {
    return <div className="empty-state">{error || 'Room not found.'}</div>;
  }

  return (
    <section className="content-section">
      <div className="page-title-row">
        <PageHeader eyebrow={formatRoomCode(room)} title={room.roomName} />
        <Link className="secondary-link" to="/staff/rooms">
          Back to rooms
        </Link>
      </div>

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
