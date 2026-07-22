import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import * as memberApi from '../../features/residents/api.js';
import FilterBar from '../../components/common/FilterBar.jsx';
import { exportRowsToExcel } from '../../utils/excelExport.js';
import { formatRoomCode } from '../../utils/roomDisplay.js';
import { normalizeSearchText } from '../../utils/searchText.js';

function normalize(value) {
  return normalizeSearchText(value);
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

function buildExportFileName() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();

  return `tropilot-pending-members-${day}-${month}-${year}.xlsx`;
}

function formatBuildingLabel(member, fallback) {
  if (member.buildingCode && member.buildingName) {
    return `${member.buildingCode} - ${member.buildingName}`;
  }

  return member.buildingCode || member.buildingName || fallback;
}

function buildRoomDetailPath(member) {
  if (!member.buildingId || !member.roomId) {
    return '';
  }

  return `/admin/buildings/${member.buildingId}/rooms/${member.roomId}`;
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

  const handleExport = () => {
    setMessage('');
    setError('');

    if (filteredMembers.length === 0) {
      setError(t('pendingMemberReview.messages.exportEmpty'));
      return;
    }

    const rows = filteredMembers.map((member, index) => ({
      [t('pendingMemberReview.columns.id')]: index + 1,
      [t('pendingMemberReview.columns.name')]: member.fullName || t('common.notProvided'),
      [t('userCreate.fields.email')]: member.email || t('common.notProvided'),
      [t('pendingMemberReview.columns.phone')]: member.phone || t('common.notProvided'),
      [t('pendingMemberReview.columns.role')]: t('buildingUsers.roles.roomMember'),
      [t('pendingMemberReview.columns.headResident')]: member.residentHeadName || t('common.notProvided'),
      [t('pendingMemberReview.columns.building')]: formatBuildingLabel(member, t('common.notProvided')),
      [t('pendingMemberReview.columns.room')]: formatRoomCode(member)
    }));

    exportRowsToExcel({
      rows,
      fileName: buildExportFileName(),
      sheetName: t('pendingMemberReview.export.sheetName')
    });
  };

  return (
    <section className="content-section pending-member-review-page modern-user-page">
      <div className="account-page-hero">
        <div>
          <h1>{t('pendingMemberReview.title')}</h1>
          <p>{t('pendingMemberReview.summary', { count: members.length })}</p>
        </div>
        <div className="page-action-row">
          <button className="secondary-button inline-button" type="button" onClick={handleExport}>
            {t('pendingMemberReview.actions.exportExcel')}
          </button>
        </div>
      </div>

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      <div className="account-control-panel pending-member-control-panel">
        <FilterBar
          as="div"
          className="account-search-control instant-account-filter"
          searchAriaLabel={t('pendingMemberReview.filters.searchAria')}
          searchPlaceholder={t('pendingMemberReview.filters.searchPlaceholder')}
          searchValue={search}
          suggestionFields={[
            'fullName',
            'phone',
            'email',
            'residentHeadName',
            'roomCode',
            'buildingCode'
          ]}
          suggestionItems={members}
          clearLabel={t('common.clear')}
          onClear={() => setSearch('')}
          onSearchChange={setSearch}
        />
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
                <th>{t('pendingMemberReview.columns.phone')}</th>
                <th>{t('pendingMemberReview.columns.role')}</th>
                <th>{t('pendingMemberReview.columns.headResident')}</th>
                <th>{t('pendingMemberReview.columns.building')}</th>
                <th>{t('pendingMemberReview.columns.room')}</th>
                <th className="pending-member-actions-column">{t('pendingMemberReview.columns.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member, index) => {
                const roomDetailPath = buildRoomDetailPath(member);

                return (
                  <tr key={member.id}>
                    <td className="account-sequence-cell">{index + 1}</td>
                    <td>
                      <strong>{member.fullName}</strong>
                      <span className="table-subtext">
                        {member.email || t('common.notProvided')}
                      </span>
                    </td>
                    <td>{member.phone || t('common.notProvided')}</td>
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
                    <td>{formatBuildingLabel(member, t('common.notProvided'))}</td>
                    <td>
                      {roomDetailPath ? (
                        <Link className="secondary-link compact-link" to={roomDetailPath}>
                          {formatRoomCode(member)}
                        </Link>
                      ) : (
                        t('common.notProvided')
                      )}
                    </td>
                    <td className="pending-member-actions-cell">
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
                );
              })}
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
