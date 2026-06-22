export default function FormCard({
  children,
  title,
  description,
  className = '',
  as: Component = 'section',
  ...props
}) {
  const classes = ['panel-form', 'form-card', className].filter(Boolean).join(' ');

  return (
    <Component className={classes} {...props}>
      {(title || description) && (
        <header className="form-card-header">
          {title && <h2>{title}</h2>}
          {description && <p className="field-help">{description}</p>}
        </header>
      )}
      {children}
    </Component>
  );
}
