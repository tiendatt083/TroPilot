import { useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as buildingApi from '../../features/buildings/api.js';
import PageHeader from '../../components/PageHeader.jsx';
import { formatDisplayDate } from '../../utils/dateFormat.js';
import { formatRoomCode } from '../../utils/roomDisplay.js';

const emptyFilters = {
  search: '',
  role: '',
  status: '',
  roomId: ''
};

function normalizeSearchValue(value) {
  return String(value || '').trim().toLowerCase();
}

function recordMatchesSearch(record, searchValue) {
  if (!searchValue) {
    return true;
  }

  const searchableValues = [
    record.fullName,
    record.email,
    record.phone,
    record.identityNumber,
    record.relationship,
    record.roomCode,
    record.roomName
  ];

  return searchableValues.some((value) => normalizeSearchValue(value).includes(searchValue));
}

function filterUsers(users, filters) {
  const searchValue = normalizeSearchValue(filters.search);

  return users.filter((user) => (
    recordMatchesSearch(user, searchValue)
    && (!filters.role || user.role === filters.role)
    && (!filters.status || user.status === filters.status)
    && (!filters.roomId || String(user.roomId || '') === filters.roomId)
  ));
}

function createRoomOptions(users) {
  const rooms = new Map();

  users.forEach((user) => {
    if (!user.roomId || rooms.has(user.roomId)) {
      return;
    }

    rooms.set(user.roomId, {
      id: user.roomId,
      label: user.roomName ? `${formatRoomCode(user)} - ${user.roomName}` : formatRoomCode(user)
    });
  });

  return Array.from(rooms.values()).sort((firstRoom, secondRoom) => firstRoom.label.localeCompare(secondRoom.label));
}

function createUniqueOptions(users, field) {
  return Array.from(new Set(users.map((user) => user[field]).filter(Boolean))).sort();
}

function statusClass(record) {
  if (record.recordType === 'ROOM_MEMBER') {
    return `status-pill member-status-${String(record.status || '').toLowerCase()}`;
  }

  return `status-pill status-${String(record.status || '').toLowerCase()}`;
}

export default function AdminBuildingUserPage() {
  const { t } = useTranslation();
  const { building } = useOutletContext();
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState(emptyFilters);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError('');

    buildingApi
      .getAdminBuildingUsers(building.id)
      .then((response) => {
        if (active) {
          setUsers(response.data || []);
        }
      })
      .catch((apiError) => {
        if (active) {
          setError(apiError.response?.data?.message || t('buildingUsers.loadError'));
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
  }, [building.id, t]);

  const filteredUsers = useMemo(() => filterUsers(users, filters), [users, filters]);
  const roomOptions = useMemo(() => createRoomOptions(users), [users]);
  const roleOptions = useMemo(() => createUniqueOptions(users, 'role'), [users]);
  const statusOptions = useMemo(() => createUniqueOptions(users, 'status'), [users]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((currentFilters) => ({
      ...currentFilters,
      [name]: value
    }));
  };

  const handleSearch = (event) => {
    event.preventDefault();
    setFilters((currentFilters) => ({
      ...currentFilters,
      search: currentFilters.search.trim()
    }));
  };

  const handleClearFilters = () => {
    setFilters(emptyFilters);
  };

  return (
    <div className="building-workspace">
      <PageHeader eyebrow={t('buildingUsers.eyebrow')} title={t('buildingUsers.title')} />

      {error && <div className="alert error-alert">{error}</div>}

      <form className="user-filter-row" onSubmit={handleSearch}>
        <input
          aria-label={t('buildingUsers.filters.searchAria')}
          name="search"
          value={filters.search}
          onChange={handleFilterChange}
          placeholder={t('buildingUsers.filters.searchPlaceholder')}
        />
        <select
          aria-label={t('buildingUsers.filters.roleAria')}
          name="role"
          value={filters.role}
          onChange={handleFilterChange}
        >
          <option value="">{t('buildingUsers.filters.allRoles')}</option>
          {roleOptions.map((role) => (
            <option key={role} value={role}>
              {formatRole(role, t)}
            </option>
          ))}
        </select>
        <select
          aria-label={t('buildingUsers.filters.statusAria')}
          name="status"
          value={filters.status}
          onChange={handleFilterChange}
        >
          <option value="">{t('buildingUsers.filters.allStatuses')}</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {formatStatus(status, t)}
            </option>
          ))}
        </select>
        <select
          aria-label={t('buildingUsers.filters.roomAria')}
          name="roomId"
          value={filters.roomId}
          onChange={handleFilterChange}
        >
          <option value="">{t('buildingUsers.filters.allRooms')}</option>
          {roomOptions.map((room) => (
            <option key={room.id} value={room.id}>
              {room.label}
            </option>
          ))}
        </select>
        <button type="submit">{t('common.filter')}</button>
        <button className="secondary-button inline-button" type="button" onClick={handleClearFilters}>
          {t('common.clear')}
        </button>
      </form>

      {loading ? (
        <div className="empty-state">{t('buildingUsers.loading')}</div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('buildingUsers.columns.user')}</th>
                <th>{t('buildingUsers.columns.phone')}</th>
                <th>{t('buildingUsers.columns.identityNumber')}</th>
                <th>{t('buildingUsers.columns.role')}</th>
                <th>{t('buildingUsers.columns.room')}</th>
                <th>{t('buildingUsers.columns.relationship')}</th>
                <th>{t('buildingUsers.columns.moveInDate')}</th>
                <th>{t('buildingUsers.columns.status')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={`${user.recordType}-${user.id}`}>
                  <td>
                    <strong>{user.fullName}</strong>
                    <span className="table-subtext">{user.email || t('common.notProvided')}</span>
                  </td>
                  <td>{user.phone || t('common.notProvided')}</td>
                  <td>{user.identityNumber || t('common.notProvided')}</td>
                  <td>
                    <strong>{formatRole(user.role, t)}</strong>
                    <span className="table-subtext">{formatRecordType(user.recordType, t)}</span>
                  </td>
                  <td>
                    <Link className="secondary-link compact-link" to={`/admin/rooms/${user.roomId}`}>
                      {formatRoomCode(user)}
                    </Link>
                    <span className="table-subtext">{user.roomName || t('common.notProvided')}</span>
                  </td>
                  <td>{formatRelationship(user, t)}</td>
                  <td>{formatDisplayDate(user.moveInDate, t('common.notSet'))}</td>
                  <td>
                    <span className={statusClass(user)}>{formatStatus(user.status, t)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div className="empty-state flat-empty-state">{t('buildingUsers.empty')}</div>
          )}
        </div>
      )}
    </div>
  );
}

