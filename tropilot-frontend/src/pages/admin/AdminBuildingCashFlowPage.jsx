import * as invoiceApi from '../../api/invoiceApi.js';
import * as paymentApi from '../../api/paymentApi.js';
import BuildingCashFlowWorkspace from '../../components/building/BuildingCashFlowWorkspace.jsx';

/** Trang quản trị theo dõi dòng tiền, hóa đơn và biên lai của một tòa nhà. */
export default function AdminBuildingCashFlowPage() {
  return (
    <BuildingCashFlowWorkspace
      getInvoices={invoiceApi.getAdminBuildingInvoices}
      getReceipts={paymentApi.getAdminReceipts}
    />
  );
}
