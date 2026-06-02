import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as adminUserApi from '../../api/adminUserApi.js';
import * as buildingApi from '../../api/buildingApi.js';
import * as memberApi from '../../api/memberApi.js';
import PageHeader from '../../components/PageHeader.jsx';

const emptyFilters = {
  search: '',
  buildingId: ''
};

function normalizeSearchValue(value) {
  return String(value || '').trim().toLowerCase();
}

function userMatchesSearch(user, searchValue) {
  if (!searchValue) {
    return true;
  }

  const searchableValues = [
    user.fullName,
    user.email,
    user.phone,
    formatRole(user.role),
    user.assignedBuildingCode,
    user.assignedBuildingName,
    user.assignedRoomCode,
    user.assignedRoomName
  ];

  return searchableValues.some((value) => normalizeSearchValue(value).includes(searchValue));
}

function userMatchesBuilding(user, buildingId) {
  return !buildingId || String(user.assignedBuildingId || '') === String(buildingId);
}

function filterUsers(users, filters) {
  const searchValue = normalizeSearchValue(filters.search);

  return users.filter((user) => userMatchesSearch(user, searchValue) && userMatchesBuilding(user, filters.buildingId));
}

export default function AdminUserListPage() {
  const [records, setRecords] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [filters, setFilters] = useState(emptyFilters);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  const loadPageData = async () => {
    setLoading(true);
    setError('');

    try {
      const [usersResponse, buildingsResponse] = await Promise.all([
        adminUserApi.getUsers(),
        buildingApi.getAdminBuildings()
      ]);
      const memberResponses = await Promise.all(
        buildingsResponse.data.map((building) => memberApi.getAdminBuildingMembers({ buildingId: building.id }))
      );
      const members = memberResponses.flatMap((response) => response.data);

      setRecords(createUserRecords(usersResponse.data, members));
      setBuildings(buildingsResponse.data);
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Users could not be loaded');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPageData();
  }, []);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({
      ...current,
      [name]: value
    }));
  };

  const handleSearch = (event) => {
    event.preventDefault();
    setFilters((current) => ({
      ...current,
      search: current.search.trim()
    }));
  };

  const handleClearFilters = () => {
    setFilters(emptyFilters);
  };

  const handleStatusAction = async (user, action) => {
    const actionLabel = action === 'lock' ? 'lock' : 'unlock';
    const confirmed = window.confirm(`Are you sure you want to ${actionLabel} ${user.fullName}?`);

    if (!confirmed) {
      return;
    }

    setActionId(user.id);
    setMessage('');
    setError('');

    try {
      if (action === 'lock') {
        await adminUserApi.lockUser(user.id);
        setMessage(`${user.fullName} was locked successfully.`);
      } else {
        await adminUserApi.unlockUser(user.id);
        setMessage(`${user.fullName} was unlocked successfully.`);
      }

      await loadPageData();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Account status could not be updated');
    } finally {
      setActionId(null);
    }
  };

  const handleResetPassword = async (user) => {
    const confirmed = window.confirm(`Are you sure you want to regenerate a temporary password for ${user.fullName}?`);

    if (!confirmed) {
      return;
    }

    setActionId(user.id);
    setMessage('');
    setError('');

    try {
      const response = await adminUserApi.resetPassword(user.id);
      setMessage(`Temporary password for ${user.fullName}: ${response.data.temporaryPassword}`);
      await loadPageData();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Password could not be reset');
    } finally {
      setActionId(null);
    }
  };

  const filteredUsers = filterUsers(records, filters);

  return (
    <section className="content-section">
      <div className="page-title-row">
        <PageHeader eyebrow="Administrator" title="User management" />
        <Link className="button-link" to="/admin/users/create">
          Create user
        </Link>
      </div>

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      <form className="user-filter-row" onSubmit={handleSearch}>
        <input
          aria-label="Search users"
          name="search"
          value={filters.search}
          onChange={handleFilterChange}
          placeholder="Search by name or email"
        />
        <select
          aria-label="Filter by building"
          name="buildingId"
          value={filters.buildingId}
          onChange={handleFilterChange}
        >
          <option value="">All buildings</option>
          {buildings.map((building) => (
            <option key={building.id} value={building.id}>
              {building.buildingCode} - {building.name}
            </option>
          ))}
        </select>
        <button type="submit">Search</button>
        <button className="secondary-button inline-button" type="button" onClick={handleClearFilters}>
          Clear
        </button>
      </form>

      {loading ? (
        <div className="empty-state">Loading users...</div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>User name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Account status</th>
                <th>Temporary password</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.rowId}>
                  <td>{user.fullName}</td>
                  <td>{user.email}</td>
                  <td>{formatRole(user.role)}</td>
                  <td>
                    <span className={statusClass(user)}>
                      {formatStatus(user.status)}
                    </span>
                  </td>
                  <td>
                    {user.recordType === 'ROOM_MEMBER' ? (
                      <span className="muted-text">Not applicable</span>
                    ) : user.mustChangePassword ? (
                      <span className="temporary-password-value">
                        {user.temporaryPassword || 'Temporary password unavailable'}
                      </span>
                    ) : (
                      <span className="muted-text">Password changed by user</span>
                    )}
                  </td>
                  <td>
                    {user.recordType === 'ROOM_MEMBER' ? (
                      <span className="muted-text">No action</span>
                    ) : (
                      <div className="table-actions">
                        {user.status === 'LOCKED' ? (
                          <button
                            className="secondary-button compact-button"
                            type="button"
                            disabled={actionId === user.id}
                            onClick={() => handleStatusAction(user, 'unlock')}
                          >
                            Unlock
                          </button>
                        ) : (
                          <button
                            className="secondary-button compact-button"
                            type="button"
                            disabled={actionId === user.id || user.role === 'ADMIN'}
                            onClick={() => handleStatusAction(user, 'lock')}
                          >
                            Lock
                          </button>
                        )}
                        <button
                          className="secondary-button compact-button"
                          type="button"
                          disabled={actionId === user.id || user.role === 'ADMIN'}
                          onClick={() => handleResetPassword(user)}
                        >
                          Regenerate
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && <div className="empty-state flat-empty-state">No users match the current filters.</div>}
        </div>
      )}
    </section>
  );
}

