import { useEffect, useState } from 'react';
import * as memberApi from '../../features/residents/api.js';
import MemberForm from '../../components/MemberForm.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { formatDateInputValue, formatDisplayDate } from '../../utils/dateFormat.js';
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

function createReturnRequestDraft(member) {
  return {
    fullName: member.fullName || '',
    phone: member.phone || '',
    email: member.email || '',
    identityNumber: member.identityNumber || '',
    relationship: member.relationship || '',
    moveInDate: formatDateInputValue(),
    sourceMemberId: member.id
  };
}

export default function ResidentMemberPage() {
  const [members, setMembers] = useState([]);
  const [editingMember, setEditingMember] = useState(null);
  const [returnRequestDraft, setReturnRequestDraft] = useState(null);
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
      setReturnRequestDraft(null);
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

  const handleEdit = (member) => {
    setReturnRequestDraft(null);
    setEditingMember(member);
  };

  const handleRequestAgain = (member) => {
    setEditingMember(null);
    setReturnRequestDraft(createReturnRequestDraft(member));
  };

  const handleCancelFormAction = () => {
    setEditingMember(null);
    setReturnRequestDraft(null);
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
  const activeFormMember = editingMember || returnRequestDraft;
  const isEditing = Boolean(editingMember);
  const formKey = editingMember?.id
    ? `edit-${editingMember.id}`
    : returnRequestDraft?.sourceMemberId
      ? `return-${returnRequestDraft.sourceMemberId}`
      : 'new-member';

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
            eyebrow={isEditing ? 'Edit member' : 'New member'}
            title={isEditing ? editingMember.fullName : 'Add room member'}
          />
          <MemberForm
            key={formKey}
            initialValues={activeFormMember}
            loading={saving}
            submitLabel={isEditing ? 'Save changes' : returnRequestDraft ? 'Submit again for approval' : 'Submit for approval'}
            onSubmit={isEditing ? handleUpdate : handleCreate}
            onCancel={activeFormMember ? handleCancelFormAction : undefined}
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
                      <td>
                        <strong>{member.fullName}</strong>
                        <span className="table-subtext">{member.email || 'Not provided'}</span>
                      </td>
                      <td>{member.phone}</td>
                      <td>{member.relationship || 'Not provided'}</td>
                      <td>{formatDisplayDate(member.moveInDate)}</td>
                      <td>
                        <span className={statusClass(member.status)}>{getMemberStatusLabel(member.status)}</span>
                      </td>
                      <td>
                        <div className="table-actions">
                          {member.status === 'LEFT' ? (
                            <button
                              className="secondary-button compact-button"
                              type="button"
                              onClick={() => handleRequestAgain(member)}
                            >
                              Add again
                            </button>
                          ) : (
                            <>
                              <button
                                className="secondary-button compact-button"
                                type="button"
                                onClick={() => handleEdit(member)}
                              >
                                Edit
                              </button>
                              <button
                                className="secondary-button compact-button"
                                type="button"
                                disabled={leavingId === member.id}
                                onClick={() => handleLeave(member)}
                              >
                                Leave
                              </button>
                            </>
                          )}
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
