import { useEffect, useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import * as contractApi from '../../api/contractApi.js';
import * as expenseApi from '../../api/expenseApi.js';
import * as feedbackApi from '../../api/feedbackApi.js';
import * as invoiceApi from '../../api/invoiceApi.js';
import * as maintenanceApi from '../../api/maintenanceApi.js';
import * as memberApi from '../../api/memberApi.js';
import * as notificationApi from '../../api/notificationApi.js';
import * as paymentApi from '../../api/paymentApi.js';
import * as roomApi from '../../api/roomApi.js';
import * as taskApi from '../../api/taskApi.js';
import * as vehicleApi from '../../api/vehicleApi.js';
import ExpenseTable from '../../components/ExpenseTable.jsx';
import FeedbackTable from '../../components/FeedbackTable.jsx';
import InvoiceTable from '../../components/InvoiceTable.jsx';
import MaintenanceRequestTable from '../../components/MaintenanceRequestTable.jsx';
import NotificationTable from '../../components/NotificationTable.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import PaymentTable from '../../components/PaymentTable.jsx';
import ReceiptTable from '../../components/ReceiptTable.jsx';
import TaskTable from '../../components/TaskTable.jsx';
import VehicleTable from '../../components/VehicleTable.jsx';
import { isActiveRentalContract } from '../../utils/contractFilters.js';
import { getContractStatusClass, getContractStatusLabel } from '../../utils/contractStatusOptions.js';
import { formatDisplayDate } from '../../utils/dateFormat.js';
import { getMemberStatusLabel } from '../../utils/memberStatusOptions.js';
import { formatRoomCode } from '../../utils/roomDisplay.js';
import { getRoomStatusLabel } from '../../utils/roomStatusOptions.js';

const emptyBuildingOperations = {
  rooms: [],
  contracts: [],
  invoices: [],
  vehicles: [],
  pendingPayments: [],
  receipts: [],
  members: [],
  maintenanceRequests: [],
  expenses: [],
  tasks: [],
  feedbacks: [],
  invoiceComplaints: [],
  notifications: []
};

function formatNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue)
    ? numberValue.toLocaleString('en-US', { maximumFractionDigits: 2 })
    : value;
}

function sumAmounts(items, amountKey) {
  return items.reduce((total, item) => total + (Number(item[amountKey]) || 0), 0);
}

function statusClass(status) {
  return `status-pill room-status-${status.toLowerCase()}`;
}

