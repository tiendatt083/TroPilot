import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageHeader from '../components/PageHeader.jsx';

export default function BuildingWorkspaceLayout({
  getBuilding,
  deleteBuilding,
  listPath,
  basePath,
  tabs = [],
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
  const [openGroups, setOpenGroups] = useState({});
  const buildingPath = `${basePath}/${id}`;
  const shellClasses = [
    'content-section',
    'building-workspace-shell',
    basePath.startsWith('/admin') ? 'admin-building-workspace-shell' : 'staff-building-workspace-shell'
  ].join(' ');
  const navigationGroups = useMemo(() => normalizeNavigationGroups(tabs), [tabs]);
  const activeGroupId = useMemo(
    () => findActiveGroupId(navigationGroups, buildingPath, location.pathname),
    [buildingPath, location.pathname, navigationGroups]
  );

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

  useEffect(() => {
    if (!activeGroupId) {
      return;
    }

    setOpenGroups((current) => ({
      ...current,
      [activeGroupId]: true
    }));
  }, [activeGroupId]);

  const toggleGroup = (groupId) => {
    setOpenGroups((current) => ({
      ...current,
      [groupId]: !current[groupId]
    }));
  };

  if (loading) {
    return <div className="empty-state">{t('buildingWorkspace.loading')}</div>;
  }

  if (!building) {
    return <div className="empty-state">{error || t('buildingWorkspace.notFound')}</div>;
  }

  return (
    <section className={shellClasses}>
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
        <nav className="workspace-tabs building-workspace-tabs grouped-workspace-tabs" aria-label={t('navigation.buildingWorkspace')}>
          {navigationGroups.map((group) => {
            const groupIsActive = group.id === activeGroupId;
            const groupIsOpen = group.standalone || openGroups[group.id] || groupIsActive;

            if (group.standalone) {
              return group.items.map((tab) => (
                <NavLink key={tab.path || 'overview'} end={tab.end} to={`${buildingPath}${tab.path}`}>
                  {t(tab.labelKey)}
                </NavLink>
              ));
            }

            return (
              <div className="workspace-tab-group" key={group.id}>
                <button
                  className={`workspace-tab-group-toggle${groupIsActive ? ' active-group' : ''}`}
                  type="button"
                  aria-expanded={groupIsOpen}
                  onClick={() => toggleGroup(group.id)}
                >
                  <span>{t(group.labelKey)}</span>
                  <span className={`workspace-tab-group-chevron${groupIsOpen ? ' is-open' : ''}`} aria-hidden="true">
                    ›
                  </span>
                </button>
                {groupIsOpen && (
                  <div className="workspace-tab-group-items">
                    {group.items.map((tab) => (
                      <NavLink key={tab.path || 'overview'} end={tab.end} to={`${buildingPath}${tab.path}`}>
                        {t(tab.labelKey)}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="building-workspace-content">
          <Outlet context={{ building }} />
        </div>
      </div>
    </section>
  );
}

function normalizeNavigationGroups(tabs) {
  if (!tabs.length) {
    return [];
  }

  if (tabs[0].items) {
    return tabs;
  }

  return [
    {
      id: 'workspace',
      standalone: true,
      items: tabs
    }
  ];
}

function findActiveGroupId(groups, buildingPath, pathname) {
  return groups.find((group) =>
    group.items.some((tab) => isTabActive(buildingPath, tab, pathname))
  )?.id;
}

function isTabActive(buildingPath, tab, pathname) {
  const targetPath = `${buildingPath}${tab.path}`;

  if (tab.end) {
    return pathname === targetPath;
  }

  return pathname === targetPath || pathname.startsWith(`${targetPath}/`);
}
