import { useTranslation } from 'react-i18next';
import { formatDisplayDate, formatDisplayDateTime, formatDisplayMonth } from '../utils/dateFormat.js';
import { translateInterfaceText } from '../utils/interfaceTranslations.js';

const ROLE_LABEL_KEYS = {
  ADMIN: 'role.admin',
  STAFF: 'role.staff',
  RESIDENT_HEAD: 'role.residentHead'
};

const ACTION_ALIASES = {
  'Feedback Status Updated': 'FEEDBACK_STATUS_UPDATED',
  'System Contact Updated': 'SYSTEM_CONTACT_UPDATED'
};

const DESCRIPTION_PATTERNS = [
  {
    pattern: /^Changed first-time password$/i,
    key: 'activityLogs.descriptions.changedFirstTimePassword',
    params: () => ({})
  },
  {
    pattern: /^Created (ADMIN|STAFF|RESIDENT_HEAD) account for (.+)$/i,
    key: 'activityLogs.descriptions.createdAccount',
    params: (match, t) => ({
      role: t(`activityLogs.roleInText.${match[1].toUpperCase()}`),
      target: match[2]
    })
  },
  {
    pattern: /^Reset temporary password for (.+)$/i,
    key: 'activityLogs.descriptions.resetTemporaryPassword',
    params: (match) => ({ target: match[1] })
  },
  {
    pattern: /^Deleted user account for (.+)$/i,
    key: 'activityLogs.descriptions.deletedUserAccount',
    params: (match) => ({ target: match[1] })
  },
  {
    pattern: /^Updated profile information$/i,
    key: 'activityLogs.descriptions.updatedProfileInformation',
    params: () => ({})
  },
  {
    pattern: /^Updated feedback (.+) to ([A-Z_]+)$/i,
    key: 'activityLogs.descriptions.updatedFeedbackStatus',
    params: (match, t) => ({
      feedback: match[1],
      status: formatActivityStatus(match[2], t)
    })
  },
  {
    pattern: /^Updated system contact information$/i,
    key: 'activityLogs.descriptions.updatedSystemContact',
    params: () => ({})
  },
  {
    pattern: /^Created room (.+) in building (.+)$/i,
    key: 'activityLogs.descriptions.createdRoom',
    params: (match) => ({ room: match[1], building: match[2] })
  },
  {
    pattern: /^Assigned Head Resident (.+) to room (.+)$/i,
    key: 'activityLogs.descriptions.assignedHeadResident',
    params: (match) => ({ resident: match[1], room: match[2] })
  },
  {
    pattern: /^Added room member request for (.+)$/i,
    key: 'activityLogs.descriptions.addedRoomMemberRequest',
    params: (match) => ({ member: match[1] })
  },
  {
    pattern: /^Approved room member (.+) in room (.+)$/i,
    key: 'activityLogs.descriptions.approvedRoomMember',
    params: (match) => ({ member: match[1], room: match[2] })
  },
  {
    pattern: /^Rejected room member (.+) in room (.+)$/i,
    key: 'activityLogs.descriptions.rejectedRoomMember',
    params: (match) => ({ member: match[1], room: match[2] })
  },
  {
    pattern: /^Uploaded contract for room (.+)$/i,
    key: 'activityLogs.descriptions.uploadedContract',
    params: (match) => ({ room: match[1] })
  },
  {
    pattern: /^Confirmed contract for room (.+)$/i,
    key: 'activityLogs.descriptions.confirmedContract',
    params: (match) => ({ room: match[1] })
  },
  {
    pattern: /^Recorded utility reading for room (.+) on (.+)$/i,
    key: 'activityLogs.descriptions.recordedUtilityReading',
    params: (match) => ({ room: match[1], date: formatDisplayDate(match[2]) })
  },
  {
    pattern: /^Generated invoice for room (.+) and month (.+)$/i,
    key: 'activityLogs.descriptions.generatedInvoice',
    params: (match) => ({ room: match[1], month: formatDisplayMonth(match[2]) })
  },
  {
    pattern: /^Deleted invoice for room (.+) and month (.+)$/i,
    key: 'activityLogs.descriptions.deletedInvoice',
    params: (match) => ({ room: match[1], month: formatDisplayMonth(match[2]) })
  },
  {
    pattern: /^Uploaded payment proof for invoice (.+)$/i,
    key: 'activityLogs.descriptions.uploadedPaymentProof',
    params: (match) => ({ invoice: match[1] })
  },
  {
    pattern: /^Approved payment for invoice (.+)$/i,
    key: 'activityLogs.descriptions.approvedPayment',
    params: (match) => ({ invoice: match[1] })
  },
  {
    pattern: /^Rejected payment for invoice (.+)$/i,
    key: 'activityLogs.descriptions.rejectedPayment',
    params: (match) => ({ invoice: match[1] })
  },
  {
    pattern: /^System created receipt (.+) for invoice (.+)$/i,
    key: 'activityLogs.descriptions.createdReceipt',
    params: (match) => ({ receipt: match[1], invoice: match[2] })
  },
  {
    pattern: /^System created receipt for invoice (.+)$/i,
    key: 'activityLogs.descriptions.createdReceiptWithoutCode',
    params: (match) => ({ invoice: match[1] })
  },
  {
    pattern: /^System created receipt for SePay invoice (.+)$/i,
    key: 'activityLogs.descriptions.createdSepayReceipt',
    params: (match) => ({ invoice: match[1] })
  },
  {
    pattern: /^Received SePay transfer for invoice (.+), room (.+), month (.+)$/i,
    key: 'activityLogs.descriptions.receivedSepayTransfer',
    params: (match) => ({ invoice: match[1], room: match[2], month: formatDisplayMonth(match[3]) })
  },
  {
    pattern: /^Created task (.+) for (.+)$/i,
    key: 'activityLogs.descriptions.createdTask',
    params: (match) => ({ task: match[1], assignee: match[2] })
  },
  {
    pattern: /^Completed task (.+)$/i,
    key: 'activityLogs.descriptions.completedTask',
    params: (match) => ({ task: match[1] })
  },
  {
    pattern: /^Created maintenance request (.+) for room (.+)$/i,
    key: 'activityLogs.descriptions.createdMaintenanceRequest',
    params: (match) => ({ request: match[1], room: match[2] })
  },
  {
    pattern: /^Completed maintenance request (.+) for room (.+)$/i,
    key: 'activityLogs.descriptions.completedMaintenanceRequest',
    params: (match) => ({ request: match[1], room: match[2] })
  }
];

