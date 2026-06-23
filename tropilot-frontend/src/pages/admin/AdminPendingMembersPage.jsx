import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import * as memberApi from '../../features/residents/api.js';
import { formatRoomCode } from '../../utils/roomDisplay.js';

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function memberMatchesSearch(member, searchValue) {
  if (!searchValue) {
    return true;
  }

  return [
    member.fullName,
    member.phone,
    member.email,
    member.residentHeadName,
    member.residentHeadEmail,
    member.roomCode,
    member.roomName,
    member.buildingCode,
    member.buildingName
  ].some((value) => normalize(value).includes(searchValue));
}

export default function AdminPendingMembersPage() {
  const { t } = useTranslation();
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState('');
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

  const filteredMembers = useMemo(() => {
    const searchValue = normalize(search);
    return members.filter((member) => memberMatchesSearch(member, searchValue));
  }, [members, search]);

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
    <section className="content-section pending-member-review-page modern-user-page">
      <div className="account-page-hero">
        <div>
          <h1>{t('pendingMemberReview.title')}</h1>
          <p>{t('pendingMemberReview.summary', { count: members.length })}</p>
        </div>
      </div>

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      <div className="account-control-panel pending-member-control-panel">
        <div className="account-search-control">
          <input
            aria-label={t('pendingMemberReview.filters.searchAria')}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('pendingMemberReview.filters.searchPlaceholder')}
          />
          <button
            className="secondary-button inline-button"
            type="button"
            onClick={() => setSearch('')}
          >
            {t('common.clear')}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">{t('pendingMemberReview.messages.loading')}</div>
      ) : (
        <div className="table-wrap">
          <table className="data-table pending-member-review-table">
            <thead>
              <tr>
                <th>{t('pendingMemberReview.columns.id')}</th>
                <th>{t('pendingMemberReview.columns.name')}</th>
                <th>{t('userManagement.columns.role')}</th>
                <th>{t('pendingMemberReview.columns.headResident')}</th>
                <th>{t('pendingMemberReview.columns.room')}</th>
                <th>{t('pendingMemberReview.columns.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member, index) => (
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
                    <span className="role-pill role-room-member">
                      {t('buildingUsers.roles.roomMember')}
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
                    <div className="table-actions icon-table-actions pending-member-action-icons">
                      <button
                        aria-label={t('pendingMemberReview.actions.approve')}
                        className="icon-action-button icon-action-success"
                        data-tooltip={t('pendingMemberReview.actions.approve')}
                        type="button"
                        disabled={processingId === member.id}
                        onClick={() => handleApprove(member)}
                      >
                        <CheckIcon />
                      </button>
                      <button
                        aria-label={t('pendingMemberReview.actions.reject')}
                        className="icon-action-button icon-action-danger"
                        data-tooltip={t('pendingMemberReview.actions.reject')}
                        type="button"
                        disabled={processingId === member.id}
                        onClick={() => handleReject(member)}
                      >
                        <CloseIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredMembers.length === 0 && (
            <div className="empty-state flat-empty-state">
              {t('pendingMemberReview.messages.empty')}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
