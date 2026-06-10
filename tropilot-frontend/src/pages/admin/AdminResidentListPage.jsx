import { Fragment, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import * as adminUserApi from '../../api/adminUserApi.js';
import * as buildingApi from '../../api/buildingApi.js';
import * as memberApi from '../../api/memberApi.js';
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
    .filter((user) => user.role === 'RESIDENT_HEAD' && user.assignedRoomId)
    .map((resident) => ({
      ...resident,
      members: approvedMembers.filter((member) => (
        member.residentHeadId === resident.id
        && member.roomId === resident.assignedRoomId
      ))
    }));
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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadResidents() {
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

        if (active) {
          setBuildings(buildingsResponse.data);
          setResidents(createResidentRecords(
            usersResponse.data,
            memberResponses.flatMap((response) => response.data)
          ));
        }
      } catch (apiError) {
        if (active) {
          setError(apiError.response?.data?.message || t('residentDirectory.messages.loadError'));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadResidents();
    return () => {
      active = false;
    };
  }, [t]);

  const filteredResidents = useMemo(
    () => filterResidents(residents, filters),
    [residents, filters]
  );

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  return (
    <section className="content-section resident-directory-page">
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
        <div className="table-wrap resident-directory-table-wrap">
          <table className="data-table resident-directory-table">
            <thead>
              <tr>
                <th>{t('residentDirectory.columns.id')}</th>
                <th>{t('residentDirectory.columns.login')}</th>
                <th>{t('residentDirectory.columns.fullName')}</th>
                <th>{t('residentDirectory.columns.household')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredResidents.map((resident) => (
                <Fragment key={resident.id}>
                  <tr className="resident-head-row">
                    <td className="resident-id-cell">{resident.id}</td>
                    <td>
                      <strong>{resident.email}</strong>
                      {resident.phone && <span className="table-subtext">{resident.phone}</span>}
                    </td>
                    <td>
                      <strong>{resident.fullName}</strong>
                      <span className="table-subtext">
                        {t('residentDirectory.memberCount', { count: resident.members.length })}
                      </span>
                    </td>
                    <td>
                      <strong>{formatRoom(resident, t)}</strong>
                      <span className="table-subtext">{t('residentDirectory.headResidentNote')}</span>
                    </td>
                  </tr>
                  {resident.members.length > 0 && (
                    <tr className="resident-member-row">
                      <td aria-hidden="true" />
                      <td colSpan="3">
                        <div className="household-member-strip">
                          <span className="household-member-label">
                            {t('residentDirectory.membersLabel')}
                          </span>
                          <div className="household-member-list">
                            {resident.members.map((member) => (
                              <span className="household-member-chip" key={member.id}>
                                <span className="household-member-avatar" aria-hidden="true">
                                  {member.fullName?.charAt(0)?.toUpperCase() || '?'}
                                </span>
                                <span>{member.fullName}</span>
                                <small>{member.relationship || t('residentDirectory.member')}</small>
                              </span>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
          {filteredResidents.length === 0 && (
            <div className="empty-state flat-empty-state">
              {t('residentDirectory.messages.empty')}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function formatRoom(resident, t) {
  const room = resident.assignedRoomCode || resident.assignedRoomName;
  const building = resident.assignedBuildingCode || resident.assignedBuildingName;

  if (!room) {
    return t('common.notAssigned');
  }

  return building ? `${room} · ${building}` : room;
}