/** Hiển thị ngày giờ nhật ký hoặc nhãn thay thế khi bản ghi chưa có thời điểm. */
export function formatDateTime(value, t) {
  if (!value) {
    return t('activityLogs.notAvailable');
  }

  return formatDisplayDateTime(value, t('activityLogs.notAvailable'));
}

/** Tạo nhãn dễ đọc từ mã thao tác khi chưa có bản dịch riêng. */
function formatFallbackAction(action) {
  return String(action)
    .trim()
    .replace(/\s+/g, '_')
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/** Chuẩn hóa mã thao tác để tra cứu đúng khóa dịch. */
function normalizeActionKey(action) {
  const trimmedAction = String(action).trim();
  return ACTION_ALIASES[trimmedAction] || trimmedAction.toUpperCase().replace(/\s+/g, '_');
}

/** Đổi trạng thái hoạt động thành nhãn đa ngôn ngữ. */
function formatActivityStatus(status, t) {
  const statusKey = String(status || '').trim().toUpperCase();
  return t(`activityLogs.statusInText.${statusKey}`, {
    defaultValue: translateInterfaceText(status || '')
  });
}

/** Lấy nội dung thao tác đã dịch cho bản ghi nhật ký. */
export function formatAction(action, t) {
  if (!action) {
    return t('activityLogs.notAvailable');
  }

  const normalizedAction = normalizeActionKey(action);
  const actionKey = `activityLogs.actions.${normalizedAction}`;
  return t(actionKey, { defaultValue: formatFallbackAction(normalizedAction) });
}

/** Hiển thị vai trò người thực hiện ở dạng dễ đọc. */
function formatRole(role, t) {
  return t(ROLE_LABEL_KEYS[role] || 'activityLogs.notAvailable');
}

/** Dịch hoặc giữ nguyên mô tả chi tiết của một hoạt động. */
export function formatDescription(description, t) {
  if (!description) {
    return t('activityLogs.notAvailable');
  }

  for (const { pattern, key, params } of DESCRIPTION_PATTERNS) {
    const match = description.match(pattern);
    if (match) {
      return t(key, params(match, t));
    }
  }

  return translateInterfaceText(description);
}

/** Bảng nhật ký hoạt động; có thể ẩn cột người dùng khi chỉ xem lịch sử của một cá nhân. */
export default function ActivityLogTable({ logs, showUser = true }) {
  const { i18n, t } = useTranslation();
  const isEnglish = i18n.resolvedLanguage?.startsWith('en') || i18n.language?.startsWith('en');

  return (
    <div className="table-wrap">
      <table className="data-table activity-log-table">
        <thead>
          <tr>
            <th className="activity-log-action-column">{t('activityLogs.columns.action')}</th>
            <th className="activity-log-description-column">{t('activityLogs.columns.description')}</th>
            {showUser && <th className="activity-log-user-column">{t('activityLogs.columns.user')}</th>}
            <th className="activity-log-time-column">{t('activityLogs.columns.time')}</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td>
                <strong>{formatAction(log.action, t)}</strong>
                {isEnglish && log.action && <span className="table-subtext">{log.action}</span>}
              </td>
              <td>{formatDescription(log.description, t)}</td>
              {showUser && (
                <td>
                  <strong>{log.userFullName || t('activityLogs.notAvailable')}</strong>
                  <span className="table-subtext">{log.userEmail || t('activityLogs.notAvailable')}</span>
                  <span className="table-subtext">{formatRole(log.userRole, t)}</span>
                </td>
              )}
              <td>{formatDateTime(log.createdAt, t)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {logs.length === 0 && <div className="empty-state flat-empty-state">{t('activityLogs.empty')}</div>}
    </div>
  );
}
