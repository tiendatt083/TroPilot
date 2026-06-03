import { useEffect, useState } from 'react';
import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SidebarBrand from '../components/SidebarBrand.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import * as dashboardApi from '../api/dashboardApi.js';

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
  { to: '/resident/profile', labelKey: 'navigation.profile' },
  { to: '/resident/settings', labelKey: 'settings.title' }
];

const PROFILE_ONLY_NAV_ITEMS = [
  { to: '/resident/profile', labelKey: 'navigation.profile' }
];

export default function ResidentLayout() {
  const { logout, user } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const [assignmentCheck, setAssignmentCheck] = useState({
    loading: true,
    isAssigned: false,
    failed: false
  });

  useEffect(() => {
    let isMounted = true;

    dashboardApi
      .getResidentDashboard()
      .then((response) => {
        if (!isMounted) {
          return;
        }

        setAssignmentCheck({
          loading: false,
          isAssigned: Boolean(response.data?.currentRoom?.assigned),
          failed: false
        });
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setAssignmentCheck({
          loading: false,
          isAssigned: false,
          failed: true
        });
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const navItems = assignmentCheck.isAssigned ? RESIDENT_NAV_ITEMS : PROFILE_ONLY_NAV_ITEMS;
  const isProfilePage = location.pathname === '/resident/profile';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <SidebarBrand />
        <div className="sidebar-user">
          <span>{user?.fullName}</span>
          <small>{t('role.residentHead')}</small>
        </div>
        <nav aria-label={t('navigation.resident')}>
          {navItems.map((item) => (
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
        {assignmentCheck.loading && (
          <div className="route-state">{t('residentAccess.checking')}</div>
        )}
        {!assignmentCheck.loading && assignmentCheck.failed && (
          <div className="empty-state">{t('residentAccess.checkFailed')}</div>
        )}
        {!assignmentCheck.loading && !assignmentCheck.failed && !assignmentCheck.isAssigned && !isProfilePage && (
          <Navigate to="/resident/profile" replace />
        )}
        {!assignmentCheck.loading && !assignmentCheck.failed && (assignmentCheck.isAssigned || isProfilePage) && (
          <Outlet />
        )}
      </main>
    </div>
  );
}
