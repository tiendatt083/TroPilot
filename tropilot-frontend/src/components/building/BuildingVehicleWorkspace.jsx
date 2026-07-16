import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';
import * as vehicleApi from '../../features/residents/vehicleApi.js';
import FilterBar from '../common/FilterBar.jsx';
import LineIcon from '../common/LineIcon.jsx';
import VehicleTable from '../VehicleTable.jsx';
import { formatEnumLabel } from '../../utils/i18nFormat.js';
import { normalizeSearchText } from '../../utils/searchText.js';

const emptyFilters = {
  search: '',
  status: ''
};

function hasVehicleActions(vehicle) {
  return vehicle.status === 'PENDING' || vehicle.status === 'ACTIVE';
}

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

  const handleAction = async (vehicle, action) => {
    setProcessingId(vehicle.id);
    setMessage('');
    setError('');

    try {
      if (action === 'approve') {
        await vehicleApi.approveVehicle(vehicle.id, buildingFilter);
        setMessage(t('workspace.vehicles.approved'));
      } else if (action === 'reject') {
        await vehicleApi.rejectVehicle(vehicle.id, buildingFilter);
        setMessage(t('workspace.vehicles.rejected'));
      } else {
        await vehicleApi.deactivateVehicle(vehicle.id, buildingFilter);
        setMessage(t('workspace.vehicles.deactivated'));
      }

      await loadVehicles();
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
                type="button"
                aria-label={t('workspace.vehicles.approve')}
                title={t('workspace.vehicles.approve')}
                disabled={processingId === vehicle.id}
                onClick={() => handleAction(vehicle, 'approve')}
              >
                <LineIcon name="checkShield" />
              </button>
              <button
                className="icon-action-button icon-action-danger"
                type="button"
                aria-label={t('workspace.vehicles.reject')}
                title={t('workspace.vehicles.reject')}
                disabled={processingId === vehicle.id}
                onClick={() => handleAction(vehicle, 'reject')}
              >
                <LineIcon name="close" />
              </button>
            </>
          )}
          {hasVehicleActions(vehicle) ? (
            <button
              className="icon-action-button"
              type="button"
              aria-label={t('workspace.vehicles.deactivate')}
              title={t('workspace.vehicles.deactivate')}
              disabled={processingId === vehicle.id}
              onClick={() => handleAction(vehicle, 'deactivate')}
            >
              <LineIcon name="lock" />
            </button>
          ) : (
            <span className="muted-text">{t('workspace.vehicles.noAction')}</span>
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
    </div>
  );
}
