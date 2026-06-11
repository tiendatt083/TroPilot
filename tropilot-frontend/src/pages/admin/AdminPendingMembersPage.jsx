import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import * as memberApi from '../../api/memberApi.js';
import PageHeader from '../../components/PageHeader.jsx';
import { formatRoomCode } from '../../utils/roomDisplay.js';

export default function AdminPendingMembersPage() {
  const { t } = useTranslation();
  const [members, setMembers] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const loadMembers = useCallback(async () => {
    setError('');

    try {
      const response = await memberApi.getPendingMembers();
      setMembers(response.data);
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('pendingMemberReview.messages.loadError'));
    }
  }, [t]);

  useEffect(() => {
    loadMembers().finally(() => setLoading(false));
  }, [loadMembers]);

  const handleApprove = async (member) => {
    setProcessingId(member.id);
    setMessage('');
    setError('');

    try {
      await memberApi.approveMember(member.id);
      setMessage(t('pendingMemberReview.messages.approved', { name: member.fullName }));
      await loadMembers();
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('pendingMemberReview.messages.approveError'));
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
      setMessage(t('pendingMemberReview.messages.rejected', { name: member.fullName }));
      await loadMembers();
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('pendingMemberReview.messages.rejectError'));
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <section className="content-section pending-member-review-page">
      <PageHeader
        eyebrow={t('pendingMemberReview.eyebrow')}
        title={t('pendingMemberReview.title')}
      />

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">{t('pendingMemberReview.messages.loading')}</div>
      ) : (
        <div className="table-wrap">
          <table className="data-table pending-member-review-table">
            <thead>
              <tr>
                <th>{t('pendingMemberReview.columns.id')}</th>
                <th>{t('pendingMemberReview.columns.name')}</th>
                <th>{t('pendingMemberReview.columns.headResident')}</th>
                <th>{t('pendingMemberReview.columns.room')}</th>
                <th>{t('pendingMemberReview.columns.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member, index) => (
                <tr key={member.id}>
                  <td className="account-sequence-cell">{index + 1}</td>
                  <td>
                    <strong>{member.fullName}</strong>
                    <span className="table-subtext">
                      {member.phone || t('common.notProvided')}
                    </span>
                    <span className="table-subtext">
                      {member.email || t('common.notProvided')}
                    </span>
                  </td>
                  <td>
                    <strong>{member.residentHeadName}</strong>
                    <span className="table-subtext">
                      {member.residentHeadEmail || t('common.notProvided')}
                    </span>
                  </td>
                  <td>
                    <Link className="secondary-link compact-link" to={`/admin/rooms/${member.roomId}/members`}>
                      {formatRoomCode(member)}
                    </Link>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="button-link compact-button"
                        type="button"
                        disabled={processingId === member.id}
                        onClick={() => handleApprove(member)}
                      >
                        {t('pendingMemberReview.actions.approve')}
                      </button>
                      <button
                        className="danger-button compact-button"
                        type="button"
                        disabled={processingId === member.id}
                        onClick={() => handleReject(member)}
                      >
                        {t('pendingMemberReview.actions.reject')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {members.length === 0 && (
            <div className="empty-state flat-empty-state">
              {t('pendingMemberReview.messages.empty')}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
