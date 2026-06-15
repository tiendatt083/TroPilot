import { useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as buildingApi from '../../features/buildings/api.js';
import PageHeader from '../../components/PageHeader.jsx';
import { formatDisplayDate } from '../../utils/dateFormat.js';
import { formatRoomCode } from '../../utils/roomDisplay.js';

const emptyFilters = {
  search: '',
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
    record.roomName,
    ...(record.members || []).flatMap((member) => [
      member.fullName,
      member.email,
      member.phone,
      member.identityNumber,
      member.relationship
    ])
  ];

  return searchableValues.some((value) => normalizeSearchValue(value).includes(searchValue));
}

function createResidentHouseholds(users) {
  const membersByRoom = users
    .filter((user) => user.recordType === 'ROOM_MEMBER')
    .reduce((members, member) => {
      const roomMembers = members.get(member.roomId) || [];
      roomMembers.push(member);
      members.set(member.roomId, roomMembers);
      return members;
    }, new Map());

  return users
    .filter((user) => user.recordType === 'USER_ACCOUNT' && user.role === 'RESIDENT_HEAD')
    .map((residentHead) => ({
      ...residentHead,
      members: (membersByRoom.get(residentHead.roomId) || [])
        .sort((firstMember, secondMember) => (
          normalizeSearchValue(firstMember.fullName).localeCompare(normalizeSearchValue(secondMember.fullName))
        ))
    }));
}

function filterHouseholds(households, filters) {
  const searchValue = normalizeSearchValue(filters.search);

  return households.filter((residentHead) => (
    recordMatchesSearch(residentHead, searchValue)
    && (!filters.status || residentHead.status === filters.status)
    && (!filters.roomId || String(residentHead.roomId || '') === filters.roomId)
  ));
}

function createRoomOptions(households) {
  const rooms = new Map();

  households.forEach((residentHead) => {
    if (!residentHead.roomId || rooms.has(residentHead.roomId)) {
      return;
    }

    rooms.set(residentHead.roomId, {
      id: residentHead.roomId,
      label: residentHead.roomName
        ? `${formatRoomCode(residentHead)} - ${residentHead.roomName}`
        : formatRoomCode(residentHead)
    });
  });

  return Array.from(rooms.values()).sort((firstRoom, secondRoom) => firstRoom.label.localeCompare(secondRoom.label));
}

function createUniqueOptions(records, field) {
  return Array.from(new Set(records.map((record) => record[field]).filter(Boolean))).sort();
}

function statusClass(residentHead) {
  return `status-pill status-${String(residentHead.status || '').toLowerCase()}`;
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

  const households = useMemo(() => createResidentHouseholds(users), [users]);
  const filteredHouseholds = useMemo(
    () => filterHouseholds(households, filters),
    [households, filters]
  );
  const roomOptions = useMemo(() => createRoomOptions(households), [households]);
  const statusOptions = useMemo(() => createUniqueOptions(households, 'status'), [households]);

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
                <th>{t('buildingUsers.columns.room')}</th>
                <th>{t('buildingUsers.columns.moveInDate')}</th>
                <th>{t('buildingUsers.columns.status')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredHouseholds.map((residentHead) => (
                <tr key={residentHead.id}>
                  <td>
                    <strong>{residentHead.fullName}</strong>
                    <span className="table-subtext">{residentHead.email || t('common.notProvided')}</span>
                    {residentHead.members.length > 0 && (
                      <div className="account-inline-members">
                        <span className="account-inline-members-label">
                          {t('accountDirectory.inlineMembers')}
                        </span>
                        <div className="account-inline-member-list">
                          {residentHead.members.map((member) => (
                            <span className="account-inline-member" key={member.id}>
                              {member.fullName}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </td>
                  <td>{residentHead.phone || t('common.notProvided')}</td>
                  <td>{residentHead.identityNumber || t('common.notProvided')}</td>
                  <td>
                    <Link className="secondary-link compact-link" to={`/admin/rooms/${residentHead.roomId}`}>
                      {formatRoomCode(residentHead)}
                    </Link>
                    <span className="table-subtext">{residentHead.roomName || t('common.notProvided')}</span>
                  </td>
                  <td>{formatDisplayDate(residentHead.moveInDate, t('common.notSet'))}</td>
                  <td>
                    <span className={statusClass(residentHead)}>{formatStatus(residentHead.status, t)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredHouseholds.length === 0 && (
            <div className="empty-state flat-empty-state">{t('buildingUsers.empty')}</div>
          )}
        </div>
      )}
    </div>
  );
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
