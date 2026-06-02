import logo from '../assets/Logo remove backgroud.png';

export default function SidebarBrand() {
  return (
    <div className="sidebar-brand">
      <img className="sidebar-logo" src={logo} alt="Tropilot logo" />
      <strong>Tropilot</strong>
    </div>
  );
}
