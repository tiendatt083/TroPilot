import { useEffect, useState } from 'react';
import * as residentApi from '../../api/residentApi.js';
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

export default function ResidentDashboardPage() {
  const [assignedRoom, setAssignedRoom] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    residentApi
      .getAssignedRoom()
      .then((response) => {
        if (active) {
          setAssignedRoom(response.data);
        }
      })
      .catch((apiError) => {
        if (active) {
          setError(apiError.response?.data?.message || 'Assigned room could not be loaded');
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
  }, []);

  return (
    <section className="content-section">
      <PageHeader eyebrow="Head resident" title="Dashboard" />

      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">Loading assigned room...</div>
      ) : assignedRoom?.assigned ? (
        <div className="detail-panel">
          <div>
            <span>Assigned room</span>
            <strong>
              {assignedRoom.roomCode} - {assignedRoom.roomName}
            </strong>
          </div>
          <div>
            <span>Building</span>
            <strong>
              {assignedRoom.buildingCode} - {assignedRoom.buildingName}
            </strong>
          </div>
          <div>
            <span>Room status</span>
            <strong>
              <span className={statusClass(assignedRoom.roomStatus)}>
                {getRoomStatusLabel(assignedRoom.roomStatus)}
              </span>
            </strong>
          </div>
          <div>
            <span>Assignment period</span>
            <strong>
              {assignedRoom.assignmentStartDate} to {assignedRoom.assignmentEndDate}
            </strong>
          </div>
          <div>
            <span>Deposit amount</span>
            <strong>{formatNumber(assignedRoom.depositAmount)}</strong>
          </div>
          <div>
            <span>Contract status</span>
            <strong>{formatEnumLabel(assignedRoom.contractStatus)}</strong>
          </div>
        </div>
      ) : (
        <div className="empty-state">No room is assigned to your account.</div>
      )}
    </section>
  );
}
