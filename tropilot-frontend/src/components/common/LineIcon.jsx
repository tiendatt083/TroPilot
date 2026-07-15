const ICONS = {
  activity: (
    <>
      <path d="M4 14h4l2-7 4 12 2-5h4" />
    </>
  ),
  barChart: (
    <>
      <path d="M4 20V4" />
      <path d="M4 20h16" />
      <path d="M8 17V9" />
      <path d="M13 17V5" />
      <path d="M18 17v-6" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </>
  ),
  building: (
    <>
      <path d="M4 21V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v16" />
      <path d="M8 7h2" />
      <path d="M8 11h2" />
      <path d="M14 7h2" />
      <path d="M14 11h2" />
      <path d="M9 21v-5h4v5" />
      <path d="M3 21h18" />
    </>
  ),
  checkShield: (
    <>
      <path d="M12 3 5 6v5c0 4.5 2.8 8.3 7 10 4.2-1.7 7-5.5 7-10V6l-7-3Z" />
      <path d="m9 12 2 2 4-5" />
    </>
  ),
  clock: (
    <>
      <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  close: (
    <>
      <path d="m6.5 6.5 11 11" />
      <path d="m17.5 6.5-11 11" />
    </>
  ),
  calendar: (
    <>
      <path d="M6 3v4" />
      <path d="M18 3v4" />
      <path d="M4 8h16" />
      <path d="M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z" />
    </>
  ),
  car: (
    <>
      <path d="M6 16h12" />
      <path d="M7 16l1-5a3 3 0 0 1 2.9-2h2.2A3 3 0 0 1 16 11l1 5" />
      <path d="M5 16v3" />
      <path d="M19 16v3" />
      <path d="M7 19h.1" />
      <path d="M17 19h.1" />
      <path d="M4 14h16" />
    </>
  ),
  chartPulse: (
    <>
      <path d="M4 14h3l2-6 4 11 3-9 2 4h2" />
    </>
  ),
  contact: (
    <>
      <path d="M4 6h16v12H4z" />
      <path d="m4 7 8 6 8-6" />
    </>
  ),
  dashboard: (
    <>
      <path d="M4 4h7v7H4z" />
      <path d="M13 4h7v5h-7z" />
      <path d="M13 11h7v9h-7z" />
      <path d="M4 13h7v7H4z" />
    </>
  ),
  droplet: (
    <>
      <path d="M12 3.5s6 6.1 6 10.4a6 6 0 0 1-12 0C6 9.6 12 3.5 12 3.5Z" />
    </>
  ),
  edit: (
    <>
      <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z" />
      <path d="m13.5 8.5 2 2" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z" />
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
    </>
  ),
  feedback: (
    <>
      <path d="M5 6h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-7l-5 4v-4H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" />
      <path d="M8 10h8" />
      <path d="M8 13h5" />
    </>
  ),
  fileText: (
    <>
      <path d="M7 3h7l5 5v13H7z" />
      <path d="M14 3v6h5" />
      <path d="M10 13h6" />
      <path d="M10 17h4" />
    </>
  ),
  globe: (
    <>
      <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
      <path d="M3.6 9h16.8" />
      <path d="M3.6 15h16.8" />
      <path d="M12 3a14 14 0 0 1 0 18" />
      <path d="M12 3a14 14 0 0 0 0 18" />
    </>
  ),
  home: (
    <>
      <path d="m3 10 9-7 9 7" />
      <path d="M5 10v10h14V10" />
      <path d="M9 20v-6h6v6" />
    </>
  ),
  lock: (
    <>
      <path d="M6 11h12v10H6z" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      <path d="M12 15v2" />
    </>
  ),
  logOut: (
    <>
      <path d="M10 6V5a2 2 0 0 1 2-2h7v18h-7a2 2 0 0 1-2-2v-1" />
      <path d="M3 12h11" />
      <path d="m7 8-4 4 4 4" />
    </>
  ),
  mail: (
    <>
      <path d="M4 6h16v12H4z" />
      <path d="m4 7 8 6 8-6" />
    </>
  ),
  mapPin: (
    <>
      <path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z" />
      <path d="M12 10.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
    </>
  ),
  menu: (
    <>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </>
  ),
  monitor: (
    <>
      <path d="M4 5h16v11H4z" />
      <path d="M9 21h6" />
      <path d="M12 16v5" />
    </>
  ),
  moon: (
    <>
      <path d="M20 14.5A8 8 0 0 1 9.5 4 7 7 0 1 0 20 14.5Z" />
    </>
  ),
  palette: (
    <>
      <path d="M12 21a9 9 0 1 1 0-18 7 7 0 0 1 7 7c0 1.7-1.3 3-3 3h-1.4a1.6 1.6 0 0 0-1.1 2.7l.4.4A2.9 2.9 0 0 1 12 21Z" />
      <path d="M7.5 10.5h.1" />
      <path d="M9.5 7.5h.1" />
      <path d="M13.5 7.5h.1" />
      <path d="M16 10.5h.1" />
    </>
  ),
  phone: (
    <>
      <path d="M7 5 5 7c-.4.4-.5 1-.3 1.5 1.7 4.8 5.5 8.6 10.3 10.3.5.2 1.1.1 1.5-.3l2-2c.5-.5.6-1.2.2-1.8l-1.4-2.1c-.3-.5-1-.7-1.6-.5l-2.1.7a11 11 0 0 1-4.4-4.4l.7-2.1c.2-.6 0-1.2-.5-1.6L8.8 4.8C8.2 4.4 7.5 4.5 7 5Z" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 7v5h-5" />
      <path d="M4 17v-5h5" />
      <path d="M6.1 8.5A7 7 0 0 1 18.6 7L20 9" />
      <path d="M17.9 15.5A7 7 0 0 1 5.4 17L4 15" />
    </>
  ),
  save: (
    <>
      <path d="M5 3h11l3 3v15H5z" />
      <path d="M8 3v6h8" />
      <path d="M8 21v-7h8v7" />
    </>
  ),
  search: (
    <>
      <path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z" />
      <path d="m20 20-4-4" />
    </>
  ),
  tool: (
    <>
      <path d="M14.7 6.3a4 4 0 0 0-5.1 5.1l-5.3 5.3a2 2 0 1 0 3 3l5.3-5.3a4 4 0 0 0 5.1-5.1l-2.8 2.8-3-3 2.8-2.8Z" />
    </>
  ),
  settings: (
    <>
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
      <path d="M19 13.5a7.5 7.5 0 0 0 .1-3l2-1.5-2-3.5-2.4 1a8 8 0 0 0-2.6-1.5L13.8 2h-4l-.4 3a8 8 0 0 0-2.6 1.5l-2.4-1-2 3.5 2 1.5a7.5 7.5 0 0 0 .1 3l-2 1.5 2 3.5 2.4-1a8 8 0 0 0 2.6 1.5l.4 3h4l.4-3a8 8 0 0 0 2.6-1.5l2.4 1 2-3.5-2.3-1.5Z" />
    </>
  ),
  sun: (
    <>
      <path d="M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.9 4.9 1.4 1.4" />
      <path d="m17.7 17.7 1.4 1.4" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m4.9 19.1 1.4-1.4" />
      <path d="m17.7 6.3 1.4-1.4" />
    </>
  ),
  wallet: (
    <>
      <path d="M4 7h15a2 2 0 0 1 2 2v10H4a2 2 0 0 1-2-2V5a2 2 0 0 0 2 2Z" />
      <path d="M16 13h5" />
      <path d="M16 13a1 1 0 1 0 0 2" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M6 7l1 14h10l1-14" />
      <path d="M9 7V4h6v3" />
    </>
  ),
  user: (
    <>
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  userCheck: (
    <>
      <path d="M10 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
      <path d="M3 21a7 7 0 0 1 11.5-5.3" />
      <path d="m16 18 2 2 4-5" />
    </>
  ),
  userPlus: (
    <>
      <path d="M10 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
      <path d="M3 21a7 7 0 0 1 14 0" />
      <path d="M19 8v6" />
      <path d="M16 11h6" />
    </>
  ),
  users: (
    <>
      <path d="M16 11a4 4 0 1 0-8 0" />
      <path d="M5 21a7 7 0 0 1 14 0" />
      <path d="M18 6a3 3 0 0 1 0 6" />
      <path d="M22 21a5.5 5.5 0 0 0-4-5.3" />
      <path d="M6 6a3 3 0 0 0 0 6" />
      <path d="M2 21a5.5 5.5 0 0 1 4-5.3" />
    </>
  )
};

export default function LineIcon({ name, className = '' }) {
  const icon = ICONS[name];

  if (!icon) {
    return null;
  }

  return (
    <svg
      aria-hidden="true"
      className={['line-icon', className].filter(Boolean).join(' ')}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      {icon}
    </svg>
  );
}
