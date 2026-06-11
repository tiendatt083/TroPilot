import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ChatWidget from '../components/ChatWidget.jsx';
import SidebarBrand from '../components/SidebarBrand.jsx';
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
  { to: '/resident/equipment', labelKey: 'navigation.equipment' },
  { to: '/resident/utility-readings', labelKey: 'navigation.utilityReadings' },
  { to: '/resident/profile', labelKey: 'navigation.profile' },
  { to: '/resident/contact', labelKey: 'navigation.contact' },
  { to: '/resident/settings', labelKey: 'settings.title' }
];

export default function ResidentLayout() {
  const { logout } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <SidebarBrand />
        <div className="sidebar-user">
          <span>TroPilot</span>
          <small>{t('sidebar.access.residentHead')}</small>
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
      <ChatWidget />
    </div>
  );
}
