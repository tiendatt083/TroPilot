import { useEffect, useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import * as contractApi from '../../api/contractApi.js';
import * as expenseApi from '../../api/expenseApi.js';
import * as invoiceApi from '../../api/invoiceApi.js';
import * as maintenanceApi from '../../api/maintenanceApi.js';
import * as roomApi from '../../api/roomApi.js';
import * as vehicleApi from '../../api/vehicleApi.js';
import ExpenseTable from '../../components/ExpenseTable.jsx';
import InvoiceTable from '../../components/InvoiceTable.jsx';
import MaintenanceRequestTable from '../../components/MaintenanceRequestTable.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import VehicleTable from '../../components/VehicleTable.jsx';
import { getContractStatusClass, getContractStatusLabel } from '../../utils/contractStatusOptions.js';
import { getRoomStatusLabel } from '../../utils/roomStatusOptions.js';

const emptyBuildingOperations = {
  rooms: [],
  contracts: [],
  invoices: [],
  vehicles: [],
  maintenanceRequests: [],
  expenses: []
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

function filterByBuilding(items, buildingId, roomIds) {
  return items.filter((item) => Number(item.buildingId) === buildingId || roomIds.has(Number(item.roomId)));
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
          maintenanceResponse,
          expensesResponse
        ] = await Promise.all([
          roomApi.getAdminRooms({ buildingId }),
          contractApi.getAdminContracts(),
          invoiceApi.getAdminInvoices(),
          vehicleApi.getAdminVehicles(),
          maintenanceApi.getAdminMaintenanceRequests(),
          expenseApi.getAdminExpenses()
        ]);

        if (!active) {
          return;
        }

        const rooms = roomsResponse.data || [];
        const roomIds = new Set(rooms.map((room) => Number(room.id)));

        setOperations({
          rooms,
          contracts: filterByBuilding(contractsResponse.data || [], buildingId, roomIds),
          invoices: filterByBuilding(invoicesResponse.data || [], buildingId, roomIds),
          vehicles: filterByBuilding(vehiclesResponse.data || [], buildingId, roomIds),
          maintenanceRequests: filterByBuilding(maintenanceResponse.data || [], buildingId, roomIds),
          expenses: filterByBuilding(expensesResponse.data || [], buildingId, roomIds)
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
  const unpaidInvoices = operations.invoices.filter((invoice) => invoice.status !== 'PAID').length;
  const openMaintenanceRequests = operations.maintenanceRequests.filter((request) =>
    ['PENDING', 'ASSIGNED', 'IN_PROGRESS'].includes(request.status)
  ).length;
  const validExpenses = operations.expenses.filter((expense) => expense.status === 'VALID');
  const totalInvoiceAmount = sumAmounts(operations.invoices, 'totalAmount');
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
          <strong>Rooms, contracts, invoices, vehicles, maintenance, and expenses for this building</strong>
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
          <span>Unpaid invoices</span>
          <strong>{formatNumber(unpaidInvoices)}</strong>
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
          <span>Total expense</span>
          <strong>{formatNumber(totalExpenseAmount)}</strong>
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
                  <td>{room.roomCode}</td>
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
        <PageHeader eyebrow="Contracts" title="Contracts in this building" />
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
                  <td>{contract.roomCode}</td>
                  <td>{contract.residentHeadName}</td>
                  <td>
                    {contract.startDate} to {contract.endDate}
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
        <PageHeader eyebrow="Invoices" title="Invoices in this building" />
        <InvoiceTable invoices={operations.invoices} />
      </section>

      <section className="building-section">
        <PageHeader eyebrow="Vehicles" title="Vehicles in this building" />
        <VehicleTable vehicles={operations.vehicles} />
      </section>

      <section className="building-section">
        <PageHeader eyebrow="Maintenance" title="Maintenance requests in this building" />
        <MaintenanceRequestTable requests={operations.maintenanceRequests} />
      </section>

      <section className="building-section">
        <PageHeader eyebrow="Expenses" title="Expenses in this building" />
        <ExpenseTable expenses={operations.expenses} />
      </section>
    </div>
  );
}
