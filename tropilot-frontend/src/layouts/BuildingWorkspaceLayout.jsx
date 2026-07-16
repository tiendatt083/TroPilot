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
  const [openGroupId, setOpenGroupId] = useState(null);
  const buildingPath = `${basePath}/${id}`;
  const isStaffWorkspace = basePath.startsWith('/staff');
  const shellClasses = [
    'content-section',
    'building-workspace-shell',
    isStaffWorkspace ? 'staff-building-workspace-shell' : 'admin-building-workspace-shell'
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

    const activeGroup = navigationGroups.find((group) => group.id === activeGroupId);
    setOpenGroupId(activeGroup?.standalone ? null : activeGroupId);
  }, [activeGroupId, navigationGroups]);

  const toggleGroup = (groupId) => {
    setOpenGroupId((current) => (current === groupId ? null : groupId));
  };
  const openGroup = navigationGroups.find(
    (group) => !group.standalone && group.id === openGroupId
  );

  if (loading) {
    return <div className="empty-state">{t('buildingWorkspace.loading')}</div>;
  }

  if (!building) {
    return <div className="empty-state">{error || t('buildingWorkspace.notFound')}</div>;
  }

  const staffHeroMeta = `${building.address || t('common.notProvided', { defaultValue: 'Chưa cung cấp' })} - ${building.floors || 0} tầng`;

  return (
    <section className={shellClasses}>
      <div className="building-workspace-sticky-header">
        <div className="page-title-row">
          <PageHeader
            eyebrow={t(eyebrowKey)}
            title={`${building.buildingCode} - ${building.name}`}
          />
          <div className="button-row">
            {isStaffWorkspace && <span className="building-workspace-hero-plain-meta">{staffHeroMeta}</span>}
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

        <nav className="workspace-tabs building-workspace-tabs grouped-workspace-tabs" aria-label={t('navigation.buildingWorkspace')}>
          <div className="workspace-tab-main-row">
            {navigationGroups.map((group) => {
              const groupIsActive = group.id === activeGroupId;
              const groupIsOpen = group.id === openGroupId;

              if (group.standalone) {
                return group.items.map((tab) => (
                  <NavLink key={tab.path || 'overview'} end={tab.end} to={`${buildingPath}${tab.path}`}>
                    {t(tab.labelKey)}
                  </NavLink>
                ));
              }

              return (
                <button
                  className={`workspace-tab-group-toggle${groupIsActive ? ' active-group' : ''}`}
                  key={group.id}
                  type="button"
                  aria-expanded={groupIsOpen}
                  aria-controls="building-workspace-submenu"
                  onClick={() => toggleGroup(group.id)}
                >
                  <span>{t(group.labelKey)}</span>
                  <span className={`workspace-tab-group-chevron${groupIsOpen ? ' is-open' : ''}`} aria-hidden="true">
                    ›
                  </span>
                </button>
              );
            })}
          </div>

          {openGroup && (
            <div className="workspace-tab-submenu" id="building-workspace-submenu">
              {openGroup.items.map((tab) => (
                <NavLink key={tab.path || 'overview'} end={tab.end} to={`${buildingPath}${tab.path}`}>
                  {t(tab.labelKey)}
                </NavLink>
              ))}
            </div>
          )}
        </nav>
      </div>

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      <div className="building-workspace-body">
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
