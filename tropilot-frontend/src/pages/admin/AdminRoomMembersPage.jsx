import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import * as memberApi from '../../features/residents/api.js';
import * as roomApi from '../../features/rooms/api.js';
import useRoomRouteContext from '../../features/rooms/useRoomRouteContext.js';
import PageHeader from '../../components/PageHeader.jsx';
import { formatDisplayDate } from '../../utils/dateFormat.js';
import { formatEnumLabel } from '../../utils/i18nFormat.js';
import { formatRoomCode } from '../../utils/roomDisplay.js';

function statusClass(status) {
  return `status-pill member-status-${status.toLowerCase()}`;
}

function countText(headResident, members, room, t) {
  const maxOccupants = members[0]?.maxOccupants || room?.maxOccupants;

  if (!maxOccupants) {
    return t('roomManagement.occupantsUnavailable');
  }

  const activeHeadResidentCount = headResident?.assigned ? 1 : 0;
  const approvedMemberCount = members.filter((member) => member.status === 'APPROVED').length;

  return t('roomManagement.activeOccupants', {
    count: activeHeadResidentCount + approvedMemberCount,
    max: maxOccupants
  });
}

export default function AdminRoomMembersPage() {
  const { t } = useTranslation();
  const { roomBasePath, roomId } = useRoomRouteContext('admin');
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
        roomApi.getAdminRoom(roomId),
        roomApi.getHeadResidentAssignment(roomId),
        memberApi.getAdminRoomMembers(roomId)
      ]);
      setRoom(roomResponse.data);
      setHeadResident(headResponse.data);
      setMembers(membersResponse.data);
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('roomManagement.membersLoadError'));
    }
  };

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, [roomId]);

  const handleApprove = async (member) => {
    setProcessingId(member.id);
    setMessage('');
    setError('');

    try {
      await memberApi.approveMember(member.id);
      setMessage(t('workspace.members.approved'));
      await loadData();
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('workspace.members.approveError'));
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
      setMessage(t('workspace.members.rejected'));
      await loadData();
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('workspace.members.rejectError'));
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return <div className="empty-state">{t('roomManagement.loadingMembers')}</div>;
  }

  return (
    <section className="content-section admin-room-members-page">
      <div className="page-title-row">
        <PageHeader eyebrow={formatRoomCode(room) || t('tables.common.room')} title={t('roomManagement.membersTitle')} />
        <div className="button-row">
          <Link className="secondary-link" to={`${roomBasePath}/${roomId}`}>
            {t('roomManagement.backToRoom')}
          </Link>
          <div className="count-summary">{countText(headResident, members, room, t)}</div>
        </div>
      </div>

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>{t('pendingMemberReview.columns.name')}</th>
              <th>{t('profile.fields.phone')}</th>
              <th>{t('roomManagement.relationship')}</th>
              <th>{t('roomManagement.moveIn')}</th>
              <th>{t('roomManagement.moveOut')}</th>
              <th>{t('tables.common.status')}</th>
              <th>{t('tables.common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {headResident?.assigned && (
              <tr>
                <td>
                  <strong>{headResident.residentHeadName}</strong>
                  <div className="muted-text">{headResident.residentHeadEmail}</div>
                </td>
                <td>{headResident.residentHeadPhone || t('common.notProvided')}</td>
                <td>{t('role.residentHead')}</td>
                <td>{formatDisplayDate(headResident.assignmentStartDate)}</td>
                <td>{formatDisplayDate(headResident.assignmentEndDate, t('common.notSet'))}</td>
                <td>
                  <span className={statusClass('APPROVED')}>{t('roomManagement.active')}</span>
                </td>
                <td>
                  <span
                    aria-label={t('roomManagement.noAction')}
                    className="icon-action-static"
                    title={t('roomManagement.noAction')}
                  >
                    <MinusIcon />
                  </span>
                </td>
              </tr>
            )}
            {members.map((member) => (
              <tr key={member.id}>
                <td>
                  <strong>{member.fullName}</strong>
                  <span className="table-subtext">{member.email || t('common.notProvided')}</span>
                </td>
                <td>{member.phone}</td>
                <td>{member.relationship || t('common.notProvided')}</td>
                <td>{formatDisplayDate(member.moveInDate)}</td>
                <td>{formatDisplayDate(member.moveOutDate, t('common.notSet'))}</td>
                <td>
                  <span className={statusClass(member.status)}>{formatEnumLabel(t, 'memberStatus', member.status)}</span>
                </td>
                <td>
                  {member.status === 'PENDING' ? (
                    <div className="table-actions icon-table-actions room-member-action-icons">
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
                  ) : (
                    <span
                      aria-label={t('roomManagement.noAction')}
                      className="icon-action-static"
                      title={t('roomManagement.noAction')}
                    >
                      <MinusIcon />
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!headResident?.assigned && members.length === 0 && (
          <div className="empty-state flat-empty-state">{t('workspace.members.empty')}</div>
        )}
      </div>
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

function MinusIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M5 12h14" />
    </svg>
  );
}
