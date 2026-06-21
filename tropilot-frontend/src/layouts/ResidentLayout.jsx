import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as residentApi from '../api/residentApi.js';
import ChatWidget from '../components/ChatWidget.jsx';
import SidebarBrand from '../components/SidebarBrand.jsx';
import SidebarNavGroup from '../components/SidebarNavGroup.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const RESIDENT_PRIMARY_ITEMS = [
  { to: '/resident/dashboard', labelKey: 'navigation.dashboard', requiresRoom: true }
];

const RESIDENT_INFORMATION_ITEMS = [
  { to: '/resident/notifications', labelKey: 'navigation.notifications', requiresRoom: true },
  { to: '/resident/feedbacks', labelKey: 'navigation.feedbacks', requiresRoom: true },
  { to: '/resident/contact', labelKey: 'navigation.contact' }
];

const RESIDENT_ROOM_ITEMS = [
  { to: '/resident/invoices', labelKey: 'navigation.invoices', requiresRoom: true },
  { to: '/resident/members', labelKey: 'navigation.members', requiresRoom: true },
  { to: '/resident/contract', labelKey: 'navigation.contract', requiresRoom: true },
  { to: '/resident/vehicles', labelKey: 'navigation.vehicles', requiresRoom: true },
  { to: '/resident/utility-readings', labelKey: 'navigation.utilityReadings', requiresRoom: true }
];

const RESIDENT_OPERATION_ITEMS = [
  { to: '/resident/equipment', labelKey: 'navigation.equipment', requiresRoom: true }
];

const RESIDENT_ACCOUNT_ITEMS = [
  { to: '/resident/profile', labelKey: 'navigation.profile' },
  { to: '/resident/settings', labelKey: 'settings.title' }
];

export default function ResidentLayout() {
  const { logout } = useAuth();
  const { t } = useTranslation();
  const [assignment, setAssignment] = useState(null);
  const [assignmentLoading, setAssignmentLoading] = useState(true);
  const [assignmentLoadFailed, setAssignmentLoadFailed] = useState(false);

  useEffect(() => {
    let active = true;

    residentApi
      .getAssignedRoom()
      .then((assignedRoom) => {
        if (active) {
          setAssignment(assignedRoom);
          setAssignmentLoadFailed(false);
        }
      })
      .catch(() => {
        if (active) {
          setAssignment(null);
          setAssignmentLoadFailed(true);
        }
      })
      .finally(() => {
        if (active) {
          setAssignmentLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const hasActiveRoom = Boolean(assignment?.assigned);
  const filterVisibleItems = (items) => items.filter(
    (item) => !item.requiresRoom || hasActiveRoom
  );
  const residentAccess = {
    assignment,
    assignmentLoading,
    assignmentLoadFailed,
    hasActiveRoom
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <SidebarBrand />
        <div className="sidebar-user">
          <span>TroPilot</span>
          <small>{t('sidebar.access.residentHead')}</small>
        </div>
        <nav aria-label={t('navigation.resident')}>
          {filterVisibleItems(RESIDENT_PRIMARY_ITEMS).map((item) => (
            <NavLink key={item.to} to={item.to}>
              {t(item.labelKey)}
            </NavLink>
          ))}
          <SidebarNavGroup
            labelKey="navigation.informationAndFeedback"
            items={filterVisibleItems(RESIDENT_INFORMATION_ITEMS)}
          />
          {filterVisibleItems(RESIDENT_ROOM_ITEMS).map((item) => (
            <NavLink key={item.to} to={item.to}>
              {t(item.labelKey)}
            </NavLink>
          ))}
          <SidebarNavGroup
            labelKey="navigation.operations"
            items={filterVisibleItems(RESIDENT_OPERATION_ITEMS)}
          />
          {filterVisibleItems(RESIDENT_ACCOUNT_ITEMS).map((item) => (
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
        {assignmentLoadFailed && (
          <div className="alert error-alert">{t('residentAccess.loadError')}</div>
        )}
        <Outlet context={residentAccess} />
      </main>
      {hasActiveRoom && <ChatWidget />}
    </div>
  );
}
