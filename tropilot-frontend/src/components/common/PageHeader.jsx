export default function PageHeader({ eyebrow, title, description, actions, className = '' }) {
  const classes = ['page-header', className].filter(Boolean).join(' ');

  return (
    <header className={classes}>
      <div>
        {eyebrow && <span>{eyebrow}</span>}
        {title && <h1>{title}</h1>}
        {description &&
          (typeof description === 'string' ? (
            <p className="page-support-text">{description}</p>
          ) : (
            <div className="page-support-text">{description}</div>
          ))}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </header>
  );
}
