import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as buildingApi from '../../features/buildings/api.js';
import * as roomApi from '../../features/rooms/api.js';
import * as adminUserApi from '../../features/users/api.js';
import AdminAccountDirectoryTable from '../../components/AdminAccountDirectoryTable.jsx';
import ModalCloseButton from '../../components/common/ModalCloseButton.jsx';
import { addMonthsToDateInput, formatDateInputValue, formatDisplayDate } from '../../utils/dateFormat.js';
import { exportRowsToExcel } from '../../utils/excelExport.js';
import { formatRoomCode, formatRoomLabel } from '../../utils/roomDisplay.js';

const emptyFilters = {
  search: '',
  roomId: ''
};

const today = formatDateInputValue();

const emptyAssignmentForm = {
  residentHeadId: '',
  roomId: '',
  startDate: today,
  endDate: addMonthsToDateInput(today, 6)
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
    record.relationship,
    record.roomCode,
    record.roomName,
    ...(record.members || []).flatMap((member) => [
      member.fullName,
      member.email,
      member.phone,
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

function getAvailableResidentHeads(users) {
  return users
    .filter((user) => user.role === 'RESIDENT_HEAD' && user.status === 'ACTIVE' && !user.assignedRoomId)
    .sort((firstUser, secondUser) => (
      normalizeSearchValue(firstUser.fullName).localeCompare(normalizeSearchValue(secondUser.fullName))
    ));
}

function getAvailableRooms(rooms) {
  return rooms
    .filter((room) => room.status === 'EMPTY')
    .sort((firstRoom, secondRoom) => formatRoomLabel(firstRoom).localeCompare(formatRoomLabel(secondRoom)));
}

function buildExportFileName(building) {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const buildingCode = String(building?.buildingCode || building?.code || 'building')
    .trim()
    .replace(/[^a-zA-Z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();

  return `tropilot-${buildingCode || 'building'}-users-${day}-${month}-${year}.xlsx`;
}

export default function AdminBuildingUserPage() {
  const { t } = useTranslation();
  const { building } = useOutletContext();
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState(emptyFilters);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [assignmentOpen, setAssignmentOpen] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState(emptyAssignmentForm);
  const [assignmentOptions, setAssignmentOptions] = useState({
    residentHeads: [],
    rooms: []
  });
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [assignmentSubmitting, setAssignmentSubmitting] = useState(false);
  const [assignmentError, setAssignmentError] = useState('');

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

  const handleExport = () => {
    setMessage('');
    setError('');

    if (filteredHouseholds.length === 0) {
      setError(t('buildingUsers.messages.exportEmpty'));
      return;
    }

    const rows = [];

    filteredHouseholds.forEach((residentHead) => {
      rows.push(toExportRow({
        record: residentHead,
        index: rows.length + 1,
        recordType: t('buildingUsers.recordTypes.account'),
        headResidentName: '',
        t
      }));

      residentHead.members.forEach((member) => {
        rows.push(toExportRow({
          record: member,
          index: rows.length + 1,
          recordType: t('buildingUsers.recordTypes.roomMember'),
          headResidentName: residentHead.fullName,
          t
        }));
      });
    });

    exportRowsToExcel({
      rows,
      fileName: buildExportFileName(building),
      sheetName: t('buildingUsers.export.sheetName')
    });
  };

  const refreshBuildingUsers = async () => {
    const response = await buildingApi.getAdminBuildingUsers(building.id);
    setUsers(response.data || []);
  };

  const loadAssignmentOptions = async () => {
    setAssignmentLoading(true);
    setAssignmentError('');

    try {
      const [usersResponse, roomsResponse] = await Promise.all([
        adminUserApi.getUsers(),
        roomApi.getAdminRooms({
          buildingId: building.id,
          status: 'EMPTY'
        })
      ]);

      setAssignmentOptions({
        residentHeads: getAvailableResidentHeads(usersResponse.data || []),
        rooms: getAvailableRooms(roomsResponse.data || [])
      });
    } catch (apiError) {
      setAssignmentError(apiError.response?.data?.message || t('buildingUsers.assignment.optionsLoadError'));
    } finally {
      setAssignmentLoading(false);
    }
  };

  const handleOpenAssignment = () => {
    setAssignmentForm(emptyAssignmentForm);
    setAssignmentError('');
    setMessage('');
    setAssignmentOpen(true);
    loadAssignmentOptions();
  };

  const handleCloseAssignment = () => {
    if (assignmentSubmitting) {
      return;
    }

    setAssignmentOpen(false);
  };

  const handleAssignmentChange = (event) => {
    const { name, value } = event.target;
    setAssignmentForm((currentForm) => ({
      ...currentForm,
      [name]: value,
      ...(name === 'startDate' ? { endDate: addMonthsToDateInput(value, 6) } : {})
    }));
  };

  const handleAssignHeadResident = async (event) => {
    event.preventDefault();
    setAssignmentSubmitting(true);
    setAssignmentError('');
    setMessage('');
    setError('');

    try {
      await roomApi.assignHeadResident(Number(assignmentForm.roomId), {
        residentHeadId: Number(assignmentForm.residentHeadId),
        startDate: assignmentForm.startDate,
        endDate: assignmentForm.endDate
      });
      await refreshBuildingUsers();
      setAssignmentOpen(false);
      setMessage(t('buildingUsers.assignment.assigned'));
    } catch (apiError) {
      setAssignmentError(apiError.response?.data?.message || t('buildingUsers.assignment.assignError'));
    } finally {
      setAssignmentSubmitting(false);
    }
  };

  const hasResidentHeads = assignmentOptions.residentHeads.length > 0;
  const hasRooms = assignmentOptions.rooms.length > 0;

  return (
    <div className="building-workspace modern-user-page building-user-modern-page">
      <div className="building-section-header">
        <span className="page-eyebrow">{t('buildingUsers.eyebrow')}</span>
        <div className="building-user-actions-row">
          <button className="secondary-button inline-button" type="button" onClick={handleExport}>
            {t('buildingUsers.actions.exportExcel')}
          </button>
          <button className="button-link" type="button" onClick={handleOpenAssignment}>
            {t('buildingUsers.assignment.open')}
          </button>
        </div>
      </div>

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      <form className="account-control-panel building-user-control-panel" onSubmit={handleSearch}>
        <div className="account-search-control">
          <input
            aria-label={t('buildingUsers.filters.searchAria')}
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder={t('buildingUsers.filters.searchPlaceholder')}
          />
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
          <button
            className="secondary-button inline-button compact-clear-filter"
            type="button"
            onClick={handleClearFilters}
          >
            {t('common.clear')}
          </button>
        </div>
      </form>

      {loading ? (
        <div className="empty-state">{t('buildingUsers.loading')}</div>
      ) : (
        <AdminAccountDirectoryTable
          accounts={filteredHouseholds}
          allowDelete={false}
          emptyMessage={t('buildingUsers.empty')}
          getRoomUrl={(residentHead) => (
            residentHead.roomId ? `/admin/buildings/${building.id}/rooms/${residentHead.roomId}` : ''
          )}
          nameColumnLabel={t('buildingUsers.columns.user')}
          showMembersInline
          showMoveInDate
          showRole
          showRoom
          showStatus={false}
          showTemporaryPassword={false}
          useIconActions
        />
      )}

      {assignmentOpen && (
        <div className="confirm-dialog-overlay" role="presentation" onMouseDown={handleCloseAssignment}>
          <section
            className="confirm-dialog assignment-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="assign-head-resident-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="account-modal-header">
              <div>
                <span className="section-eyebrow">{t('buildingUsers.assignment.eyebrow')}</span>
                <h2 id="assign-head-resident-title">{t('buildingUsers.assignment.title')}</h2>
              </div>
              <ModalCloseButton label={t('common.close')} onClick={handleCloseAssignment} />
            </div>

            <p className="assignment-dialog-description">{t('buildingUsers.assignment.description')}</p>

            {assignmentError && <div className="alert error-alert">{assignmentError}</div>}

            {assignmentLoading ? (
              <div className="empty-state flat-empty-state">{t('buildingUsers.assignment.loading')}</div>
            ) : (
              <form className="panel-form assignment-form" onSubmit={handleAssignHeadResident}>
                <label htmlFor="buildingUserResidentHeadId">
                  {t('tables.common.headResident')}
                </label>
                <select
                  id="buildingUserResidentHeadId"
                  name="residentHeadId"
                  value={assignmentForm.residentHeadId}
                  onChange={handleAssignmentChange}
                  required
                  disabled={!hasResidentHeads}
                >
                  <option value="">
                    {hasResidentHeads
                      ? t('buildingUsers.assignment.selectHeadResident')
                      : t('buildingUsers.assignment.noHeadResidents')}
                  </option>
                  {assignmentOptions.residentHeads.map((residentHead) => (
                    <option key={residentHead.id} value={residentHead.id}>
                      {residentHead.fullName} - {residentHead.email}
                    </option>
                  ))}
                </select>

                <label htmlFor="buildingUserRoomId">{t('buildingUsers.assignment.room')}</label>
                <select
                  id="buildingUserRoomId"
                  name="roomId"
                  value={assignmentForm.roomId}
                  onChange={handleAssignmentChange}
                  required
                  disabled={!hasRooms}
                >
                  <option value="">
                    {hasRooms ? t('buildingUsers.assignment.selectRoom') : t('buildingUsers.assignment.noRooms')}
                  </option>
                  {assignmentOptions.rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {formatRoomLabel(room)}
                    </option>
                  ))}
                </select>

                <div className="form-grid">
                  <div>
                    <label htmlFor="buildingUserStartDate">{t('forms.assignment.startDate')}</label>
                    <input
                      id="buildingUserStartDate"
                      name="startDate"
                      type="date"
                      lang="en-GB"
                      value={assignmentForm.startDate}
                      onChange={handleAssignmentChange}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="buildingUserEndDate">{t('forms.assignment.endDate')}</label>
                    <input
                      id="buildingUserEndDate"
                      name="endDate"
                      type="date"
                      lang="en-GB"
                      value={assignmentForm.endDate}
                      onChange={handleAssignmentChange}
                      required
                    />
                  </div>
                </div>

                <div className="confirm-dialog-actions">
                  <button className="secondary-button inline-button" type="button" onClick={handleCloseAssignment}>
                    {t('common.cancel')}
                  </button>
                  <button type="submit" disabled={assignmentSubmitting || !hasResidentHeads || !hasRooms}>
                    {assignmentSubmitting ? t('forms.assignment.assigning') : t('forms.assignment.submit')}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function toExportRow({ record, index, recordType, headResidentName, t }) {
  return {
    [t('accountDirectory.columns.id')]: index,
    [t('buildingUsers.columns.recordType')]: recordType,
    [t('buildingUsers.columns.user')]: record.fullName || t('common.notProvided'),
    [t('accountDirectory.columns.email')]: record.email || t('common.notProvided'),
    [t('buildingUsers.columns.phone')]: record.phone || t('common.notProvided'),
    [t('buildingUsers.columns.room')]: formatRoomCode(record) || t('common.notProvided'),
    [t('buildingUsers.columns.relationship')]: record.relationship || t('common.notApplicable'),
    [t('tables.common.headResident')]: headResidentName || t('common.notApplicable'),
    [t('buildingUsers.columns.moveInDate')]: formatDisplayDate(record.moveInDate, t('common.notSet')),
    [t('buildingUsers.columns.status')]: formatStatus(record.status, t)
  };
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