function createUserRecords(users, members) {
  const accountRecords = users.map((user) => ({
    ...user,
    rowId: `user-${user.id}`,
    recordType: 'ACCOUNT'
  }));

  const approvedMemberRecords = members
    .filter((member) => member.status === 'APPROVED')
    .map((member) => ({
      rowId: `room-member-${member.id}`,
      recordType: 'ROOM_MEMBER',
      id: member.id,
      fullName: member.fullName,
      email: member.email || 'Not provided',
      phone: member.phone,
      role: 'ROOM_MEMBER',
      status: 'NO_LOGIN_ACCOUNT',
      mustChangePassword: false,
      assignedRoomId: member.roomId,
      assignedRoomCode: member.roomCode,
      assignedRoomName: member.roomName,
      assignedBuildingId: member.buildingId,
      assignedBuildingCode: member.buildingCode,
      assignedBuildingName: member.buildingName
    }));

  return [...accountRecords, ...approvedMemberRecords];
}

function statusClass(user) {
  if (user.status === 'NO_LOGIN_ACCOUNT') {
    return 'status-pill status-inactive';
  }

  return `status-pill status-${user.status.toLowerCase()}`;
}

function formatRole(role) {
  if (role === 'ROOM_MEMBER') {
    return 'Household member';
  }

  if (role === 'RESIDENT_HEAD') {
    return 'Head resident';
  }

  if (role === 'STAFF') {
    return 'Staff';
  }

  return 'Administrator';
}

function formatStatus(status) {
  if (status === 'NO_LOGIN_ACCOUNT') {
    return 'No login account';
  }

  return status.charAt(0) + status.slice(1).toLowerCase();
}
