import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as buildingApi from '../api/buildingApi.js';
import PageHeader from '../components/PageHeader.jsx';

export default function AdminBuildingWorkspaceLayout() {
  const { t } = useTranslation();
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
          setError(apiError.response?.data?.message || t('buildingWorkspace.loadError'));
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
  }, [id, t]);

  const handleDelete = async () => {
    const confirmed = window.confirm(t('buildingWorkspace.deleteConfirm', { code: building.buildingCode }));
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
      setError(apiError.response?.data?.message || t('buildingWorkspace.deleteError'));
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="empty-state">{t('buildingWorkspace.loading')}</div>;
  }

  if (!building) {
    return <div className="empty-state">{error || t('buildingWorkspace.notFound')}</div>;
  }

  return (
    <section className="content-section building-workspace-shell">
      <div className="page-title-row">
        <PageHeader eyebrow={t('buildingWorkspace.eyebrow')} title={`${building.buildingCode} - ${building.name}`} />
        <div className="button-row">
          <Link className="secondary-link" to="/admin/buildings">
            {t('buildingWorkspace.allBuildings')}
          </Link>
          <Link className="secondary-link" to={`/admin/buildings/${building.id}/rooms`}>
            {t('buildingWorkspace.roomsInBuilding')}
          </Link>
          <Link className="button-link" to={`/admin/rooms/create?buildingId=${building.id}`}>
            {t('buildingWorkspace.createRoom')}
          </Link>
          <Link className="secondary-link" to={`/admin/buildings/${building.id}/edit`}>
            {t('common.edit')}
          </Link>
          <button className="secondary-button inline-button" type="button" disabled={deleting} onClick={handleDelete}>
            {t('common.delete')}
          </button>
        </div>
      </div>

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      <div className="building-workspace-body">
        <nav className="workspace-tabs building-workspace-tabs" aria-label={t('navigation.buildingWorkspace')}>
          <NavLink end to={`/admin/buildings/${building.id}`}>
            {t('buildingWorkspace.overview')}
          </NavLink>
          <NavLink to={`/admin/buildings/${building.id}/rooms`}>
            {t('buildingWorkspace.rooms')}
          </NavLink>
          <NavLink to={`/admin/buildings/${building.id}/contracts`}>
            {t('buildingWorkspace.contracts')}
          </NavLink>
          <NavLink to={`/admin/buildings/${building.id}/billing`}>
            {t('buildingWorkspace.billing')}
          </NavLink>
          <NavLink to={`/admin/buildings/${building.id}/vehicles`}>
            {t('buildingWorkspace.vehicles')}
          </NavLink>
          <NavLink to={`/admin/buildings/${building.id}/payments`}>
            {t('buildingWorkspace.payments')}
          </NavLink>
          <NavLink to={`/admin/buildings/${building.id}/receipts`}>
            {t('buildingWorkspace.receipts')}
          </NavLink>
          <NavLink to={`/admin/buildings/${building.id}/members`}>
            {t('buildingWorkspace.roomMembers')}
          </NavLink>
          <NavLink to={`/admin/buildings/${building.id}/maintenance`}>
            {t('buildingWorkspace.maintenance')}
          </NavLink>
          <NavLink to={`/admin/buildings/${building.id}/expenses`}>
            {t('buildingWorkspace.expenses')}
          </NavLink>
          <NavLink to={`/admin/buildings/${building.id}/cashflow`}>
            {t('buildingWorkspace.cashFlow')}
          </NavLink>
          <NavLink to={`/admin/buildings/${building.id}/tasks`}>
            {t('buildingWorkspace.tasks')}
          </NavLink>
          <NavLink to={`/admin/buildings/${building.id}/feedbacks`}>
            {t('buildingWorkspace.feedbacks')}
          </NavLink>
          <NavLink to={`/admin/buildings/${building.id}/invoice-complaints`}>
            {t('buildingWorkspace.invoiceComplaints')}
          </NavLink>
          <NavLink to={`/admin/buildings/${building.id}/notifications`}>
            {t('buildingWorkspace.notifications')}
          </NavLink>
        </nav>

        <div className="building-workspace-content">
          <Outlet context={{ building }} />
        </div>
      </div>
    </section>
  );
}
