import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AdminProfileDialog from '../components/AdminProfileDialog.jsx';
import ChatWidget from '../components/ChatWidget.jsx';
import SidebarBrand from '../components/SidebarBrand.jsx';
import SidebarNavGroup from '../components/SidebarNavGroup.jsx';
import SidebarNavLink from '../components/SidebarNavLink.jsx';

const ADMIN_PRIMARY_ITEMS = [
  { to: '/admin/dashboard', labelKey: 'navigation.dashboard', icon: 'home' },
  { to: '/admin/buildings', labelKey: 'navigation.buildings', icon: 'building' }
];

const ADMIN_ACCOUNT_ITEMS = [
  { to: '/admin/users', labelKey: 'navigation.users', icon: 'users' },
  { to: '/admin/residents', labelKey: 'navigation.residents', icon: 'userCheck' },
  { to: '/admin/members/pending', labelKey: 'navigation.pendingMembers', icon: 'userPlus' }
];

const ADMIN_INFORMATION_ITEMS = [
  { to: '/admin/notifications', labelKey: 'navigation.notifications', icon: 'bell' },
  { to: '/admin/contact', labelKey: 'navigation.contact', icon: 'contact' }
];

const ADMIN_NAV_ITEMS = [
  { to: '/admin/activity-logs', labelKey: 'navigation.activityLogs', icon: 'activity' },
  { to: '/admin/settings', labelKey: 'settings.title', icon: 'settings' }
];

export default function AdminLayout() {
  const { t } = useTranslation();
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem('adminSidebarCollapsed') === 'true'
  );

  useEffect(() => {
    localStorage.setItem('adminSidebarCollapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  return (
    <div className={`app-shell${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
      <aside className="sidebar">
        <SidebarBrand />
        <button
          className="sidebar-toggle"
          type="button"
          aria-expanded={!sidebarCollapsed}
          aria-label={sidebarCollapsed ? t('navigation.expandSidebar') : t('navigation.collapseSidebar')}
          title={sidebarCollapsed ? t('navigation.expandSidebar') : t('navigation.collapseSidebar')}
          onClick={() => setSidebarCollapsed((current) => !current)}
        >
          <span aria-hidden="true">{sidebarCollapsed ? '›' : '‹'}</span>
        </button>
        <button
          aria-haspopup="dialog"
          className="sidebar-user sidebar-user-button"
          title={t('profile.actions.open')}
          type="button"
          onClick={() => setProfileDialogOpen(true)}
        >
          <span>TroPilot</span>
          <small>{t('sidebar.access.admin')}</small>
        </button>
        <nav aria-label={t('navigation.admin')}>
          <SidebarNavLink item={ADMIN_PRIMARY_ITEMS[0]} />
          <SidebarNavGroup icon="user" labelKey="navigation.accounts" items={ADMIN_ACCOUNT_ITEMS} />
          <SidebarNavLink item={ADMIN_PRIMARY_ITEMS[1]} />
          {ADMIN_INFORMATION_ITEMS.map((item) => (
            <SidebarNavLink item={item} key={item.to} />
          ))}
          {ADMIN_NAV_ITEMS.map((item) => (
            <SidebarNavLink item={item} key={item.to} />
          ))}
        </nav>
      </aside>
      <main className="main-panel">
        <Outlet />
      </main>
      <ChatWidget />
      <AdminProfileDialog
        open={profileDialogOpen}
        onClose={() => setProfileDialogOpen(false)}
      />
    </div>
  );
}
