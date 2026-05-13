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
