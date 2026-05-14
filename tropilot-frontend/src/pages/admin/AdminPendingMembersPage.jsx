import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as memberApi from '../../api/memberApi.js';
import PageHeader from '../../components/PageHeader.jsx';

function countText(member) {
  return `${member.totalOccupants} of ${member.maxOccupants}`;
}

export default function AdminPendingMembersPage() {
  const [members, setMembers] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const loadMembers = async () => {
    setError('');

    try {
      const response = await memberApi.getPendingMembers();
      setMembers(response.data);
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Pending members could not be loaded');
    }
  };

  useEffect(() => {
    loadMembers().finally(() => setLoading(false));
  }, []);

  const handleApprove = async (member) => {
    setProcessingId(member.id);
    setMessage('');
    setError('');

    try {
      await memberApi.approveMember(member.id);
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
      await memberApi.rejectMember(member.id);
      setMessage('Room member rejected successfully.');
      await loadMembers();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Room member could not be rejected');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <section className="content-section">
      <PageHeader eyebrow="Administrator" title="Pending room members" />

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">Loading pending members...</div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Phone</th>
                <th>Room</th>
                <th>Head Resident</th>
                <th>Occupants</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id}>
                  <td>{member.fullName}</td>
                  <td>{member.phone}</td>
                  <td>
                    <Link className="secondary-link compact-link" to={`/admin/rooms/${member.roomId}/members`}>
                      {member.roomCode}
                    </Link>
                  </td>
                  <td>{member.residentHeadName}</td>
                  <td>{countText(member)}</td>
                  <td>
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {members.length === 0 && <div className="empty-state flat-empty-state">No pending members found.</div>}
        </div>
      )}
    </section>
  );
}
