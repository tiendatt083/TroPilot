import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ChatWidget from '../components/ChatWidget.jsx';
import SidebarBrand from '../components/SidebarBrand.jsx';
import SidebarNavGroup from '../components/SidebarNavGroup.jsx';

const STAFF_OPERATION_ITEMS = [
  { to: '/staff/buildings', labelKey: 'navigation.buildings' },
  { to: '/staff/tasks', labelKey: 'navigation.tasks' },
  { to: '/staff/maintenance', labelKey: 'navigation.maintenance' }
];

const STAFF_INFORMATION_ITEMS = [
  { to: '/staff/notifications', labelKey: 'navigation.notifications' },
  { to: '/staff/contact', labelKey: 'navigation.contact' }
];

const STAFF_PRIMARY_ITEMS = [
  { to: '/staff/dashboard', labelKey: 'navigation.dashboard' }
];

const STAFF_ACCOUNT_ITEMS = [
  { to: '/staff/profile', labelKey: 'navigation.profile' },
  { to: '/staff/settings', labelKey: 'settings.title' }
];

export default function StaffLayout() {
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
          {STAFF_PRIMARY_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to}>
              {t(item.labelKey)}
            </NavLink>
          ))}
          <SidebarNavGroup labelKey="navigation.operations" items={STAFF_OPERATION_ITEMS} />
          <SidebarNavGroup labelKey="navigation.informationAndFeedback" items={STAFF_INFORMATION_ITEMS} />
          {STAFF_ACCOUNT_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to}>
              {t(item.labelKey)}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="main-panel">
        <Outlet />
      </main>
      <ChatWidget />
    </div>
  );
}
