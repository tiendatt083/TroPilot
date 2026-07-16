import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useOutletContext } from 'react-router-dom';
import * as memberApi from '../../features/residents/api.js';
import { formatDisplayDate } from '../../utils/dateFormat.js';
import { exportRowsToExcel } from '../../utils/excelExport.js';
import { formatEnumLabel } from '../../utils/i18nFormat.js';
import { formatRoomCode } from '../../utils/roomDisplay.js';

function statusClass(status) {
  return `status-pill member-status-${status.toLowerCase()}`;
}

function buildExportFileName(building) {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const buildingCode = String(building?.buildingCode || 'building')
    .trim()
    .replace(/[^a-zA-Z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();

  return `tropilot-${buildingCode || 'building'}-room-members-${day}-${month}-${year}.xlsx`;
}

export default function AdminBuildingMemberPage() {
  const { t } = useTranslation();
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
      setError(apiError.response?.data?.message || t('workspace.members.loadError'));
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
      setMessage(t('workspace.members.approved'));
      await loadMembers();
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
      await memberApi.rejectMember(member.id, buildingFilter);
      setMessage(t('workspace.members.rejected'));
      await loadMembers();
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('workspace.members.rejectError'));
    } finally {
      setProcessingId(null);
    }
  };

  const renderActions = (member) => {
    if (member.status !== 'PENDING') {
      return <span className="muted-text">{t('workspace.vehicles.noAction')}</span>;
    }

    return (
      <div className="table-actions">
        <button
          className="secondary-button compact-button"
          type="button"
          disabled={processingId === member.id}
          onClick={() => handleApprove(member)}
        >
          {t('pendingMemberReview.actions.approve')}
        </button>
        <button
          className="secondary-button compact-button"
          type="button"
          disabled={processingId === member.id}
          onClick={() => handleReject(member)}
        >
          {t('pendingMemberReview.actions.reject')}
        </button>
      </div>
    );
  };

  const handleExport = () => {
    setMessage('');
    setError('');

    if (members.length === 0) {
      setError(t('workspace.members.exportEmpty'));
      return;
    }

    const rows = members.map((member, index) => ({
      [t('accountDirectory.columns.id')]: index + 1,
      [t('pendingMemberReview.columns.name')]: member.fullName || t('common.notProvided'),
      [t('accountDirectory.columns.email')]: member.email || t('common.notProvided'),
      [t('profile.fields.phone')]: member.phone || t('common.notProvided'),
      [t('forms.member.relationship')]: member.relationship || t('common.notProvided'),
      [t('tables.common.room')]: formatRoomCode(member) || t('common.notProvided'),
      [t('tables.common.headResident')]: member.residentHeadName || t('common.notProvided'),
      [t('residentDirectory.columns.login')]: member.residentHeadEmail || t('common.notProvided'),
      [t('tables.common.status')]: formatEnumLabel(t, 'memberStatus', member.status),
      [t('workspace.members.occupants')]: t('workspace.members.occupantCount', {
        total: member.totalOccupants,
        max: member.maxOccupants
      }),
      [t('forms.member.moveInDate')]: formatDisplayDate(member.moveInDate, t('common.notSet')),
      [t('roomManagement.moveOut')]: formatDisplayDate(member.moveOutDate, t('common.notSet'))
    }));

    exportRowsToExcel({
      rows,
      fileName: buildExportFileName(building),
      sheetName: t('workspace.members.export.sheetName')
    });
  };

  return (
    <div className="building-workspace">
      <div className="building-section-header">
        <span className="page-eyebrow">{t('workspace.members.eyebrow')}</span>
        <button className="secondary-button inline-button" type="button" onClick={handleExport}>
          {t('workspace.members.exportExcel')}
        </button>
      </div>

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">{t('workspace.members.loading')}</div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('pendingMemberReview.columns.name')}</th>
                <th>{t('profile.fields.phone')}</th>
                <th>{t('tables.common.room')}</th>
                <th>{t('tables.common.headResident')}</th>
                <th>{t('tables.common.status')}</th>
                <th>{t('workspace.members.occupants')}</th>
                <th>{t('forms.member.moveInDate')}</th>
                <th>{t('tables.common.actions')}</th>
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
                  <td>
                    <Link
                      className="secondary-link compact-link"
                      to={`/admin/buildings/${building.id}/rooms/${member.roomId}`}
                    >
                      {formatRoomCode(member)}
                    </Link>
                  </td>
                  <td>
                    <strong>{member.residentHeadName}</strong>
                    <span className="table-subtext">{member.residentHeadEmail}</span>
                  </td>
                  <td>
                    <span className={statusClass(member.status)}>
                      {formatEnumLabel(t, 'memberStatus', member.status)}
                    </span>
                  </td>
                  <td>
                    {t('workspace.members.occupantCount', {
                      total: member.totalOccupants,
                      max: member.maxOccupants
                    })}
                  </td>
                  <td>{formatDisplayDate(member.moveInDate)}</td>
                  <td>{renderActions(member)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {members.length === 0 && <div className="empty-state flat-empty-state">{t('workspace.members.empty')}</div>}
        </div>
      )}
    </div>
  );
}
