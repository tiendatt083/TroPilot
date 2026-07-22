import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as memberApi from '../../api/memberApi.js';
import MemberForm from '../../components/MemberForm.jsx';
import ActionDialog from '../../components/common/ActionDialog.jsx';
import ManagementPageHero from '../../components/common/ManagementPageHero.jsx';
import LineIcon from '../../components/common/LineIcon.jsx';
import { formatDateInputValue, formatDisplayDate } from '../../utils/dateFormat.js';
import { formatEnumLabel } from '../../utils/i18nFormat.js';

function statusClass(status) {
  return `status-pill member-status-${status.toLowerCase()}`;
}

function countText(member, t) {
  if (!member) {
    return t('resident.members.unavailableCount');
  }

  return t('resident.members.activeCount', { total: member.totalOccupants, max: member.maxOccupants });
}

function createReturnRequestDraft(member) {
  return {
    fullName: member.fullName || '',
    phone: member.phone || '',
    email: member.email || '',
    relationship: member.relationship || '',
    moveInDate: formatDateInputValue(),
    sourceMemberId: member.id
  };
}

export default function ResidentMemberPage() {
  const { t } = useTranslation();
  const [members, setMembers] = useState([]);
  const [editingMember, setEditingMember] = useState(null);
  const [returnRequestDraft, setReturnRequestDraft] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [leavingId, setLeavingId] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const loadMembers = async () => {
    setError('');

    try {
      const response = await memberApi.getResidentMembers();
      setMembers(response.data);
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('resident.members.loadError'));
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
      setMessage(t('resident.members.submitted'));
      setReturnRequestDraft(null);
      setShowCreateForm(false);
      await loadMembers();
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('resident.members.submitError'));
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
      setMessage(t('resident.members.updated'));
      setEditingMember(null);
      await loadMembers();
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('resident.members.updateError'));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (member) => {
    setShowCreateForm(false);
    setReturnRequestDraft(null);
    setEditingMember(member);
  };

  const handleRequestAgain = (member) => {
    setShowCreateForm(false);
    setEditingMember(null);
    setReturnRequestDraft(createReturnRequestDraft(member));
  };

  const handleCancelFormAction = () => {
    if (saving) {
      return;
    }

    setShowCreateForm(false);
    setEditingMember(null);
    setReturnRequestDraft(null);
  };

  const handleOpenCreateForm = () => {
    setEditingMember(null);
    setReturnRequestDraft(null);
    setShowCreateForm(true);
  };

  const handleLeave = async (member) => {
    const confirmed = window.confirm(t('resident.members.leaveConfirm', { name: member.fullName }));
    if (!confirmed) {
      return;
    }

    setLeavingId(member.id);
    setMessage('');
    setError('');

    try {
      await memberApi.markResidentMemberLeft(member.id);
      setMessage(t('resident.members.left'));
      await loadMembers();
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('resident.members.leaveError'));
    } finally {
      setLeavingId(null);
    }
  };

  const firstMember = members[0];
  const activeFormMember = editingMember || returnRequestDraft;
  const showForm = showCreateForm || Boolean(activeFormMember);
  const isEditing = Boolean(editingMember);
  const formKey = editingMember?.id
    ? `edit-${editingMember.id}`
    : returnRequestDraft?.sourceMemberId
      ? `return-${returnRequestDraft.sourceMemberId}`
      : 'new-member';

  return (
    <section className="content-section resident-member-page">
      <ManagementPageHero
        actions={
          !showForm && (
            <button className="button-link hero-action-button" type="button" onClick={handleOpenCreateForm}>
              <LineIcon name="plus" />
              {t('resident.members.addButton')}
            </button>
          )
        }
        description={countText(firstMember, t)}
        title={t('resident.members.title')}
      />

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      <section className="member-workspace member-workspace-list-only">
        <div>
          {loading ? (
            <div className="empty-state">{t('resident.members.loading')}</div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('tables.common.name')}</th>
                    <th>{t('profile.fields.phone')}</th>
                    <th>{t('forms.member.relationship')}</th>
                    <th>{t('forms.member.moveInDate')}</th>
                    <th>{t('tables.common.status')}</th>
                    <th className="resident-member-actions-column">{t('tables.common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.id}>
                      <td>
                        <strong>{member.fullName}</strong>
                        <span className="table-subtext">{member.email || t('common.notProvided')}</span>
                      </td>
                      <td>{member.phone}</td>
                      <td>{member.relationship || t('common.notProvided')}</td>
                      <td>{formatDisplayDate(member.moveInDate)}</td>
                      <td>
                        <span className={statusClass(member.status)}>
                          {formatEnumLabel(t, 'memberStatus', member.status)}
                        </span>
                      </td>
                      <td className="resident-member-actions-cell">
                        <div className="table-actions">
                          {member.status === 'LEFT' ? (
                            <button
                              aria-label={t('resident.members.addAgain')}
                              className="icon-action-button"
                              data-tooltip={t('resident.members.addAgain')}
                              type="button"
                              onClick={() => handleRequestAgain(member)}
                            >
                              <LineIcon name="refresh" />
                            </button>
                          ) : (
                            <>
                              <button
                                aria-label={t('common.edit')}
                                className="icon-action-button"
                                data-tooltip={t('common.edit')}
                                type="button"
                                onClick={() => handleEdit(member)}
                              >
                                <LineIcon name="edit" />
                              </button>
                              <button
                                aria-label={t('resident.members.leave')}
                                className="icon-action-button icon-action-danger"
                                data-tooltip={t('resident.members.leave')}
                                type="button"
                                disabled={leavingId === member.id}
                                onClick={() => handleLeave(member)}
                              >
                                <LineIcon name="close" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {members.length === 0 && (
                <div className="empty-state flat-empty-state">{t('resident.members.empty')}</div>
              )}
            </div>
          )}
        </div>
      </section>

      <ActionDialog
        className="resident-member-dialog"
        eyebrow={isEditing ? t('resident.members.editEyebrow') : t('resident.members.newEyebrow')}
        labelledBy="resident-member-dialog-title"
        open={showForm}
        title={isEditing ? editingMember.fullName : t('resident.members.addTitle')}
        onClose={handleCancelFormAction}
      >
        <MemberForm
          key={formKey}
          className="resident-member-dialog-form"
          initialValues={activeFormMember}
          loading={saving}
          submitLabel={
            isEditing
              ? t('resident.members.saveChanges')
              : returnRequestDraft
                ? t('resident.members.submitAgain')
                : t('resident.members.submitApproval')
          }
          onSubmit={isEditing ? handleUpdate : handleCreate}
          onCancel={handleCancelFormAction}
        />
      </ActionDialog>
    </section>
  );
}
