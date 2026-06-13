import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import * as memberApi from '../../features/residents/api.js';
import * as roomApi from '../../features/rooms/api.js';
import PageHeader from '../../components/PageHeader.jsx';
import { formatDisplayDate } from '../../utils/dateFormat.js';
import { getMemberStatusLabel } from '../../utils/memberStatusOptions.js';
import { formatRoomCode } from '../../utils/roomDisplay.js';

function statusClass(status) {
  return `status-pill member-status-${status.toLowerCase()}`;
}

function countText(headResident, members, room) {
  const maxOccupants = members[0]?.maxOccupants || room?.maxOccupants;

  if (!maxOccupants) {
    return 'Occupants are not available.';
  }

  const activeHeadResidentCount = headResident?.assigned ? 1 : 0;
  const approvedMemberCount = members.filter((member) => member.status === 'APPROVED').length;

  return `${activeHeadResidentCount + approvedMemberCount} of ${maxOccupants} active occupants`;
}

export default function AdminRoomMembersPage() {
  const { id } = useParams();
  const [room, setRoom] = useState(null);
  const [headResident, setHeadResident] = useState(null);
  const [members, setMembers] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const loadData = async () => {
    setError('');

    try {
      const [roomResponse, headResponse, membersResponse] = await Promise.all([
        roomApi.getAdminRoom(id),
        roomApi.getHeadResidentAssignment(id),
        memberApi.getAdminRoomMembers(id)
      ]);
      setRoom(roomResponse.data);
      setHeadResident(headResponse.data);
      setMembers(membersResponse.data);
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Room members could not be loaded');
    }
  };

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, [id]);

  const handleApprove = async (member) => {
    setProcessingId(member.id);
    setMessage('');
    setError('');

    try {
      await memberApi.approveMember(member.id);
      setMessage('Room member approved successfully.');
      await loadData();
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
      await memberApi.rejectMember(member.id);
      setMessage('Room member rejected successfully.');
      await loadData();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Room member could not be rejected');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return <div className="empty-state">Loading room members...</div>;
  }

  return (
    <section className="content-section">
      <div className="page-title-row">
        <PageHeader eyebrow={formatRoomCode(room) || 'Room'} title="Room members" />
        <div className="button-row">
          <Link className="secondary-link" to={`/admin/rooms/${id}`}>
            Back to room
          </Link>
          <div className="count-summary">{countText(headResident, members, room)}</div>
        </div>
      </div>

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Phone</th>
              <th>Relationship</th>
              <th>Move-in</th>
              <th>Move-out</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {headResident?.assigned && (
              <tr>
                <td>
                  <strong>{headResident.residentHeadName}</strong>
                  <div className="muted-text">{headResident.residentHeadEmail}</div>
                </td>
                <td>{headResident.residentHeadPhone || 'Not provided'}</td>
                <td>Head Resident</td>
                <td>{formatDisplayDate(headResident.assignmentStartDate)}</td>
                <td>{formatDisplayDate(headResident.assignmentEndDate, 'Not set')}</td>
                <td>
                  <span className={statusClass('APPROVED')}>Active</span>
                </td>
                <td>
                  <span className="muted-text">No action</span>
                </td>
              </tr>
            )}
            {members.map((member) => (
              <tr key={member.id}>
                <td>
                  <strong>{member.fullName}</strong>
                  <span className="table-subtext">{member.email || 'Not provided'}</span>
                </td>
                <td>{member.phone}</td>
                <td>{member.relationship || 'Not provided'}</td>
                <td>{formatDisplayDate(member.moveInDate)}</td>
                <td>{formatDisplayDate(member.moveOutDate, 'Not set')}</td>
                <td>
                  <span className={statusClass(member.status)}>{getMemberStatusLabel(member.status)}</span>
                </td>
                <td>
                  {member.status === 'PENDING' ? (
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
                  ) : (
                    <span className="muted-text">No action</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!headResident?.assigned && members.length === 0 && (
          <div className="empty-state flat-empty-state">No room members found.</div>
        )}
      </div>
    </section>
  );
}