export default function AdminBuildingDetailPage() {
  const { id } = useParams();
  const { building } = useOutletContext();
  const [operations, setOperations] = useState(emptyBuildingOperations);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const buildingId = Number(id);

    async function loadBuildingWorkspace() {
      setLoading(true);
      setError('');

      try {
        const [
          roomsResponse,
          contractsResponse,
          invoicesResponse,
          vehiclesResponse,
          paymentsResponse,
          receiptsResponse,
          membersResponse,
          maintenanceResponse,
          expensesResponse,
          tasksResponse,
          feedbacksResponse,
          invoiceComplaintsResponse,
          notificationsResponse
        ] = await Promise.all([
          roomApi.getAdminRooms({ buildingId }),
          contractApi.getAdminContracts({ buildingId }),
          invoiceApi.getAdminBuildingInvoices(buildingId),
          vehicleApi.getAdminVehicles({ buildingId }),
          paymentApi.getPendingPayments({ buildingId }),
          paymentApi.getAdminReceipts({ buildingId }),
          memberApi.getAdminBuildingMembers({ buildingId }),
          maintenanceApi.getAdminMaintenanceRequests({ buildingId }),
          expenseApi.getAdminExpenses({ buildingId }),
          taskApi.getAdminTasks({ buildingId }),
          feedbackApi.getAdminFeedbacks({ buildingId }),
          feedbackApi.getAdminInvoiceComplaints({ buildingId }),
          notificationApi.getAdminNotifications({ buildingId })
        ]);

        if (!active) {
          return;
        }

        setOperations({
          rooms: roomsResponse.data || [],
          contracts: (contractsResponse.data || []).filter(isActiveRentalContract),
          invoices: invoicesResponse.data || [],
          vehicles: vehiclesResponse.data || [],
          pendingPayments: paymentsResponse.data || [],
          receipts: receiptsResponse.data || [],
          members: membersResponse.data || [],
          maintenanceRequests: maintenanceResponse.data || [],
          expenses: expensesResponse.data || [],
          tasks: tasksResponse.data || [],
          feedbacks: feedbacksResponse.data || [],
          invoiceComplaints: invoiceComplaintsResponse.data || [],
          notifications: notificationsResponse.data || []
        });
      } catch (apiError) {
        if (active) {
          setError(apiError.response?.data?.message || 'Building workspace could not be loaded');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadBuildingWorkspace();

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return <div className="empty-state">Loading building workspace...</div>;
  }

  const occupiedRooms = operations.rooms.filter((room) => room.status === 'OCCUPIED').length;
  const emptyRooms = operations.rooms.filter((room) => room.status === 'EMPTY').length;
  const maintenanceRooms = operations.rooms.filter((room) => room.status === 'MAINTENANCE').length;
  const activeVehicles = operations.vehicles.filter((vehicle) => vehicle.status === 'ACTIVE').length;
  const approvedMembers = operations.members.filter((member) => member.status === 'APPROVED').length;
  const pendingMembers = operations.members.filter((member) => member.status === 'PENDING').length;
  const unpaidInvoices = operations.invoices.filter((invoice) => invoice.status !== 'PAID').length;
  const validReceipts = operations.receipts.filter((receipt) => receipt.status === 'VALID');
  const openMaintenanceRequests = operations.maintenanceRequests.filter((request) =>
    ['PENDING', 'ASSIGNED', 'IN_PROGRESS'].includes(request.status)
  ).length;
  const openTasks = operations.tasks.filter((task) => ['NEW', 'IN_PROGRESS', 'OVERDUE'].includes(task.status)).length;
  const unresolvedFeedbacks = operations.feedbacks.filter((feedback) =>
    ['PENDING', 'IN_PROGRESS'].includes(feedback.status)
  ).length;
  const validExpenses = operations.expenses.filter((expense) => expense.status === 'VALID');
  const totalInvoiceAmount = sumAmounts(operations.invoices, 'totalAmount');
  const totalReceiptAmount = sumAmounts(validReceipts, 'amount');
  const totalExpenseAmount = sumAmounts(validExpenses, 'amount');

  return (
    <div className="building-workspace">
      {error && <div className="alert error-alert">{error}</div>}

      <div className="detail-panel">
        <div>
          <span>Building code</span>
          <strong>{building.buildingCode}</strong>
        </div>
        <div>
          <span>Address</span>
          <strong>{building.address}</strong>
        </div>
        <div>
          <span>Floors</span>
          <strong>{building.floors}</strong>
        </div>
        <div>
          <span>Management scope</span>
          <strong>Rooms, members, contracts, utility readings, invoices, payments, receipts, vehicles, maintenance, expenses, and cash flow for this building</strong>
        </div>
        <div className="detail-wide">
          <span>Description</span>
          <p>{building.description || 'No description provided.'}</p>
        </div>
      </div>

      <div className="dashboard-grid building-summary-grid">
        <div className="dashboard-card">
          <span>Total rooms</span>
          <strong>{formatNumber(operations.rooms.length)}</strong>
        </div>
        <div className="dashboard-card">
          <span>Occupied rooms</span>
          <strong>{formatNumber(occupiedRooms)}</strong>
        </div>
        <div className="dashboard-card">
          <span>Empty rooms</span>
          <strong>{formatNumber(emptyRooms)}</strong>
        </div>
        <div className="dashboard-card">
          <span>Maintenance rooms</span>
          <strong>{formatNumber(maintenanceRooms)}</strong>
        </div>
        <div className="dashboard-card">
          <span>Active vehicles</span>
          <strong>{formatNumber(activeVehicles)}</strong>
        </div>
        <div className="dashboard-card">
          <span>Approved room members</span>
          <strong>{formatNumber(approvedMembers)}</strong>
        </div>
        <div className="dashboard-card">
          <span>Pending room members</span>
          <strong>{formatNumber(pendingMembers)}</strong>
        </div>
        <div className="dashboard-card">
          <span>Unpaid invoices</span>
          <strong>{formatNumber(unpaidInvoices)}</strong>
        </div>
        <div className="dashboard-card">
          <span>Pending payments</span>
          <strong>{formatNumber(operations.pendingPayments.length)}</strong>
        </div>
        <div className="dashboard-card">
          <span>Open maintenance requests</span>
          <strong>{formatNumber(openMaintenanceRequests)}</strong>
        </div>
        <div className="dashboard-card">
          <span>Total invoice amount</span>
          <strong>{formatNumber(totalInvoiceAmount)}</strong>
        </div>
        <div className="dashboard-card">
          <span>Total income</span>
          <strong>{formatNumber(totalReceiptAmount)}</strong>
        </div>
        <div className="dashboard-card">
          <span>Total expense</span>
          <strong>{formatNumber(totalExpenseAmount)}</strong>
        </div>
        <div className="dashboard-card">
          <span>Open tasks</span>
          <strong>{formatNumber(openTasks)}</strong>
        </div>
        <div className="dashboard-card">
          <span>Unresolved feedbacks</span>
          <strong>{formatNumber(unresolvedFeedbacks)}</strong>
        </div>
        <div className="dashboard-card">
          <span>Invoice complaints</span>
          <strong>{formatNumber(operations.invoiceComplaints.length)}</strong>
        </div>
        <div className="dashboard-card">
          <span>Building notifications</span>
          <strong>{formatNumber(operations.notifications.length)}</strong>
        </div>
      </div>

      <section className="building-section">
        <div className="building-section-header">
          <PageHeader eyebrow="Building rooms" title="Rooms in this building" />
          <Link className="secondary-link" to={`/admin/buildings/${building.id}/rooms`}>
            Manage rooms
          </Link>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Floor</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {operations.rooms.map((room) => (
                <tr key={room.id}>
                  <td>{formatRoomCode(room)}</td>
                  <td>{room.roomName}</td>
                  <td>{room.floor}</td>
                  <td>{formatNumber(room.price)}</td>
                  <td>
                    <span className={statusClass(room.status)}>{getRoomStatusLabel(room.status)}</span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <Link className="secondary-link compact-link" to={`/admin/rooms/${room.id}`}>
                        View
                      </Link>
                      <Link className="secondary-link compact-link" to={`/admin/rooms/${room.id}/edit`}>
                        Edit
                      </Link>
                      <Link className="secondary-link compact-link" to={`/admin/rooms/${room.id}/members`}>
                        Members
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {operations.rooms.length === 0 && <div className="empty-state flat-empty-state">No rooms found.</div>}
        </div>
      </section>

      <section className="building-section">
        <div className="building-section-header">
          <PageHeader eyebrow="Contracts" title="Contracts in this building" />
          <Link className="secondary-link" to={`/admin/buildings/${building.id}/contracts`}>
            Manage contracts
          </Link>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Room</th>
                <th>Head Resident</th>
                <th>Period</th>
                <th>Deposit</th>
                <th>Status</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {operations.contracts.map((contract) => (
                <tr key={contract.id}>
                  <td>{formatRoomCode(contract)}</td>
                  <td>{contract.residentHeadName}</td>
                  <td>
                    {formatDisplayDate(contract.startDate)} to {formatDisplayDate(contract.endDate)}
                  </td>
                  <td>{formatNumber(contract.depositAmount)}</td>
                  <td>
                    <span className={getContractStatusClass(contract.contractStatus)}>
                      {getContractStatusLabel(contract.contractStatus)}
                    </span>
                  </td>
                  <td>
                    <Link className="secondary-link compact-link" to={`/admin/contracts/${contract.id}`}>
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {operations.contracts.length === 0 && (
            <div className="empty-state flat-empty-state">No rental contracts found.</div>
          )}
        </div>
      </section>

      <section className="building-section">
        <div className="building-section-header">
          <PageHeader eyebrow="Billing" title="Utility readings and invoices" />
          <div className="button-row">
            <Link className="secondary-link" to={`/admin/buildings/${building.id}/utility-readings`}>
              Utility readings
            </Link>
            <Link className="secondary-link" to={`/admin/buildings/${building.id}/invoices`}>
              Invoices
            </Link>
          </div>
        </div>
        <InvoiceTable invoices={operations.invoices} />
      </section>

      <section className="building-section">
        <div className="building-section-header">
          <PageHeader eyebrow="Vehicles" title="Vehicles in this building" />
          <Link className="secondary-link" to={`/admin/buildings/${building.id}/vehicles`}>
            Manage vehicles
          </Link>
        </div>
        <VehicleTable vehicles={operations.vehicles} />
      </section>

      <section className="building-section">
        <div className="building-section-header">
          <PageHeader eyebrow="Payments" title="Pending payments in this building" />
          <Link className="secondary-link" to={`/admin/buildings/${building.id}/payments`}>
            Manage payments
          </Link>
        </div>
        <PaymentTable payments={operations.pendingPayments} />
      </section>

      <section className="building-section">
        <div className="building-section-header">
          <PageHeader eyebrow="Receipts" title="Receipts in this building" />
          <Link className="secondary-link" to={`/admin/buildings/${building.id}/receipts`}>
            Manage receipts
          </Link>
        </div>
        <ReceiptTable receipts={operations.receipts} />
      </section>

      <section className="building-section">
        <div className="building-section-header">
          <PageHeader eyebrow="Room members" title="Room members in this building" />
          <Link className="secondary-link" to={`/admin/buildings/${building.id}/members`}>
            Manage room members
          </Link>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Phone</th>
                <th>Room</th>
                <th>Head Resident</th>
                <th>Status</th>
                <th>Occupants</th>
              </tr>
            </thead>
            <tbody>
              {operations.members.map((member) => (
                <tr key={member.id}>
                  <td>
                    <strong>{member.fullName}</strong>
                    <span className="table-subtext">{member.email || 'Not provided'}</span>
                  </td>
                  <td>{member.phone}</td>
                  <td>{formatRoomCode(member)}</td>
                  <td>{member.residentHeadName}</td>
                  <td>
                    <span className={`status-pill member-status-${member.status.toLowerCase()}`}>
                      {getMemberStatusLabel(member.status)}
                    </span>
                  </td>
                  <td>
                    {member.totalOccupants} of {member.maxOccupants}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {operations.members.length === 0 && (
            <div className="empty-state flat-empty-state">No room members found.</div>
          )}
        </div>
      </section>

      <section className="building-section">
        <div className="building-section-header">
          <PageHeader eyebrow="Maintenance" title="Maintenance requests in this building" />
          <Link className="secondary-link" to={`/admin/buildings/${building.id}/maintenance`}>
            Manage maintenance
          </Link>
        </div>
        <MaintenanceRequestTable requests={operations.maintenanceRequests} />
      </section>

      <section className="building-section">
        <div className="building-section-header">
          <PageHeader eyebrow="Expenses" title="Expenses in this building" />
          <div className="button-row">
            <Link className="secondary-link" to={`/admin/buildings/${building.id}/expenses`}>
              Manage expenses
            </Link>
            <Link className="secondary-link" to={`/admin/buildings/${building.id}/cashflow`}>
              View cash flow
            </Link>
          </div>
        </div>
        <ExpenseTable expenses={operations.expenses} />
      </section>

      <section className="building-section">
        <div className="building-section-header">
          <PageHeader eyebrow="Tasks" title="Tasks in this building" />
          <Link className="secondary-link" to={`/admin/buildings/${building.id}/tasks`}>
            Manage tasks
          </Link>
        </div>
        <TaskTable tasks={operations.tasks} detailBasePath={`/admin/buildings/${building.id}/tasks`} />
      </section>

      <section className="building-section">
        <div className="building-section-header">
          <PageHeader eyebrow="Feedbacks" title="Feedbacks in this building" />
          <Link className="secondary-link" to={`/admin/buildings/${building.id}/feedbacks`}>
            Manage feedbacks
          </Link>
        </div>
        <FeedbackTable feedbacks={operations.feedbacks} />
      </section>

      <section className="building-section">
        <div className="building-section-header">
          <PageHeader eyebrow="Invoice complaints" title="Invoice complaints in this building" />
          <Link className="secondary-link" to={`/admin/buildings/${building.id}/invoice-complaints`}>
            Manage invoice complaints
          </Link>
        </div>
        <FeedbackTable feedbacks={operations.invoiceComplaints} />
      </section>

      <section className="building-section">
        <div className="building-section-header">
          <PageHeader eyebrow="Notifications" title="Notifications in this building" />
          <Link className="secondary-link" to={`/admin/buildings/${building.id}/notifications`}>
            Manage notifications
          </Link>
        </div>
        <NotificationTable notifications={operations.notifications} />
      </section>
    </div>
  );
}
