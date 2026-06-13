import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import * as buildingApi from '../../features/buildings/api.js';
import * as memberApi from '../../features/residents/api.js';
import * as adminUserApi from '../../features/users/api.js';
import AdminAccountDirectoryTable from '../../components/AdminAccountDirectoryTable.jsx';
import PageHeader from '../../components/PageHeader.jsx';

const emptyFilters = {
  search: '',
  buildingId: ''
};

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function createResidentRecords(users, members) {
  const approvedMembers = members.filter((member) => member.status === 'APPROVED');

  return users
    .filter((user) => user.role === 'RESIDENT_HEAD')
    .map((resident) => ({
      ...resident,
      members: approvedMembers.filter((member) => (
        member.residentHeadId === resident.id
        && member.roomId === resident.assignedRoomId
      ))
    }))
    .sort(compareResidents);
}

function compareResidents(left, right) {
  const leftAssigned = Boolean(left.assignedRoomId);
  const rightAssigned = Boolean(right.assignedRoomId);

  if (leftAssigned !== rightAssigned) {
    return leftAssigned ? -1 : 1;
  }

  return [
    normalize(left.assignedBuildingCode).localeCompare(normalize(right.assignedBuildingCode)),
    normalize(left.assignedRoomCode).localeCompare(normalize(right.assignedRoomCode)),
    normalize(left.fullName).localeCompare(normalize(right.fullName))
  ].find((result) => result !== 0) || 0;
}

function filterResidents(residents, filters) {
  const searchValue = normalize(filters.search);

  return residents.filter((resident) => {
    const matchesBuilding = !filters.buildingId
      || String(resident.assignedBuildingId) === String(filters.buildingId);
    const matchesSearch = !searchValue || [
      resident.fullName,
      resident.email,
      resident.phone,
      resident.assignedRoomCode,
      resident.assignedRoomName,
      ...resident.members.flatMap((member) => [member.fullName, member.email, member.phone])
    ].some((value) => normalize(value).includes(searchValue));

    return matchesBuilding && matchesSearch;
  });
}

export default function AdminResidentListPage() {
  const { t } = useTranslation();
  const [residents, setResidents] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [filters, setFilters] = useState(emptyFilters);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const loadResidents = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [usersResponse, buildingsResponse] = await Promise.all([
        adminUserApi.getUsers(),
        buildingApi.getAdminBuildings()
      ]);
      const memberResponses = await Promise.all(
        buildingsResponse.data.map((building) => (
          memberApi.getAdminBuildingMembers({ buildingId: building.id })
        ))
      );

      setBuildings(buildingsResponse.data);
      setResidents(createResidentRecords(
        usersResponse.data,
        memberResponses.flatMap((response) => response.data)
      ));
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('residentDirectory.messages.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadResidents();
  }, [loadResidents]);

  const filteredResidents = useMemo(
    () => filterResidents(residents, filters),
    [residents, filters]
  );

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const handleDelete = async (resident) => {
    if (!window.confirm(t('accountDirectory.confirmations.delete', { name: resident.fullName }))) {
      return;
    }

    setDeletingId(resident.id);
    setMessage('');
    setError('');

    try {
      await adminUserApi.deleteUser(resident.id);
      setMessage(t('accountDirectory.messages.deleted', { name: resident.fullName }));
      await loadResidents();
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('accountDirectory.messages.deleteError'));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="content-section account-directory-page">
      <div className="page-title-row">
        <PageHeader
          eyebrow={t('residentDirectory.eyebrow')}
          title={t('residentDirectory.title')}
        />
        <Link
          className="button-link"
          to="/admin/users/create?role=RESIDENT_HEAD&returnTo=/admin/residents"
        >
          {t('residentDirectory.actions.create')}
        </Link>
      </div>

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      <div className="user-filter-row">
        <input
          aria-label={t('residentDirectory.filters.searchAria')}
          name="search"
          value={filters.search}
          onChange={handleFilterChange}
          placeholder={t('residentDirectory.filters.searchPlaceholder')}
        />
        <select
          aria-label={t('residentDirectory.filters.buildingAria')}
          name="buildingId"
          value={filters.buildingId}
          onChange={handleFilterChange}
        >
          <option value="">{t('residentDirectory.filters.allBuildings')}</option>
          {buildings.map((building) => (
            <option key={building.id} value={building.id}>
              {building.buildingCode} - {building.name}
            </option>
          ))}
        </select>
        <button
          className="secondary-button inline-button"
          type="button"
          onClick={() => setFilters(emptyFilters)}
        >
          {t('common.clear')}
        </button>
      </div>

      {loading ? (
        <div className="empty-state">{t('residentDirectory.messages.loading')}</div>
      ) : (
        <AdminAccountDirectoryTable
          accounts={filteredResidents}
          deletingId={deletingId}
          emptyMessage={t('residentDirectory.messages.empty')}
          onDelete={handleDelete}
          showRoom
        />
      )}
    </section>
  );
}
