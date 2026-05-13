export default function PageHeader({ eyebrow, title }) {
  return (
    <header className="page-header">
      <span>{eyebrow}</span>
      <h1>{title}</h1>
    </header>
  );
}
