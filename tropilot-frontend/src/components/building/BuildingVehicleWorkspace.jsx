import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';
import * as memberApi from '../../api/memberApi.js';
import * as roomApi from '../../api/roomApi.js';
import * as vehicleApi from '../../api/vehicleApi.js';
import AdminVehicleForm from '../AdminVehicleForm.jsx';
import ActionDialog from '../common/ActionDialog.jsx';
import FilterBar from '../common/FilterBar.jsx';
import LineIcon from '../common/LineIcon.jsx';
import VehicleTable from '../VehicleTable.jsx';
import { formatEnumLabel } from '../../utils/i18nFormat.js';
import { normalizeSearchText } from '../../utils/searchText.js';

const emptyFilters = {
  search: '',
  status: ''
};

function vehicleMatchesSearch(vehicle, searchValue) {
  if (!searchValue) {
    return true;
  }

  const searchableValues = [
    vehicle.licensePlate,
    vehicle.vehicleType,
    vehicle.roomCode,
    vehicle.roomName,
    vehicle.ownerName,
    vehicle.ownerType,
    vehicle.brand,
    vehicle.color,
    vehicle.status,
    vehicle.startDate,
    vehicle.endDate
  ];

  return searchableValues.some((value) => normalizeSearchText(value).includes(searchValue));
}

