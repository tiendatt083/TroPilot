import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SidebarBrand from '../components/SidebarBrand.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const ADMIN_ACCOUNT_ITEMS = [
  { to: '/admin/users', labelKey: 'navigation.users' },
  { to: '/admin/residents', labelKey: 'navigation.residents' }
];

const ADMIN_NAV_ITEMS = [
  { to: '/admin/notifications', labelKey: 'navigation.notifications' },
  { to: '/admin/activity-logs', labelKey: 'navigation.activityLogs' },
  { to: '/admin/feedbacks', labelKey: 'navigation.feedbacks' },
  { to: '/admin/invoice-complaints', labelKey: 'navigation.invoiceComplaints' },
  { to: '/admin/members/pending', labelKey: 'navigation.pendingMembers' },
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

  useEffect(() => {
    if (accountSectionActive) {
      setAccountSectionOpen(true);
    }
  }, [accountSectionActive]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <SidebarBrand />
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
