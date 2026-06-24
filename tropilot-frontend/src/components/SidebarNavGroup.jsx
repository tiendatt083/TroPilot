import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LineIcon from './common/LineIcon.jsx';

function matchesPath(pathname, targetPath) {
  return pathname === targetPath || pathname.startsWith(`${targetPath}/`);
}

export default function SidebarNavGroup({ icon, labelKey, items }) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const visibleItems = items.filter(Boolean);
  const groupActive = visibleItems.some((item) => matchesPath(pathname, item.to));
  const [open, setOpen] = useState(groupActive);

  useEffect(() => {
    if (groupActive) {
      setOpen(true);
    }
  }, [groupActive]);

  if (!visibleItems.length) {
    return null;
  }

  return (
    <div className={`sidebar-nav-group${groupActive ? ' is-active' : ''}`}>
      <button
        className={`sidebar-nav-group-toggle${icon ? ' has-sidebar-icon' : ''}`}
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="sidebar-nav-main">
          {icon && <LineIcon className="sidebar-link-icon" name={icon} />}
          <span className="sidebar-nav-label">{t(labelKey)}</span>
        </span>
        <span className={`sidebar-nav-group-chevron${open ? ' is-open' : ''}`} aria-hidden="true">
          ›
        </span>
      </button>
      {open && (
        <div className="sidebar-nav-group-links">
          {visibleItems.map((item) => (
            <NavLink
              className={item.icon ? 'has-sidebar-icon' : undefined}
              key={item.to}
              to={item.to}
            >
              {item.icon && <LineIcon className="sidebar-link-icon" name={item.icon} />}
              <span className="sidebar-nav-label">{t(item.labelKey)}</span>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}
