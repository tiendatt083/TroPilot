export default function StatusBadge({ children, label, className = '', title }) {
  const classes = [...new Set(['status-pill', ...className.split(' ').filter(Boolean)])].join(' ');

  return (
    <span className={classes} title={title}>
      {children || label}
    </span>
  );
}