function formatRole(role, t) {
  const roleKey = String(role || '').toLowerCase();
  const labels = {
    admin: t('role.admin'),
    staff: t('role.staff'),
    resident_head: t('role.residentHead'),
    room_member: t('buildingUsers.roles.roomMember')
  };

  return labels[roleKey] || role || t('common.notAvailable');
}

function formatRecordType(recordType, t) {
  if (recordType === 'USER_ACCOUNT') {
    return t('buildingUsers.recordTypes.account');
  }

  if (recordType === 'ROOM_MEMBER') {
    return t('buildingUsers.recordTypes.roomMember');
  }

  return recordType || t('common.notAvailable');
}

function formatRelationship(user, t) {
  if (user.role === 'RESIDENT_HEAD') {
    return t('role.residentHead');
  }

  return user.relationship || t('common.notProvided');
}

function formatStatus(status, t) {
  const statusKey = String(status || '').toLowerCase();
  const labels = {
    active: t('common.active'),
    locked: t('buildingUsers.statuses.locked'),
    inactive: t('common.inactive'),
    approved: t('buildingUsers.statuses.approved'),
    pending: t('buildingUsers.statuses.pending'),
    rejected: t('buildingUsers.statuses.rejected'),
    left: t('buildingUsers.statuses.left')
  };

  return labels[statusKey] || status || t('common.notAvailable');
}
