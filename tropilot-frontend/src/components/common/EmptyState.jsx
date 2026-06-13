export default function EmptyState({ children, message, flat = false, compact = false, className = '' }) {
  const classes = [
    'empty-state',
    flat ? 'flat-empty-state' : '',
    compact ? 'compact-empty-state' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <div className={classes}>{children || message}</div>;
}
