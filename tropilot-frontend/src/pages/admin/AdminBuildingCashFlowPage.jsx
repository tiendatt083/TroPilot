import * as expenseApi from '../../features/payments/expenseApi.js';
import BuildingCashFlowWorkspace from '../../components/building/BuildingCashFlowWorkspace.jsx';

export default function AdminBuildingCashFlowPage() {
  return <BuildingCashFlowWorkspace getCashFlow={expenseApi.getAdminCashFlow} showReceipts />;
}
