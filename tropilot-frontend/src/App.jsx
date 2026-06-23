import AppRoutes from './routes/AppRoutes.jsx';
import GlobalTooltip from './components/common/GlobalTooltip.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { useInterfaceTranslation } from './hooks/useInterfaceTranslation.js';

function InterfaceTranslationBridge() {
  useInterfaceTranslation();

  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <InterfaceTranslationBridge />
      <AppRoutes />
      <GlobalTooltip />
    </AuthProvider>
  );
}
