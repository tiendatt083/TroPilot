import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AdminProfileDialog from '../components/AdminProfileDialog.jsx';
import ChatWidget from '../components/ChatWidget.jsx';
import SidebarBrand from '../components/SidebarBrand.jsx';
import SidebarNavGroup from '../components/SidebarNavGroup.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const ADMIN_ACCOUNT_ITEMS = [
  { to: '/admin/users', labelKey: 'navigation.users' },
  { to: '/admin/residents', labelKey: 'navigation.residents' },
  { to: '/admin/members/pending', labelKey: 'navigation.pendingMembers' }
];

const ADMIN_OPERATION_ITEMS = [
  { to: '/admin/buildings', labelKey: 'navigation.buildings' },
  { to: '/admin/contracts', labelKey: 'navigation.contracts' },
  { to: '/admin/tasks', labelKey: 'navigation.tasks' },
  { to: '/admin/maintenance', labelKey: 'navigation.maintenance' }
];

const ADMIN_INFORMATION_ITEMS = [
  { to: '/admin/notifications', labelKey: 'navigation.notifications' },
  { to: '/admin/feedbacks', labelKey: 'navigation.feedbacks' },
  { to: '/admin/contact', labelKey: 'navigation.contact' }
];

const ADMIN_NAV_ITEMS = [
  { to: '/admin/activity-logs', labelKey: 'navigation.activityLogs' },
  { to: '/admin/settings', labelKey: 'settings.title' }
];

export default function AdminLayout() {
  const { logout } = useAuth();
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
          <NavLink to="/admin/dashboard">
            {t('navigation.dashboard')}
          </NavLink>
          <SidebarNavGroup labelKey="navigation.accounts" items={ADMIN_ACCOUNT_ITEMS} />
          <SidebarNavGroup labelKey="navigation.operations" items={ADMIN_OPERATION_ITEMS} />
          <SidebarNavGroup labelKey="navigation.informationAndFeedback" items={ADMIN_INFORMATION_ITEMS} />
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
      <ChatWidget />
      <AdminProfileDialog
        open={profileDialogOpen}
        onClose={() => setProfileDialogOpen(false)}
      />
    </div>
  );
}
