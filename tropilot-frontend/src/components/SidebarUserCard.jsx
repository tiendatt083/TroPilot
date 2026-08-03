import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.jsx';
import { getRoleDisplayName } from '../utils/userDisplay.js';

/** Thẻ hiển thị tài khoản đang đăng nhập và cung cấp thao tác đăng xuất trong sidebar. */
export default function SidebarUserCard({
  interactive = false,
  onClick,
  title,
  ariaHasPopup
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const content = (
    <>
      <span>TroPilot</span>
      <small>{getRoleDisplayName(user?.role, t)}</small>
    </>
  );

  if (interactive) {
    return (
      <button
        aria-haspopup={ariaHasPopup}
        className="sidebar-user sidebar-user-button"
        title={title}
        type="button"
        onClick={onClick}
      >
        {content}
      </button>
    );
  }

  return <div className="sidebar-user">{content}</div>;
}
