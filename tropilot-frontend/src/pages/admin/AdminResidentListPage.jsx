import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import * as buildingApi from '../../features/buildings/api.js';
import * as memberApi from '../../features/residents/api.js';
import * as adminUserApi from '../../features/users/api.js';
import AdminAccountDirectoryTable from '../../components/AdminAccountDirectoryTable.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { formatDisplayDate } from '../../utils/dateFormat.js';
import { exportRowsToExcel } from '../../utils/excelExport.js';

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
        String(member.residentHeadId) === String(resident.id)
        && String(member.roomId) === String(resident.assignedRoomId)
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

function buildExportFileName() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();

  return `tropilot-residents-${day}-${month}-${year}.xlsx`;
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

  const handleExport = () => {
    setMessage('');
    setError('');

    if (filteredResidents.length === 0) {
      setError(t('residentDirectory.messages.exportEmpty'));
      return;
    }

    const rows = [];

    filteredResidents.forEach((resident) => {
      rows.push(toResidentExportRow({
        record: resident,
        index: rows.length + 1,
        recordType: t('residentDirectory.recordTypes.headResident'),
        headResidentName: '',
        t
      }));

      resident.members.forEach((member) => {
        rows.push(toResidentExportRow({
          record: member,
          index: rows.length + 1,
          recordType: t('residentDirectory.recordTypes.member'),
          headResidentName: resident.fullName,
          t
        }));
      });
    });

    exportRowsToExcel({
      rows,
      fileName: buildExportFileName(),
      sheetName: t('residentDirectory.export.sheetName')
    });
  };

  return (
    <section className="content-section account-directory-page">
      <div className="page-title-row">
        <PageHeader
          eyebrow={t('residentDirectory.eyebrow')}
          title={t('residentDirectory.title')}
        />
        <div className="page-action-row">
          <button className="secondary-button inline-button" type="button" onClick={handleExport}>
            {t('residentDirectory.actions.exportExcel')}
          </button>
          <Link
            className="button-link"
            to="/admin/users/create?role=RESIDENT_HEAD&returnTo=/admin/residents"
          >
            {t('residentDirectory.actions.create')}
          </Link>
        </div>
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
          showMembersInline
          showRoom
        />
      )}
    </section>
  );
}

function toResidentExportRow({ record, index, recordType, headResidentName, t }) {
  return {
    [t('accountDirectory.columns.id')]: index,
    [t('buildingUsers.columns.recordType')]: recordType,
    [t('accountDirectory.columns.name')]: record.fullName || t('common.notProvided'),
    [t('accountDirectory.columns.email')]: record.email || t('common.notProvided'),
    [t('profile.fields.phone')]: record.phone || t('common.notProvided'),
    [t('tables.common.building')]: formatAssignedBuilding(record, t),
    [t('tables.common.room')]: formatAssignedRoom(record, t),
    [t('forms.member.relationship')]: record.relationship || t('common.notApplicable'),
    [t('tables.common.headResident')]: headResidentName || t('common.notApplicable'),
    [t('roomManagement.moveIn')]: formatDisplayDate(record.moveInDate, t('common.notSet')),
    [t('accountDirectory.columns.status')]: formatResidentStatus(record.status, t)
  };
}

function formatAssignedBuilding(record, t) {
  const buildingLabel = [record.assignedBuildingCode || record.buildingCode, record.assignedBuildingName || record.buildingName]
    .filter(Boolean)
    .join(' - ');

  return buildingLabel || t('common.notAssigned');
}

function formatAssignedRoom(record, t) {
  const roomLabel = [record.assignedRoomCode || record.roomCode, record.assignedRoomName || record.roomName]
    .filter(Boolean)
    .join(' - ');

  return roomLabel || t('common.notAssigned');
}

function formatResidentStatus(status, t) {
  if (['PENDING', 'APPROVED', 'REJECTED', 'LEFT'].includes(status)) {
    return t(`enum.memberStatus.${status}`);
  }

  if (status === 'ACTIVE') {
    return t('common.active');
  }

  if (status === 'LOCKED') {
    return t('userManagement.status.locked');
  }

  if (status === 'INACTIVE') {
    return t('common.inactive');
  }

  return status ? t('common.active') : t('common.notAvailable');
}
