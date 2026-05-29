import { useTranslation } from 'react-i18next';

const ACTION_LABELS = {
  CONTRACT_CONFIRMED: {
    en: 'Contract confirmed',
    vi: 'Xác nhận hợp đồng'
  },
  CONTRACT_UPLOADED: {
    en: 'Contract uploaded',
    vi: 'Tải hợp đồng lên'
  },
  EXPENSE_CREATED: {
    en: 'Expense created',
    vi: 'Tạo chi phí'
  },
  FIRST_TIME_PASSWORD_CHANGED: {
    en: 'First-time password changed',
    vi: 'Đổi mật khẩu lần đầu'
  },
  HEAD_RESIDENT_ASSIGNED: {
    en: 'Head Resident assigned',
    vi: 'Gán chủ hộ'
  },
  INVOICE_GENERATED: {
    en: 'Invoice generated',
    vi: 'Tạo hóa đơn'
  },
  MAINTENANCE_REQUEST_COMPLETED: {
    en: 'Maintenance request completed',
    vi: 'Hoàn thành yêu cầu bảo trì'
  },
  MAINTENANCE_REQUEST_CREATED: {
    en: 'Maintenance request created',
    vi: 'Tạo yêu cầu bảo trì'
  },
  PAYMENT_APPROVED: {
    en: 'Payment approved',
    vi: 'Duyệt thanh toán'
  },
  PAYMENT_PROOF_UPLOADED: {
    en: 'Payment proof uploaded',
    vi: 'Tải bằng chứng thanh toán'
  },
  PAYMENT_REJECTED: {
    en: 'Payment rejected',
    vi: 'Từ chối thanh toán'
  },
  RECEIPT_CREATED: {
    en: 'Receipt created',
    vi: 'Tạo biên lai'
  },
  ROOM_CREATED: {
    en: 'Room created',
    vi: 'Tạo phòng'
  },
  ROOM_MEMBER_ADDED: {
    en: 'Room member added',
    vi: 'Thêm thành viên phòng'
  },
  ROOM_MEMBER_APPROVED: {
    en: 'Room member approved',
    vi: 'Duyệt thành viên phòng'
  },
  ROOM_MEMBER_REJECTED: {
    en: 'Room member rejected',
    vi: 'Từ chối thành viên phòng'
  },
  TASK_COMPLETED: {
    en: 'Task completed',
    vi: 'Hoàn thành công việc'
  },
  TASK_CREATED: {
    en: 'Task created',
    vi: 'Tạo công việc'
  },
  USER_CREATED: {
    en: 'User created',
    vi: 'Tạo người dùng'
  },
  USER_DELETED: {
    en: 'User deleted',
    vi: 'Xóa người dùng'
  },
  USER_PASSWORD_RESET: {
    en: 'User password reset',
    vi: 'Tạo lại mật khẩu người dùng'
  },
  UTILITY_READING_RECORDED: {
    en: 'Utility reading recorded',
    vi: 'Ghi chỉ số tiện ích'
  }
};

function formatDateTime(value) {
  if (!value) {
    return 'Not available';
  }

  return String(value).replace('T', ' ').slice(0, 16);
}

