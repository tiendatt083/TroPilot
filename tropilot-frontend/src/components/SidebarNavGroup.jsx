import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function matchesPath(pathname, targetPath) {
  return pathname === targetPath || pathname.startsWith(`${targetPath}/`);
}

export default function SidebarNavGroup({ labelKey, items }) {
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
        className="sidebar-nav-group-toggle"
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{t(labelKey)}</span>
        <span className="sidebar-nav-group-chevron" aria-hidden="true">
          {open ? '-' : '+'}
        </span>
      </button>
      {open && (
        <div className="sidebar-nav-group-links">
          {visibleItems.map((item) => (
            <NavLink key={item.to} to={item.to}>
              {t(item.labelKey)}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}
