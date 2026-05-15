import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function AdminLayout() {
  const { logout, user } = useAuth();

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
          <NavLink to="/admin/users">Users</NavLink>
          <NavLink to="/admin/members/pending">Pending members</NavLink>
          <NavLink to="/admin/contracts">Contracts</NavLink>
          <NavLink to="/admin/invoices">Invoices</NavLink>
          <NavLink to="/admin/receipts">Receipts</NavLink>
          <NavLink to="/admin/expenses">Expenses</NavLink>
          <NavLink to="/admin/cashflow">Cash flow</NavLink>
          <NavLink to="/admin/tasks">Tasks</NavLink>
          <NavLink to="/admin/vehicles">Vehicles</NavLink>
          <NavLink to="/admin/service-fees">Service fees</NavLink>
          <NavLink to="/admin/utility-readings">Utility readings</NavLink>
          <NavLink to="/admin/buildings">Buildings</NavLink>
          <NavLink to="/admin/rooms">Rooms</NavLink>
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
