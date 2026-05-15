import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ResidentLayout() {
  const { logout, user } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <strong>Tropilot</strong>
        <div className="sidebar-user">
          <span>{user?.fullName}</span>
          <small>Head resident</small>
        </div>
        <nav aria-label="Resident navigation">
          <NavLink to="/resident/dashboard">Dashboard</NavLink>
          <NavLink to="/resident/notifications">Notifications</NavLink>
          <NavLink to="/resident/feedbacks">Feedbacks</NavLink>
          <NavLink to="/resident/invoices">Invoices</NavLink>
          <NavLink to="/resident/members">Members</NavLink>
          <NavLink to="/resident/maintenance">Maintenance</NavLink>
          <NavLink to="/resident/contract">Contract</NavLink>
          <NavLink to="/resident/vehicles">Vehicles</NavLink>
          <NavLink to="/resident/utility-readings">Utility readings</NavLink>
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
