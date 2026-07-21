import * as paymentApi from '../../features/payments/api.js';
import BuildingCashFlowWorkspace from '../../components/building/BuildingCashFlowWorkspace.jsx';

export default function AdminBuildingCashFlowPage() {
  return <BuildingCashFlowWorkspace getCashFlow={paymentApi.getAdminCashFlow} showReceipts />;
}
