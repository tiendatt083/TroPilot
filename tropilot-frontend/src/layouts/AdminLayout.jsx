import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AdminProfileDialog from '../components/AdminProfileDialog.jsx';
import ChatWidget from '../components/ChatWidget.jsx';
import LineIcon from '../components/common/LineIcon.jsx';
import SidebarBrand from '../components/SidebarBrand.jsx';
import SidebarNavGroup from '../components/SidebarNavGroup.jsx';

const ADMIN_ACCOUNT_ITEMS = [
  { to: '/admin/users', labelKey: 'navigation.users', icon: 'users' },
  { to: '/admin/residents', labelKey: 'navigation.residents', icon: 'userCheck' },
  { to: '/admin/members/pending', labelKey: 'navigation.pendingMembers', icon: 'userPlus' }
];

const ADMIN_INFORMATION_ITEMS = [
  { to: '/admin/notifications', labelKey: 'navigation.notifications', icon: 'bell' },
  { to: '/admin/feedbacks', labelKey: 'navigation.feedbacks', icon: 'feedback' },
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
          <NavLink className="has-sidebar-icon" to="/admin/dashboard">
            <LineIcon className="sidebar-link-icon" name="home" />
            <span className="sidebar-nav-label">{t('navigation.dashboard')}</span>
          </NavLink>
          <SidebarNavGroup icon="user" labelKey="navigation.accounts" items={ADMIN_ACCOUNT_ITEMS} />
          <NavLink className="has-sidebar-icon" to="/admin/buildings">
            <LineIcon className="sidebar-link-icon" name="building" />
            <span className="sidebar-nav-label">{t('navigation.buildings')}</span>
          </NavLink>
          {ADMIN_INFORMATION_ITEMS.map((item) => (
            <NavLink className="has-sidebar-icon" key={item.to} to={item.to}>
              <LineIcon className="sidebar-link-icon" name={item.icon} />
              <span className="sidebar-nav-label">{t(item.labelKey)}</span>
            </NavLink>
          ))}
          {ADMIN_NAV_ITEMS.map((item) => (
            <NavLink className="has-sidebar-icon" key={item.to} to={item.to}>
              <LineIcon className="sidebar-link-icon" name={item.icon} />
              <span className="sidebar-nav-label">{t(item.labelKey)}</span>
            </NavLink>
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
