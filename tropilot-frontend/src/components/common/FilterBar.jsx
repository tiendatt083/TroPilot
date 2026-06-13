export default function FilterBar({
  children,
  className = '',
  as: Component = 'form',
  ...props
}) {
  const classes = ['search-row', className].filter(Boolean).join(' ');

  return (
    <Component className={classes} {...props}>
      {children}
    </Component>
  );
}
