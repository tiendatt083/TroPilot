import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as residentApi from '../api/residentApi.js';
import ChatWidget from '../components/ChatWidget.jsx';
import SidebarBrand from '../components/SidebarBrand.jsx';
import SidebarNavLink from '../components/SidebarNavLink.jsx';

const RESIDENT_PRIMARY_ITEMS = [
  { to: '/resident/dashboard', labelKey: 'navigation.dashboard', icon: 'home', requiresRoom: true }
];

const RESIDENT_INFORMATION_ITEMS = [
  { to: '/resident/notifications', labelKey: 'navigation.notifications', icon: 'bell', requiresRoom: true },
  { to: '/resident/feedbacks', labelKey: 'navigation.feedbacks', icon: 'feedback', requiresRoom: true },
  { to: '/resident/contact', labelKey: 'navigation.contact', icon: 'contact' }
];

const RESIDENT_ROOM_ITEMS = [
  { to: '/resident/invoices', labelKey: 'navigation.invoices', icon: 'fileText', requiresRoom: true },
  { to: '/resident/members', labelKey: 'navigation.members', icon: 'users', requiresRoom: true },
  { to: '/resident/contract', labelKey: 'navigation.contract', icon: 'lock', requiresRoom: true },
  { to: '/resident/vehicles', labelKey: 'navigation.vehicles', icon: 'car', requiresRoom: true },
  { to: '/resident/building-costs', labelKey: 'navigation.buildingCosts', icon: 'wallet', requiresRoom: true },
  { to: '/resident/equipment', labelKey: 'navigation.equipment', icon: 'monitor', requiresRoom: true }
];

const RESIDENT_ACCOUNT_ITEMS = [
  { to: '/resident/activity-logs', labelKey: 'navigation.activityLogs', icon: 'activity' },
  { to: '/resident/profile', labelKey: 'navigation.profile', icon: 'user' },
  { to: '/resident/settings', labelKey: 'settings.title', icon: 'settings' }
];

export default function ResidentLayout() {
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
            <SidebarNavLink item={item} key={item.to} />
          ))}
          {filterVisibleItems(RESIDENT_INFORMATION_ITEMS).map((item) => (
            <SidebarNavLink item={item} key={item.to} />
          ))}
          {filterVisibleItems(RESIDENT_ROOM_ITEMS).map((item) => (
            <SidebarNavLink item={item} key={item.to} />
          ))}
          {filterVisibleItems(RESIDENT_ACCOUNT_ITEMS).map((item) => (
            <SidebarNavLink item={item} key={item.to} />
          ))}
        </nav>
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
