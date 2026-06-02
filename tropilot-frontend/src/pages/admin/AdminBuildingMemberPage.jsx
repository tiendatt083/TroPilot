import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import * as memberApi from '../../api/memberApi.js';
import PageHeader from '../../components/PageHeader.jsx';
import { formatDisplayDate } from '../../utils/dateFormat.js';
import { getMemberStatusLabel } from '../../utils/memberStatusOptions.js';
import { formatRoomCode } from '../../utils/roomDisplay.js';

function statusClass(status) {
  return `status-pill member-status-${status.toLowerCase()}`;
}

function countText(member) {
  return `${member.totalOccupants} of ${member.maxOccupants}`;
}

export default function AdminBuildingMemberPage() {
  const { building } = useOutletContext();
  const [members, setMembers] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const buildingFilter = { buildingId: building.id };

  const loadMembers = async () => {
    setError('');

    try {
      const response = await memberApi.getAdminBuildingMembers(buildingFilter);
      setMembers(response.data);
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Building room members could not be loaded');
    }
  };

  useEffect(() => {
    setLoading(true);
    loadMembers().finally(() => setLoading(false));
  }, [building.id]);

  const handleApprove = async (member) => {
    setProcessingId(member.id);
    setMessage('');
    setError('');

    try {
      await memberApi.approveMember(member.id, buildingFilter);
      setMessage('Room member approved successfully.');
      await loadMembers();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Room member could not be approved');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (member) => {
    setProcessingId(member.id);
    setMessage('');
    setError('');

    try {
      await memberApi.rejectMember(member.id, buildingFilter);
      setMessage('Room member rejected successfully.');
      await loadMembers();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Room member could not be rejected');
    } finally {
      setProcessingId(null);
    }
  };

  const renderActions = (member) => {
    if (member.status !== 'PENDING') {
      return <span className="muted-text">No action</span>;
    }

    return (
      <div className="table-actions">
        <button
          className="secondary-button compact-button"
          type="button"
          disabled={processingId === member.id}
          onClick={() => handleApprove(member)}
        >
          Approve
        </button>
        <button
          className="secondary-button compact-button"
          type="button"
          disabled={processingId === member.id}
          onClick={() => handleReject(member)}
        >
          Reject
        </button>
      </div>
    );
  };

  return (
    <div className="building-workspace">
      <PageHeader eyebrow="Building room members" title="Room members in this building" />

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">Loading room members...</div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Phone</th>
                <th>Room</th>
                <th>Head Resident</th>
                <th>Status</th>
                <th>Occupants</th>
                <th>Move-in</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id}>
                  <td>
                    <strong>{member.fullName}</strong>
                    <span className="table-subtext">{member.relationship || 'Not provided'}</span>
                  </td>
                  <td>{member.phone}</td>
                  <td>
                    <Link className="secondary-link compact-link" to={`/admin/rooms/${member.roomId}/members`}>
                      {formatRoomCode(member)}
                    </Link>
                  </td>
                  <td>
                    <strong>{member.residentHeadName}</strong>
                    <span className="table-subtext">{member.residentHeadEmail}</span>
                  </td>
                  <td>
                    <span className={statusClass(member.status)}>{getMemberStatusLabel(member.status)}</span>
                  </td>
                  <td>{countText(member)}</td>
                  <td>{formatDisplayDate(member.moveInDate)}</td>
                  <td>{renderActions(member)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {members.length === 0 && <div className="empty-state flat-empty-state">No room members found.</div>}
        </div>
      )}
    </div>
  );
}
