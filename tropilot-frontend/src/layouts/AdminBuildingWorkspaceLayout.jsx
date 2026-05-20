import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import * as buildingApi from '../api/buildingApi.js';
import PageHeader from '../components/PageHeader.jsx';

export default function AdminBuildingWorkspaceLayout() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [building, setBuilding] = useState(null);
  const [message, setMessage] = useState(location.state?.message || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError('');

    buildingApi
      .getAdminBuilding(id)
      .then((response) => {
        if (active) {
          setBuilding(response.data);
        }
      })
      .catch((apiError) => {
        if (active) {
          setError(apiError.response?.data?.message || 'Building workspace could not be loaded');
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [id]);

  const handleDelete = async () => {
    const confirmed = window.confirm(`Delete building ${building.buildingCode}?`);
    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setMessage('');
    setError('');

    try {
      await buildingApi.deleteAdminBuilding(building.id);
      navigate('/admin/buildings', { replace: true });
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Building could not be deleted');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="empty-state">Loading building workspace...</div>;
  }

  if (!building) {
    return <div className="empty-state">{error || 'Building not found.'}</div>;
  }

  return (
    <section className="content-section building-workspace-shell">
      <div className="page-title-row">
        <PageHeader eyebrow="Building workspace" title={`${building.buildingCode} - ${building.name}`} />
        <div className="button-row">
          <Link className="secondary-link" to="/admin/buildings">
            All buildings
          </Link>
          <Link className="secondary-link" to={`/admin/buildings/${building.id}/rooms`}>
            Rooms in this building
          </Link>
          <Link className="button-link" to={`/admin/rooms/create?buildingId=${building.id}`}>
            Create room
          </Link>
          <Link className="secondary-link" to={`/admin/buildings/${building.id}/edit`}>
            Edit
          </Link>
          <button className="secondary-button inline-button" type="button" disabled={deleting} onClick={handleDelete}>
            Delete
          </button>
        </div>
      </div>

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      <nav className="workspace-tabs" aria-label="Building workspace navigation">
        <NavLink end to={`/admin/buildings/${building.id}`}>
          Overview
        </NavLink>
        <NavLink to={`/admin/buildings/${building.id}/rooms`}>
          Rooms
        </NavLink>
        <NavLink to={`/admin/buildings/${building.id}/contracts`}>
          Contracts
        </NavLink>
        <NavLink to={`/admin/buildings/${building.id}/utility-readings`}>
          Utility readings
        </NavLink>
        <NavLink to={`/admin/buildings/${building.id}/invoices`}>
          Invoices
        </NavLink>
        <NavLink to={`/admin/buildings/${building.id}/vehicles`}>
          Vehicles
        </NavLink>
        <NavLink to={`/admin/buildings/${building.id}/payments`}>
          Payments
        </NavLink>
        <NavLink to={`/admin/buildings/${building.id}/receipts`}>
          Receipts
        </NavLink>
        <NavLink to={`/admin/buildings/${building.id}/members`}>
          Room members
        </NavLink>
        <NavLink to={`/admin/buildings/${building.id}/maintenance`}>
          Maintenance
        </NavLink>
        <NavLink to={`/admin/buildings/${building.id}/expenses`}>
          Expenses
        </NavLink>
        <NavLink to={`/admin/buildings/${building.id}/cashflow`}>
          Cash flow
        </NavLink>
        <NavLink to={`/admin/buildings/${building.id}/tasks`}>
          Tasks
        </NavLink>
        <NavLink to={`/admin/buildings/${building.id}/feedbacks`}>
          Feedbacks
        </NavLink>
        <NavLink to={`/admin/buildings/${building.id}/invoice-complaints`}>
          Invoice complaints
        </NavLink>
      </nav>

      <Outlet context={{ building }} />
    </section>
  );
}
