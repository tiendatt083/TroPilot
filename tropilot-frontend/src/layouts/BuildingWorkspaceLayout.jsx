import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageHeader from '../components/PageHeader.jsx';

export default function BuildingWorkspaceLayout({
  getBuilding,
  deleteBuilding,
  listPath,
  basePath,
  tabs,
  eyebrowKey = 'buildingWorkspace.eyebrow',
  actions = {}
}) {
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

    getBuilding(id)
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
  }, [getBuilding, id, t]);

  const handleDelete = async () => {
    if (!deleteBuilding || !building) {
      return;
    }

    const confirmed = window.confirm(t('buildingWorkspace.deleteConfirm', { code: building.buildingCode }));
    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setMessage('');
    setError('');

    try {
      await deleteBuilding(building.id);
      navigate(listPath, { replace: true });
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

  const buildingPath = `${basePath}/${building.id}`;

  return (
    <section className="content-section building-workspace-shell">
      <div className="page-title-row">
        <PageHeader eyebrow={t(eyebrowKey)} title={`${building.buildingCode} - ${building.name}`} />
        <div className="button-row">
          <Link className="secondary-link" to={listPath}>
            {t('buildingWorkspace.allBuildings')}
          </Link>
          {actions.showRoomsLink && (
            <Link className="secondary-link" to={`${buildingPath}/rooms`}>
              {t('buildingWorkspace.roomsInBuilding')}
            </Link>
          )}
          {actions.canCreateRoom && (
            <Link className="button-link" to={`/admin/rooms/create?buildingId=${building.id}`}>
              {t('buildingWorkspace.createRoom')}
            </Link>
          )}
          {actions.canEditBuilding && (
            <Link className="secondary-link" to={`${buildingPath}/edit`}>
              {t('common.edit')}
            </Link>
          )}
          {actions.canDeleteBuilding && (
            <button className="secondary-button inline-button" type="button" disabled={deleting} onClick={handleDelete}>
              {t('common.delete')}
            </button>
          )}
        </div>
      </div>

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      <div className="building-workspace-body">
        <nav className="workspace-tabs building-workspace-tabs" aria-label={t('navigation.buildingWorkspace')}>
          {tabs.map((tab) => (
            <NavLink key={tab.path || 'overview'} end={tab.end} to={`${buildingPath}${tab.path}`}>
              {t(tab.labelKey)}
            </NavLink>
          ))}
        </nav>

        <div className="building-workspace-content">
          <Outlet context={{ building }} />
        </div>
      </div>
    </section>
  );
}
