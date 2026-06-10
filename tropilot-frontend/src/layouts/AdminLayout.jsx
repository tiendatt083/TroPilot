import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SidebarBrand from '../components/SidebarBrand.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const ADMIN_ACCOUNT_ITEMS = [
  { to: '/admin/users', labelKey: 'navigation.users' },
  { to: '/admin/residents', labelKey: 'navigation.residents' },
  { to: '/admin/members/pending', labelKey: 'navigation.pendingMembers' }
];

const ADMIN_NAV_ITEMS = [
  { to: '/admin/notifications', labelKey: 'navigation.notifications' },
  { to: '/admin/activity-logs', labelKey: 'navigation.activityLogs' },
  { to: '/admin/feedbacks', labelKey: 'navigation.feedbacks' },
  { to: '/admin/invoice-complaints', labelKey: 'navigation.invoiceComplaints' },
  { to: '/admin/contracts', labelKey: 'navigation.contracts' },
  { to: '/admin/tasks', labelKey: 'navigation.tasks' },
  { to: '/admin/maintenance', labelKey: 'navigation.maintenance' },
  { to: '/admin/buildings', labelKey: 'navigation.buildings' },
  { to: '/admin/profile', labelKey: 'navigation.profile' },
  { to: '/admin/settings', labelKey: 'settings.title' }
];

export default function AdminLayout() {
  const { logout, user } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const accountSectionActive = ADMIN_ACCOUNT_ITEMS.some((item) => location.pathname.startsWith(item.to));
  const [accountSectionOpen, setAccountSectionOpen] = useState(accountSectionActive);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem('adminSidebarCollapsed') === 'true'
  );

  useEffect(() => {
    if (accountSectionActive) {
      setAccountSectionOpen(true);
    }
  }, [accountSectionActive]);

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
        <div className="sidebar-user">
          <span>{user?.fullName}</span>
          <small>{t('role.admin')}</small>
        </div>
        <nav aria-label={t('navigation.admin')}>
          <NavLink to="/admin/dashboard">
            {t('navigation.dashboard')}
          </NavLink>
          <div className={`sidebar-nav-group${accountSectionActive ? ' is-active' : ''}`}>
            <button
              className="sidebar-nav-group-toggle"
              type="button"
              aria-expanded={accountSectionOpen}
              onClick={() => setAccountSectionOpen((current) => !current)}
            >
              <span>{t('navigation.accounts')}</span>
              <span className="sidebar-nav-group-chevron" aria-hidden="true">
                {accountSectionOpen ? '−' : '+'}
              </span>
            </button>
            {accountSectionOpen && (
              <div className="sidebar-nav-group-links">
                {ADMIN_ACCOUNT_ITEMS.map((item) => (
                  <NavLink key={item.to} to={item.to}>
                    {t(item.labelKey)}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
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
