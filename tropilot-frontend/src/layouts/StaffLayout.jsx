import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ChatWidget from '../components/ChatWidget.jsx';
import SidebarBrand from '../components/SidebarBrand.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const STAFF_NAV_ITEMS = [
  { to: '/staff/dashboard', labelKey: 'navigation.dashboard' },
  { to: '/staff/notifications', labelKey: 'navigation.notifications' },
  { to: '/staff/buildings', labelKey: 'navigation.buildings' },
  { to: '/staff/rooms', labelKey: 'navigation.rooms' },
  { to: '/staff/tasks', labelKey: 'navigation.tasks' },
  { to: '/staff/maintenance', labelKey: 'navigation.maintenance' },
  { to: '/staff/profile', labelKey: 'navigation.profile' },
  { to: '/staff/settings', labelKey: 'settings.title' }
];

export default function StaffLayout() {
  const { logout } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <SidebarBrand />
        <div className="sidebar-user">
          <span>TroPilot</span>
          <small>{t('sidebar.access.staff')}</small>
        </div>
        <nav aria-label={t('navigation.staff')}>
          {STAFF_NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to}>
              {t(item.labelKey)}
            </NavLink>
          ))}
        </nav>
        <button className="secondary-button" type="button" onClick={logout}>
          {t('common.signOut')}
        </button>
      </aside>
      <main className="main-panel">
        <Outlet />
      </main>
      <ChatWidget />
    </div>
  );
}
