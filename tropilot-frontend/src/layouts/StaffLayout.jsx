import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function StaffLayout() {
  const { logout, user } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <strong>Tropilot</strong>
        <div className="sidebar-user">
          <span>{user?.fullName}</span>
          <small>Operations staff</small>
        </div>
        <nav aria-label="Staff navigation">
          <NavLink to="/staff/dashboard">Dashboard</NavLink>
          <NavLink to="/staff/invoices">Invoices</NavLink>
          <NavLink to="/staff/payments/pending">Pending payments</NavLink>
          <NavLink to="/staff/buildings">Buildings</NavLink>
          <NavLink to="/staff/rooms">Rooms</NavLink>
          <NavLink to="/staff/vehicles">Vehicles</NavLink>
          <NavLink to="/staff/service-fees">Service fees</NavLink>
          <NavLink to="/staff/utility-readings">Utility readings</NavLink>
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
