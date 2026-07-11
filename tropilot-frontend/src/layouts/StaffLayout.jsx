import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ChatWidget from '../components/ChatWidget.jsx';
import SidebarBrand from '../components/SidebarBrand.jsx';
import SidebarNavGroup from '../components/SidebarNavGroup.jsx';
import SidebarNavLink from '../components/SidebarNavLink.jsx';
import SidebarUserCard from '../components/SidebarUserCard.jsx';

const STAFF_OPERATION_ITEMS = [
  { to: '/staff/buildings', labelKey: 'navigation.buildings', icon: 'building' },
  { to: '/staff/tasks', labelKey: 'navigation.tasks', icon: 'fileText' },
  { to: '/staff/maintenance', labelKey: 'navigation.maintenance', icon: 'tool' }
];

const STAFF_INFORMATION_ITEMS = [
  { to: '/staff/notifications', labelKey: 'navigation.notifications', icon: 'bell' },
  { to: '/staff/contact', labelKey: 'navigation.contact', icon: 'contact' }
];

const STAFF_PRIMARY_ITEMS = [
  { to: '/staff/dashboard', labelKey: 'navigation.dashboard', icon: 'home' }
];

const STAFF_ACCOUNT_ITEMS = [
  { to: '/staff/activity-logs', labelKey: 'navigation.activityLogs', icon: 'activity' },
  { to: '/staff/profile', labelKey: 'navigation.profile', icon: 'user' },
  { to: '/staff/settings', labelKey: 'settings.title', icon: 'settings' }
];

export default function StaffLayout() {
  const { t } = useTranslation();

  return (
    <div className="app-shell staff-shell">
      <aside className="sidebar">
        <SidebarBrand />
        <SidebarUserCard />
        <nav aria-label={t('navigation.staff')}>
          {STAFF_PRIMARY_ITEMS.map((item) => (
            <SidebarNavLink item={item} key={item.to} />
          ))}
          <SidebarNavGroup icon="activity" labelKey="navigation.operations" items={STAFF_OPERATION_ITEMS} />
          <SidebarNavGroup icon="feedback" labelKey="navigation.informationAndFeedback" items={STAFF_INFORMATION_ITEMS} />
          {STAFF_ACCOUNT_ITEMS.map((item) => (
            <SidebarNavLink item={item} key={item.to} />
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
