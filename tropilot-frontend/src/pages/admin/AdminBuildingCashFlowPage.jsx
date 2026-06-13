import * as expenseApi from '../../api/expenseApi.js';
import BuildingCashFlowWorkspace from '../../components/building/BuildingCashFlowWorkspace.jsx';

export default function AdminBuildingCashFlowPage() {
  return <BuildingCashFlowWorkspace getCashFlow={expenseApi.getAdminCashFlow} showReceipts />;
}