export default function BuildingVehicleWorkspace({ getVehicles, canManage = false }) {
  const { t } = useTranslation();
  const { building } = useOutletContext();
  const [vehicles, setVehicles] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [filters, setFilters] = useState(emptyFilters);
  const [formOpen, setFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formOptionsLoading, setFormOptionsLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [members, setMembers] = useState([]);

  const buildingFilter = { buildingId: building.id };
  const filteredVehicles = useMemo(() => {
    const searchValue = normalizeSearchText(filters.search);

    return vehicles.filter((vehicle) => (
      vehicleMatchesSearch(vehicle, searchValue)
      && (!filters.status || vehicle.status === filters.status)
    ));
  }, [filters, vehicles]);
  const vehicleStatusOptions = useMemo(() => (
    Array.from(new Set(vehicles.map((vehicle) => vehicle.status).filter(Boolean)))
  ), [vehicles]);

  const loadVehicles = async () => {
    setError('');

    try {
      const response = await getVehicles(buildingFilter);
      setVehicles(response.data);
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('workspace.vehicles.loadError'));
    }
  };

  useEffect(() => {
    setLoading(true);
    loadVehicles().finally(() => setLoading(false));
  }, [building.id]);

  const loadFormOptions = async () => {
    setFormOptionsLoading(true);
    setFormError('');

    try {
      const [roomsResponse, membersResponse] = await Promise.all([
        roomApi.getAdminRooms({ ...buildingFilter, status: 'OCCUPIED' }),
        memberApi.getAdminBuildingMembers(buildingFilter)
      ]);

      const assignmentResponses = await Promise.all(
        roomsResponse.data.map((room) => (
          roomApi.getHeadResidentAssignment(room.id)
            .then((response) => response.data)
            .catch(() => null)
        ))
      );

      setAssignments(assignmentResponses.filter((assignment) => assignment?.assigned));
      setMembers(membersResponse.data.filter((member) => member.status === 'APPROVED'));
    } catch (apiError) {
      setFormError(apiError.response?.data?.message || t('workspace.vehicles.formLoadError'));
      setAssignments([]);
      setMembers([]);
    } finally {
      setFormOptionsLoading(false);
    }
  };

  const handleOpenForm = () => {
    setFormOpen(true);
    setFormError('');
    loadFormOptions();
  };

  const handleCloseForm = () => {
    if (formLoading || formOptionsLoading) {
      return;
    }

    setFormOpen(false);
    setFormError('');
  };

  const handleCreateVehicle = async (payload) => {
    setFormLoading(true);
    setFormError('');
    setMessage('');
    setError('');

    try {
      const response = await vehicleApi.createAdminVehicle(payload, buildingFilter);
      setVehicles((current) => [response.data, ...current.filter((vehicle) => vehicle.id !== response.data.id)]);
      setMessage(t('workspace.vehicles.created'));
      setFormOpen(false);
    } catch (apiError) {
      setFormError(apiError.response?.data?.message || t('workspace.vehicles.createError'));
    } finally {
      setFormLoading(false);
    }
  };

  const handleAction = async (vehicle, action) => {
    if (
      action === 'delete'
      && !window.confirm(t('workspace.vehicles.deleteConfirm', { plate: vehicle.licensePlate }))
    ) {
      return;
    }

    setProcessingId(vehicle.id);
    setMessage('');
    setError('');

    try {
      if (action === 'approve') {
        const response = await vehicleApi.approveVehicle(vehicle.id, buildingFilter);
        setVehicles((current) => current.map((item) => (item.id === vehicle.id ? response.data : item)));
        setMessage(t('workspace.vehicles.approved'));
      } else if (action === 'reject') {
        const response = await vehicleApi.rejectVehicle(vehicle.id, buildingFilter);
        setVehicles((current) => current.map((item) => (item.id === vehicle.id ? response.data : item)));
        setMessage(t('workspace.vehicles.rejected'));
      } else if (action === 'delete') {
        await vehicleApi.deleteVehicle(vehicle.id, buildingFilter);
        setVehicles((current) => current.filter((item) => item.id !== vehicle.id));
        setMessage(t('workspace.vehicles.deleted'));
      }
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('workspace.vehicles.actionError'));
    } finally {
      setProcessingId(null);
    }
  };

  const renderActions = canManage
    ? (vehicle) => (
        <div className="table-actions">
          {vehicle.status === 'PENDING' && (
            <>
              <button
                className="icon-action-button icon-action-success"
                data-tooltip={t('workspace.vehicles.approve')}
                type="button"
                aria-label={t('workspace.vehicles.approve')}
                disabled={processingId === vehicle.id}
                onClick={() => handleAction(vehicle, 'approve')}
              >
                <LineIcon name="checkShield" />
              </button>
              <button
                className="icon-action-button icon-action-danger"
                data-tooltip={t('workspace.vehicles.reject')}
                type="button"
                aria-label={t('workspace.vehicles.reject')}
                disabled={processingId === vehicle.id}
                onClick={() => handleAction(vehicle, 'reject')}
              >
                <LineIcon name="close" />
              </button>
            </>
          )}
          {(vehicle.status === 'ACTIVE' || vehicle.status === 'REJECTED') && (
            <button
              className="icon-action-button icon-action-danger"
              data-tooltip={t('workspace.vehicles.delete')}
              type="button"
              aria-label={t('workspace.vehicles.delete')}
              disabled={processingId === vehicle.id}
              onClick={() => handleAction(vehicle, 'delete')}
            >
              <LineIcon name="trash" />
            </button>
          )}
        </div>
      )
    : undefined;

  const handleClearFilters = () => {
    setFilters(emptyFilters);
  };

  return (
    <div className="building-workspace">
      <div className="building-section-header">
        <span className="page-eyebrow">{t('workspace.vehicles.eyebrow')}</span>
        {canManage && (
          <button className="button-link vehicle-add-button" type="button" onClick={handleOpenForm}>
            <LineIcon name="plus" />
            {t('workspace.vehicles.add')}
          </button>
        )}
      </div>
      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}
      {loading ? (
        <div className="empty-state">{t('workspace.vehicles.loading')}</div>
      ) : (
        <>
          <FilterBar
            as="div"
            className="workspace-filter-row"
            searchAriaLabel={t('workspace.filters.searchAria')}
            searchPlaceholder={t('workspace.filters.searchPlaceholder')}
            searchValue={filters.search}
            filters={[
              {
                name: 'status',
                value: filters.status,
                ariaLabel: t('workspace.filters.statusAria'),
                onChange: (value) => setFilters((current) => ({ ...current, status: value })),
                options: [
                  { value: '', label: t('workspace.filters.allStatuses') },
                  ...vehicleStatusOptions.map((status) => ({
                    value: status,
                    label: formatEnumLabel(t, 'vehicleStatus', status)
                  }))
                ]
              }
            ]}
            clearLabel={t('common.clear')}
            onClear={handleClearFilters}
            onSearchChange={(value) => setFilters((current) => ({ ...current, search: value }))}
          />
          <VehicleTable vehicles={filteredVehicles} renderActions={renderActions} variant="building" />
        </>
      )}

      <ActionDialog
        className="vehicle-create-dialog"
        eyebrow={t('workspace.vehicles.eyebrow')}
        labelledBy="vehicle-create-dialog-title"
        open={formOpen}
        title={t('workspace.vehicles.addTitle')}
        onClose={handleCloseForm}
      >
        {formError && <div className="alert error-alert">{formError}</div>}
        {formOptionsLoading ? (
          <div className="empty-state">{t('workspace.vehicles.formLoading')}</div>
        ) : (
          <AdminVehicleForm
            assignments={assignments}
            loading={formLoading}
            members={members}
            onCancel={handleCloseForm}
            onSubmit={handleCreateVehicle}
          />
        )}
      </ActionDialog>
    </div>
  );
}
