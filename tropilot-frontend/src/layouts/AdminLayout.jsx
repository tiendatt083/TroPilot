import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SidebarBrand from '../components/SidebarBrand.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const ADMIN_NAV_ITEMS = [
  { to: '/admin/dashboard', labelKey: 'navigation.dashboard' },
  { to: '/admin/notifications', labelKey: 'navigation.notifications' },
  { to: '/admin/activity-logs', labelKey: 'navigation.activityLogs' },
  { to: '/admin/feedbacks', labelKey: 'navigation.feedbacks' },
  { to: '/admin/invoice-complaints', labelKey: 'navigation.invoiceComplaints' },
  { to: '/admin/users', labelKey: 'navigation.users' },
  { to: '/admin/members/pending', labelKey: 'navigation.pendingMembers' },
  { to: '/admin/contracts', labelKey: 'navigation.contracts' },
  { to: '/admin/tasks', labelKey: 'navigation.tasks' },
  { to: '/admin/maintenance', labelKey: 'navigation.maintenance' },
  { to: '/admin/buildings', labelKey: 'navigation.buildings' },
  { to: '/admin/rooms', labelKey: 'navigation.rooms' },
  { to: '/admin/settings', labelKey: 'settings.title' }
];

export default function AdminLayout() {
  const { logout, user } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <SidebarBrand />
        <div className="sidebar-user">
          <span>{user?.fullName}</span>
          <small>{t('role.admin')}</small>
        </div>
        <nav aria-label={t('navigation.admin')}>
          {ADMIN_NAV_ITEMS.map((item) => (
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
    </div>
  );
}
