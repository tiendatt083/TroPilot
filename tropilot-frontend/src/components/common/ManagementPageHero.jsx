/** Phần đầu trang quản trị với tiêu đề, mô tả ngắn và khu vực đặt nút thao tác. */
export default function ManagementPageHero({
  actions,
  className = '',
  description,
  title
}) {
  const classes = ['management-page-hero', className].filter(Boolean).join(' ');

  return (
    <header className={classes}>
      <div className="management-page-hero-copy">
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="page-action-row">{actions}</div>}
    </header>
  );
}
