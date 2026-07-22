import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';
import * as utilityReadingApi from '../../api/utilityReadingApi.js';
import ActionDialog from '../common/ActionDialog.jsx';
import LineIcon from '../common/LineIcon.jsx';
import UtilityReadingForm from '../UtilityReadingForm.jsx';
import UtilityReadingOverview from '../UtilityReadingOverview.jsx';
import UtilityReadingTable from '../UtilityReadingTable.jsx';
import { formatDisplayMonth, formatMonthInputValue } from '../../utils/dateFormat.js';
import { formatRoomCode } from '../../utils/roomDisplay.js';

export default function BuildingUtilityReadingWorkspace({
  getOverview,
  getReadings,
  canRecord = false,
  canEdit = false,
  updateReading
}) {
  const { t } = useTranslation();
  const { building } = useOutletContext();
  const [selectedMonth, setSelectedMonth] = useState(formatMonthInputValue());
  const [overview, setOverview] = useState(null);
  const [readings, setReadings] = useState([]);
  const [editingReading, setEditingReading] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formVersion, setFormVersion] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const monthlyReadings = readings.filter((reading) => reading.month === selectedMonth);

  const loadData = async (month = selectedMonth) => {
    setError('');

    try {
      const [overviewResponse, readingsResponse] = await Promise.all([
        getOverview({ buildingId: building.id, month }),
        getReadings({ buildingId: building.id })
      ]);
      setOverview(overviewResponse.data);
      setReadings(readingsResponse.data);
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('buildingUtilityReadings.loadError'));
    }
  };

  useEffect(() => {
    setLoading(true);
    setEditingReading(null);
    loadData(selectedMonth).finally(() => setLoading(false));
  }, [building.id, selectedMonth, t]);

  const handleCreate = async (payload) => {
    setSaving(true);
    setMessage('');
    setError('');

    try {
      await utilityReadingApi.createUtilityReading({ ...payload, buildingId: building.id });
      setMessage(t('buildingUtilityReadings.created'));
      setFormVersion((current) => current + 1);
      setFormOpen(false);
      await loadData(selectedMonth);
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('buildingUtilityReadings.createError'));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (payload) => {
    if (!updateReading || !editingReading) {
      return;
    }

    setSaving(true);
    setMessage('');
    setError('');

    try {
      await updateReading(editingReading.id, { ...payload, buildingId: building.id });
      setMessage(t('buildingUtilityReadings.updated'));
      setEditingReading(null);
      setFormOpen(false);
      await loadData(selectedMonth);
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('buildingUtilityReadings.updateError'));
    } finally {
      setSaving(false);
    }
  };

  const renderActions = canEdit
    ? (reading) => (
        <button
          className="icon-action-button"
          data-tooltip={t('common.edit')}
          type="button"
          aria-label={t('common.edit')}
          onClick={() => {
            setEditingReading(reading);
            setFormOpen(true);
          }}
        >
          <LineIcon name="edit" />
        </button>
      )
    : undefined;

  const formTitle = editingReading
    ? `${formatRoomCode(editingReading)} - ${formatDisplayMonth(editingReading.month)}`
    : t('buildingUtilityReadings.recordReading');

  const closeForm = () => {
    if (saving) {
      return;
    }

    setFormOpen(false);
    setEditingReading(null);
  };

  return (
    <div className="building-workspace">
      <div className="building-section-header">
        <span className="page-eyebrow">{t('buildingUtilityReadings.eyebrow')}</span>
        {canRecord && (
          <button
            className="button-link"
            type="button"
            onClick={() => {
              setEditingReading(null);
              setFormOpen(true);
            }}
          >
            {t('buildingUtilityReadings.recordReading')}
          </button>
        )}
      </div>

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      <UtilityReadingOverview
        month={selectedMonth}
        overview={overview}
        loading={loading}
        onMonthChange={setSelectedMonth}
      />

      {loading ? (
        <div className="empty-state">{t('buildingUtilityReadings.loading')}</div>
      ) : (
        <section className="utility-reading-workspace utility-reading-workspace-list-only">
          <UtilityReadingTable readings={monthlyReadings} renderActions={renderActions} />
        </section>
      )}

      <ActionDialog
        className="action-dialog-wide utility-reading-dialog"
        eyebrow={editingReading ? t('buildingUtilityReadings.editReading') : ''}
        labelledBy="utility-reading-dialog-title"
        open={formOpen}
        title={formTitle}
        onClose={closeForm}
      >
        <UtilityReadingForm
          key={editingReading?.id || `building-reading-${building.id}-${selectedMonth}-${formVersion}`}
          rooms={editingReading ? [toRoomOption(editingReading)] : (overview?.eligibleRooms || [])}
          readings={readings}
          initialValues={editingReading}
          selectedMonth={selectedMonth}
          loading={saving}
          mode={editingReading ? 'edit' : 'create'}
          onFetchElectricityReading={utilityReadingApi.fetchElectricityReadingPreview}
          onFetchWaterReading={utilityReadingApi.fetchWaterReadingPreview}
          submitLabel={
            editingReading ? t('buildingUtilityReadings.saveChanges') : t('buildingUtilityReadings.recordReading')
          }
          onSubmit={editingReading ? handleUpdate : handleCreate}
          onCancel={closeForm}
        />
      </ActionDialog>
    </div>
  );
}

function toRoomOption(reading) {
  return {
    id: reading.roomId,
    roomCode: reading.roomCode,
    roomName: reading.roomName,
    buildingCode: reading.buildingCode
  };
}
