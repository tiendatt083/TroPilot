import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.jsx';

const RESIDENT_NAV_ITEMS = [
  { to: '/resident/dashboard', labelKey: 'navigation.dashboard' },
  { to: '/resident/notifications', labelKey: 'navigation.notifications' },
  { to: '/resident/feedbacks', labelKey: 'navigation.feedbacks' },
  { to: '/resident/invoices', labelKey: 'navigation.invoices' },
  { to: '/resident/members', labelKey: 'navigation.members' },
  { to: '/resident/maintenance', labelKey: 'navigation.maintenance' },
  { to: '/resident/contract', labelKey: 'navigation.contract' },
  { to: '/resident/vehicles', labelKey: 'navigation.vehicles' },
  { to: '/resident/utility-readings', labelKey: 'navigation.utilityReadings' },
  { to: '/resident/settings', labelKey: 'settings.title' }
];

export default function ResidentLayout() {
  const { logout, user } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <strong>Tropilot</strong>
        <div className="sidebar-user">
          <span>{user?.fullName}</span>
          <small>{t('role.residentHead')}</small>
        </div>
        <nav aria-label={t('navigation.resident')}>
          {RESIDENT_NAV_ITEMS.map((item) => (
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
