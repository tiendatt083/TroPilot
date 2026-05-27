import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.jsx';

export default function AdminLayout() {
  const { logout, user } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <strong>Tropilot</strong>
        <div className="sidebar-user">
          <span>{user?.fullName}</span>
          <small>Administrator</small>
        </div>
        <nav aria-label="Admin navigation">
          <NavLink to="/admin/dashboard">Dashboard</NavLink>
          <NavLink to="/admin/notifications">Notifications</NavLink>
          <NavLink to="/admin/activity-logs">Activity logs</NavLink>
          <NavLink to="/admin/feedbacks">Feedbacks</NavLink>
          <NavLink to="/admin/invoice-complaints">Invoice complaints</NavLink>
          <NavLink to="/admin/users">Users</NavLink>
          <NavLink to="/admin/members/pending">Pending members</NavLink>
          <NavLink to="/admin/contracts">Contracts</NavLink>
          <NavLink to="/admin/tasks">Tasks</NavLink>
          <NavLink to="/admin/maintenance">Maintenance</NavLink>
          <NavLink to="/admin/buildings">Buildings</NavLink>
          <NavLink to="/admin/rooms">Rooms</NavLink>
          <NavLink to="/admin/settings">{t('settings')}</NavLink>
        </nav>
        <button className="secondary-button" type="button" onClick={logout}>
          Sign out
        </button>
      </aside>
      <main className="main-panel">
        <Outlet />
      </main>
    </div>
  );
}
