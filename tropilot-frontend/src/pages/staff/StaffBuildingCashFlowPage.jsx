import * as expenseApi from '../../api/expenseApi.js';
import BuildingCashFlowWorkspace from '../../components/building/BuildingCashFlowWorkspace.jsx';

export default function StaffBuildingCashFlowPage() {
  return <BuildingCashFlowWorkspace getCashFlow={expenseApi.getStaffCashFlow} />;
}
