import logo from '../assets/no_name_backgroud.png';

/** Phần nhận diện thương hiệu ở đầu thanh điều hướng bên trái. */
export default function SidebarBrand() {
  return (
    <div className="sidebar-brand">
        <img className="sidebar-logo" src={logo} alt="Tropilot logo" />
    </div>
  );
}
