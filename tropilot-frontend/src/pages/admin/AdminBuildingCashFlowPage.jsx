import * as invoiceApi from '../../features/invoices/api.js';
import * as paymentApi from '../../features/payments/api.js';
import BuildingCashFlowWorkspace from '../../components/building/BuildingCashFlowWorkspace.jsx';

export default function AdminBuildingCashFlowPage() {
  return (
    <BuildingCashFlowWorkspace
      getInvoices={invoiceApi.getAdminBuildingInvoices}
      getReceipts={paymentApi.getAdminReceipts}
    />
  );
}