function formatAction(action, isEnglish) {
  if (!action) {
    return 'Not available';
  }

  const actionLabel = ACTION_LABELS[action]?.[isEnglish ? 'en' : 'vi'];
  if (actionLabel) {
    return actionLabel;
  }

  return action
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function translateRole(role, isEnglish) {
  if (isEnglish) {
    return role;
  }

  const roles = {
    ADMIN: 'Quản trị viên',
    STAFF: 'Nhân viên',
    RESIDENT_HEAD: 'Chủ hộ'
  };

  return roles[role] || role;
}

function translateUserRoleInText(roleCode) {
  const roles = {
    ADMIN: 'quản trị viên',
    STAFF: 'nhân viên',
    RESIDENT_HEAD: 'chủ hộ'
  };

  return roles[roleCode.toUpperCase()] || roleCode;
}

function translateDescription(description, isEnglish) {
  if (!description || isEnglish) {
    return description || 'Not available';
  }

  const patterns = [
    [/^Changed first-time password$/i, () => 'Đã đổi mật khẩu lần đầu'],
    [/^Created (ADMIN|STAFF|RESIDENT_HEAD) account for (.+)$/i, (match) => `Đã tạo tài khoản ${translateUserRoleInText(match[1])} cho ${match[2]}`],
    [/^Reset temporary password for (.+)$/i, (match) => `Đã tạo lại mật khẩu tạm thời cho ${match[1]}`],
    [/^Deleted user account for (.+)$/i, (match) => `Đã xóa tài khoản người dùng ${match[1]}`],
    [/^Created room (.+) in building (.+)$/i, (match) => `Đã tạo phòng ${match[1]} trong tòa nhà ${match[2]}`],
    [/^Assigned Head Resident (.+) to room (.+)$/i, (match) => `Đã gán chủ hộ ${match[1]} vào phòng ${match[2]}`],
    [/^Added room member request for (.+)$/i, (match) => `Đã gửi yêu cầu thêm thành viên phòng cho ${match[1]}`],
    [/^Approved room member (.+) in room (.+)$/i, (match) => `Đã duyệt thành viên phòng ${match[1]} trong phòng ${match[2]}`],
    [/^Rejected room member (.+) in room (.+)$/i, (match) => `Đã từ chối thành viên phòng ${match[1]} trong phòng ${match[2]}`],
    [/^Uploaded contract for room (.+)$/i, (match) => `Đã tải hợp đồng cho phòng ${match[1]}`],
    [/^Confirmed contract for room (.+)$/i, (match) => `Đã xác nhận hợp đồng cho phòng ${match[1]}`],
    [/^Recorded utility reading for room (.+) on (.+)$/i, (match) => `Đã ghi chỉ số tiện ích cho phòng ${match[1]} ngày ${match[2]}`],
    [/^Generated invoice for room (.+) and month (.+)$/i, (match) => `Đã tạo hóa đơn cho phòng ${match[1]} tháng ${match[2]}`],
    [/^Uploaded payment proof for invoice (.+)$/i, (match) => `Đã tải bằng chứng thanh toán cho hóa đơn ${match[1]}`],
    [/^Approved payment for invoice (.+)$/i, (match) => `Đã duyệt thanh toán cho hóa đơn ${match[1]}`],
    [/^Rejected payment for invoice (.+)$/i, (match) => `Đã từ chối thanh toán cho hóa đơn ${match[1]}`],
    [/^System created receipt (.+) for invoice (.+)$/i, (match) => `Hệ thống đã tạo biên lai ${match[1]} cho hóa đơn ${match[2]}`],
    [/^Created expense (.+)$/i, (match) => `Đã tạo chi phí ${match[1]}`],
    [/^Created task (.+) for (.+)$/i, (match) => `Đã tạo công việc ${match[1]} cho ${match[2]}`],
    [/^Completed task (.+)$/i, (match) => `Đã hoàn thành công việc ${match[1]}`],
    [/^Created maintenance request (.+) for room (.+)$/i, (match) => `Đã tạo yêu cầu bảo trì ${match[1]} cho phòng ${match[2]}`],
    [/^Completed maintenance request (.+) for room (.+)$/i, (match) => `Đã hoàn thành yêu cầu bảo trì ${match[1]} cho phòng ${match[2]}`]
  ];

  for (const [pattern, translate] of patterns) {
    const match = description.match(pattern);
    if (match) {
      return translate(match);
    }
  }

  return description;
}

export default function ActivityLogTable({ logs }) {
  const { i18n } = useTranslation();
  const isEnglish = i18n.language?.startsWith('en');

  return (
    <div className="table-wrap">
      <table className="data-table activity-log-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>User</th>
            <th>Action</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td>{formatDateTime(log.createdAt)}</td>
              <td>
                <strong>{log.userFullName}</strong>
                <span className="table-subtext">{log.userEmail}</span>
                <span className="table-subtext">{translateRole(log.userRole, isEnglish)}</span>
              </td>
              <td>
                <strong>{formatAction(log.action, isEnglish)}</strong>
                {isEnglish && <span className="table-subtext">{log.action}</span>}
              </td>
              <td>{translateDescription(log.description, isEnglish)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {logs.length === 0 && <div className="empty-state flat-empty-state">No activity logs found.</div>}
    </div>
  );
}
