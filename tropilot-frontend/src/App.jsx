import AppRoutes from './routes/AppRoutes.jsx';
import GlobalTooltip from './components/common/GlobalTooltip.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { useInterfaceTranslation } from './hooks/useInterfaceTranslation.js';

/** Kích hoạt cơ chế dịch các chuỗi giao diện được tạo động ngoài file ngôn ngữ. */
function InterfaceTranslationBridge() {
  useInterfaceTranslation();

  return null;
}

/** Component gốc: cung cấp trạng thái đăng nhập, dịch giao diện, router và tooltip dùng chung. */
export default function App() {
  return (
    <AuthProvider>
      <InterfaceTranslationBridge />
      <AppRoutes />
      <GlobalTooltip />
    </AuthProvider>
  );
}
