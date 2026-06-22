import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDisplayDate } from '../utils/dateFormat.js';

export default function AdminAccountDirectoryTable({
  accounts,
  emptyMessage,
  deletingId = null,
  nameColumnLabel,
  onDelete,
  showRoom = false,
  showMembersInline = false
}) {
  const { t } = useTranslation();
  const [selectedAccount, setSelectedAccount] = useState(null);

  useEffect(() => {
    if (!selectedAccount) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setSelectedAccount(null);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [selectedAccount]);

  return (
    <>
      <div className="table-wrap account-directory-table-wrap">
        <table className={`data-table account-directory-table ${showRoom ? 'has-room-column' : 'without-room-column'}`}>
          <thead>
            <tr>
              <th className="account-id-column">{t('accountDirectory.columns.id')}</th>
              <th className="account-name-column">{nameColumnLabel || t('accountDirectory.columns.name')}</th>
              <th className="account-email-column">{t('accountDirectory.columns.email')}</th>
              {showRoom && (
                <th className="account-room-column">{t('accountDirectory.columns.room')}</th>
              )}
              <th className="account-status-column">{t('accountDirectory.columns.status')}</th>
              <th className="account-password-column">{t('accountDirectory.columns.temporaryPassword')}</th>
              <th className="account-actions-column">{t('accountDirectory.columns.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account, index) => {
              const members = account.members || [];

              return (
                <tr key={account.id}>
                  <td className="account-sequence-cell">{index + 1}</td>
                  <td>
                    <strong>{account.fullName}</strong>
                    <span className="table-subtext">
                      {account.phone || t('common.notProvided')}
                    </span>
                    {showMembersInline && members.length > 0 && (
                      <div className="account-inline-members">
                        <span className="account-inline-members-label">
                          {t('accountDirectory.inlineMembers')}
                        </span>
                        <div className="account-inline-member-list">
                          {members.map((member) => (
                            <span
                              className="account-inline-member"
                              key={member.id}
                            >
                              {member.fullName}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </td>
                  <td>{account.email}</td>
                  {showRoom && <td>{formatRoom(account, t)}</td>}
                  <td>
                    <span className={`status-pill status-${account.status.toLowerCase()}`}>
                      {formatStatus(account.status, t)}
                    </span>
                  </td>
                  <td>
                    {account.mustChangePassword ? (
                      <span className="temporary-password-value">
                        {account.temporaryPassword || t('userManagement.passwordUnavailable')}
                      </span>
                    ) : (
                      <span className="muted-text">{t('userManagement.passwordChanged')}</span>
                    )}
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="secondary-button compact-button"
                        type="button"
                        onClick={() => setSelectedAccount(account)}
                      >
                        {t('accountDirectory.actions.viewDetails')}
                      </button>
                      {account.role !== 'ADMIN' && (
                        <button
                          className="danger-button compact-button"
                          type="button"
                          disabled={deletingId === account.id}
                          onClick={() => onDelete(account)}
                        >
                          {deletingId === account.id
                            ? t('accountDirectory.actions.deleting')
                            : t('common.delete')}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {accounts.length === 0 && (
          <div className="empty-state flat-empty-state">{emptyMessage}</div>
        )}
      </div>

      {selectedAccount && (
        <AccountDetailModal
          account={selectedAccount}
          onClose={() => setSelectedAccount(null)}
          showRoom={showRoom}
          t={t}
        />
      )}
    </>
  );
}

function AccountDetailModal({ account, onClose, showRoom, t }) {
  const members = account.members || [];

  return (
    <div className="account-modal-overlay" role="presentation" onMouseDown={onClose}>
      <section
        aria-labelledby="account-detail-title"
        aria-modal="true"
        className="account-detail-modal"
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="account-modal-header">
          <div>
            <span className="section-eyebrow">{t('accountDirectory.detail.eyebrow')}</span>
            <h2 id="account-detail-title">{account.fullName}</h2>
          </div>
          <button
            aria-label={t('accountDirectory.actions.close')}
            className="account-modal-close"
            type="button"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <dl className="account-detail-grid">
          <DetailItem label={t('accountDirectory.detail.email')} value={account.email} />
          <DetailItem label={t('accountDirectory.detail.phone')} value={account.phone || t('common.notProvided')} />
          <DetailItem label={t('accountDirectory.detail.role')} value={formatRole(account.role, t)} />
          {showRoom && (
            <DetailItem label={t('accountDirectory.detail.room')} value={formatRoom(account, t)} />
          )}
          <DetailItem label={t('accountDirectory.detail.status')} value={formatStatus(account.status, t)} />
          <DetailItem
            label={t('accountDirectory.detail.createdAt')}
            value={formatDisplayDate(account.createdAt, t('common.notAvailable'))}
          />
          <DetailItem
            label={t('accountDirectory.detail.temporaryPassword')}
            value={account.mustChangePassword
              ? account.temporaryPassword || t('userManagement.passwordUnavailable')
              : t('userManagement.passwordChanged')}
          />
        </dl>

        {account.role === 'RESIDENT_HEAD' && (
          <div className="account-member-section">
            <div className="account-member-section-header">
              <h3>{t('accountDirectory.detail.members')}</h3>
              <span>{t('accountDirectory.detail.memberCount', { count: members.length })}</span>
            </div>
            {members.length > 0 ? (
              <div className="account-member-list">
                {members.map((member) => (
                  <div className="account-member-item" key={member.id}>
                    <div>
                      <strong>{member.fullName}</strong>
                      <span>{member.relationship || t('residentDirectory.member')}</span>
                    </div>
                    <div>
                      <span>{member.phone || t('common.notProvided')}</span>
                      <span>{member.email || t('common.notProvided')}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state compact-empty-state">
                {t('accountDirectory.detail.noMembers')}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function formatRoom(account, t) {
  const room = account.assignedRoomCode || account.assignedRoomName;

  if (!room) {
    return t('common.notAssigned');
  }

  return room;
}

function formatRole(role, t) {
  if (role === 'STAFF') {
    return t('role.staff');
  }

  if (role === 'RESIDENT_HEAD') {
    return t('role.residentHead');
  }

  return t('role.admin');
}

function formatStatus(status, t) {
  if (status === 'LOCKED') {
    return t('userManagement.status.locked');
  }

  if (status === 'INACTIVE') {
    return t('common.inactive');
  }

  return t('userManagement.status.active');
}
