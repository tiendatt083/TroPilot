export default function EmptyState({ children, message, flat = false, className = '' }) {
  const classes = [
    'empty-state',
    flat ? 'flat-empty-state' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <div className={classes}>{children || message}</div>;
}
