import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as buildingApi from '../../api/buildingApi.js';
import * as memberApi from '../../api/memberApi.js';
import * as adminUserApi from '../../api/adminUserApi.js';
import AdminAccountDirectoryTable from '../../components/AdminAccountDirectoryTable.jsx';
import AdminUserCreateDialog from '../../components/AdminUserCreateDialog.jsx';
import FilterBar from '../../components/common/FilterBar.jsx';
import NotificationPaginationControls from '../../components/NotificationPaginationControls.jsx';
import { formatDisplayDate } from '../../utils/dateFormat.js';
import { exportRowsToExcel } from '../../utils/excelExport.js';
import { normalizeSearchText } from '../../utils/searchText.js';

const emptyFilters = {
  search: '',
  buildingId: ''
};
const RESIDENT_PAGE_SIZE = 50;

function normalize(value) {
  return normalizeSearchText(value);
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

/** Trang danh sách cư dân để quản trị viên tìm kiếm và xem thông tin. */
export default function AdminResidentListPage() {
  const { t } = useTranslation();
  const [residents, setResidents] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [filters, setFilters] = useState(emptyFilters);
  const [page, setPage] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);
  const [createResetKey, setCreateResetKey] = useState(0);

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

  const totalPages = Math.max(1, Math.ceil(filteredResidents.length / RESIDENT_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const paginatedResidents = useMemo(() => {
    const start = currentPage * RESIDENT_PAGE_SIZE;
    return filteredResidents.slice(start, start + RESIDENT_PAGE_SIZE);
  }, [currentPage, filteredResidents]);

  useEffect(() => {
    setPage(0);
  }, [filters.search, filters.buildingId]);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages - 1));
  }, [totalPages]);

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

  const handleOpenCreateDialog = () => {
    setCreateError('');
    setCreateResetKey((current) => current + 1);
    setCreateDialogOpen(true);
  };

  const handleCloseCreateDialog = () => {
    if (creating) {
      return;
    }

    setCreateDialogOpen(false);
    setCreateError('');
  };

  const handleCreateResidentHead = async (form) => {
    setCreateError('');
    setMessage('');
    setError('');
    setCreating(true);

    try {
      await adminUserApi.createUser({ ...form, role: 'RESIDENT_HEAD' });
      setCreateDialogOpen(false);
      setMessage(t('userCreate.messages.residentHeadCreated'));
      await loadResidents();
    } catch (apiError) {
      setCreateError(apiError.response?.data?.message || t('userCreate.messages.createError'));
    } finally {
      setCreating(false);
    }
  };

  return (
    <section className="content-section account-directory-page modern-user-page">
      <div className="account-page-hero">
        <div>
          <h1>{t('residentDirectory.eyebrow')}</h1>
          <p>{t('residentDirectory.summary', { count: residents.length })}</p>
        </div>
        <div className="page-action-row">
          <button className="secondary-button inline-button" type="button" onClick={handleExport}>
            {t('residentDirectory.actions.exportExcel')}
          </button>
          <button
            className="button-link"
            type="button"
            onClick={handleOpenCreateDialog}
          >
            {t('residentDirectory.actions.create')}
          </button>
        </div>
      </div>

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      <div className="account-control-panel resident-directory-control-panel">
        <FilterBar
          as="div"
          className="account-search-control instant-account-filter"
          searchAriaLabel={t('residentDirectory.filters.searchAria')}
          searchPlaceholder={t('residentDirectory.filters.searchPlaceholder')}
          searchValue={filters.search}
          suggestionFields={[
            'fullName',
            'email',
            'phone',
            'assignedRoomCode',
            'assignedRoomName',
            (resident) => resident.members?.map((member) => member.fullName).join(', ')
          ]}
          suggestionItems={residents}
          filters={[
            {
              name: 'buildingId',
              value: filters.buildingId,
              ariaLabel: t('residentDirectory.filters.buildingAria'),
              onChange: (value) => setFilters((current) => ({ ...current, buildingId: value })),
              options: [
                { value: '', label: t('residentDirectory.filters.allBuildings') },
                ...buildings.map((building) => ({
                  value: String(building.id),
                  label: `${building.buildingCode} - ${building.name}`
                }))
              ]
            }
          ]}
          clearLabel={t('common.clear')}
          onClear={() => setFilters(emptyFilters)}
          onSearchChange={(value) => setFilters((current) => ({ ...current, search: value }))}
        />
      </div>

      {loading ? (
        <div className="empty-state">{t('residentDirectory.messages.loading')}</div>
      ) : (
        <AdminAccountDirectoryTable
          accounts={paginatedResidents}
          deletingId={deletingId}
          emptyMessage={t('residentDirectory.messages.empty')}
          nameColumnLabel={t('residentDirectory.columns.fullName')}
          onDelete={handleDelete}
          rowOffset={currentPage * RESIDENT_PAGE_SIZE}
          showMembersInline
          showRoom
          showRole
          showStatus={false}
          showCreatedAt={false}
          useIconActions
        />
      )}

      {!loading && filteredResidents.length > RESIDENT_PAGE_SIZE && (
        <NotificationPaginationControls
          page={currentPage}
          pageSize={RESIDENT_PAGE_SIZE}
          totalItems={filteredResidents.length}
          translationPrefix="residentDirectory"
          onPageChange={setPage}
        />
      )}

      <AdminUserCreateDialog
        error={createError}
        initialRole="RESIDENT_HEAD"
        loading={creating}
        open={createDialogOpen}
        resetKey={createResetKey}
        roleLocked
        onClose={handleCloseCreateDialog}
        onSubmit={handleCreateResidentHead}
      />
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
