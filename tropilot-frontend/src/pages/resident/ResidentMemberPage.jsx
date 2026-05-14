import { useEffect, useState } from 'react';
import * as memberApi from '../../api/memberApi.js';
import MemberForm from '../../components/MemberForm.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { getMemberStatusLabel } from '../../utils/memberStatusOptions.js';

function statusClass(status) {
  return `status-pill member-status-${status.toLowerCase()}`;
}

function countText(member) {
  if (!member) {
    return 'Occupants are not available.';
  }

  return `${member.totalOccupants} of ${member.maxOccupants} active occupants`;
}

export default function ResidentMemberPage() {
  const [members, setMembers] = useState([]);
  const [editingMember, setEditingMember] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [leavingId, setLeavingId] = useState(null);

  const loadMembers = async () => {
    setError('');

    try {
      const response = await memberApi.getResidentMembers();
      setMembers(response.data);
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Room members could not be loaded');
    }
  };

  useEffect(() => {
    loadMembers().finally(() => setLoading(false));
  }, []);

  const handleCreate = async (payload) => {
    setSaving(true);
    setMessage('');
    setError('');

    try {
      await memberApi.createResidentMember(payload);
      setMessage('Room member submitted for approval successfully.');
      await loadMembers();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Room member could not be submitted');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (payload) => {
    setSaving(true);
    setMessage('');
    setError('');

    try {
      await memberApi.updateResidentMember(editingMember.id, payload);
      setMessage('Room member updated successfully.');
      setEditingMember(null);
      await loadMembers();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Room member could not be updated');
    } finally {
      setSaving(false);
    }
  };

  const handleLeave = async (member) => {
    const confirmed = window.confirm(`Mark ${member.fullName} as left?`);
    if (!confirmed) {
      return;
    }

    setLeavingId(member.id);
    setMessage('');
    setError('');

    try {
      await memberApi.markResidentMemberLeft(member.id);
      setMessage('Room member marked as left successfully.');
      await loadMembers();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Room member could not be marked as left');
    } finally {
      setLeavingId(null);
    }
  };

  const firstMember = members[0];

  return (
    <section className="content-section">
      <div className="page-title-row">
        <PageHeader eyebrow="Head resident" title="Room members" />
        <div className="count-summary">{countText(firstMember)}</div>
      </div>

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      <section className="member-workspace">
        <div>
          <PageHeader
            eyebrow={editingMember ? 'Edit member' : 'New member'}
            title={editingMember ? editingMember.fullName : 'Add room member'}
          />
          <MemberForm
            key={editingMember?.id || 'new-member'}
            initialValues={editingMember}
            loading={saving}
            submitLabel={editingMember ? 'Save changes' : 'Submit for approval'}
            onSubmit={editingMember ? handleUpdate : handleCreate}
            onCancel={editingMember ? () => setEditingMember(null) : undefined}
          />
        </div>

        <div>
          {loading ? (
            <div className="empty-state">Loading room members...</div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Relationship</th>
                    <th>Move-in</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.id}>
                      <td>{member.fullName}</td>
                      <td>{member.phone}</td>
                      <td>{member.relationship || 'Not provided'}</td>
                      <td>{member.moveInDate}</td>
                      <td>
                        <span className={statusClass(member.status)}>{getMemberStatusLabel(member.status)}</span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="secondary-button compact-button"
                            type="button"
                            disabled={member.status === 'LEFT'}
                            onClick={() => setEditingMember(member)}
                          >
                            Edit
                          </button>
                          <button
                            className="secondary-button compact-button"
                            type="button"
                            disabled={member.status === 'LEFT' || leavingId === member.id}
                            onClick={() => handleLeave(member)}
                          >
                            Leave
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {members.length === 0 && <div className="empty-state flat-empty-state">No room members found.</div>}
            </div>
          )}
        </div>
      </section>
    </section>
  );
}
