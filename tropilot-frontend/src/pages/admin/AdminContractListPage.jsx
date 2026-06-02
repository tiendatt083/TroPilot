import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as contractApi from '../../api/contractApi.js';
import PageHeader from '../../components/PageHeader.jsx';
import { isActiveRentalContract } from '../../utils/contractFilters.js';
import { getContractStatusClass, getContractStatusLabel } from '../../utils/contractStatusOptions.js';
import { formatDisplayDate } from '../../utils/dateFormat.js';
import { formatRoomCode } from '../../utils/roomDisplay.js';

function formatNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue)
    ? numberValue.toLocaleString('en-US', { maximumFractionDigits: 2 })
    : value;
}

export default function AdminContractListPage() {
  const [contracts, setContracts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    contractApi
      .getAdminContracts()
      .then((response) => {
        if (active) {
          setContracts((response.data || []).filter(isActiveRentalContract));
        }
      })
      .catch((apiError) => {
        if (active) {
          setError(apiError.response?.data?.message || 'Rental contracts could not be loaded');
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="content-section">
      <PageHeader eyebrow="Administrator" title="Rental contracts" />

      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">Loading rental contracts...</div>
      ) : (
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
              {contracts.map((contract) => (
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
          {contracts.length === 0 && <div className="empty-state flat-empty-state">No active rental contracts found.</div>}
        </div>
      )}
    </section>
  );
}
