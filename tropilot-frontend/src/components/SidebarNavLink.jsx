import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LineIcon from './common/LineIcon.jsx';

/** Một liên kết điều hướng trong sidebar, tự làm nổi bật khi đúng trang hiện tại. */
export default function SidebarNavLink({ item }) {
  const { t } = useTranslation();

  return (
    <NavLink className={item.icon ? 'has-sidebar-icon' : undefined} to={item.to}>
      {item.icon && <LineIcon className="sidebar-link-icon" name={item.icon} />}
      <span className="sidebar-nav-label">{t(item.labelKey)}</span>
    </NavLink>
  );
}
