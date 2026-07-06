import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as utilityReadingApi from '../../features/invoices/utilityReadingApi.js';
import * as roomApi from '../../features/rooms/api.js';
import ActionDialog from '../../components/common/ActionDialog.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import UtilityReadingForm from '../../components/UtilityReadingForm.jsx';
import UtilityReadingTable from '../../components/UtilityReadingTable.jsx';
import { formatDisplayMonth } from '../../utils/dateFormat.js';
import { isOccupiedRoom } from '../../utils/roomEligibility.js';
import { formatRoomCode } from '../../utils/roomDisplay.js';

export default function AdminUtilityReadingPage() {
  const { t } = useTranslation();
  const [rooms, setRooms] = useState([]);
  const [readings, setReadings] = useState([]);
  const [editingReading, setEditingReading] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const occupiedRooms = useMemo(() => rooms.filter(isOccupiedRoom), [rooms]);

  const loadData = async () => {
    setError('');

    try {
      const [roomsResponse, readingsResponse] = await Promise.all([
        roomApi.getAdminRooms(),
        utilityReadingApi.getAdminUtilityReadings()
      ]);
      setRooms(roomsResponse.data);
      setReadings(readingsResponse.data);
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('utilityReadingManagement.loadError'));
    }
  };

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, []);

  const handleCreate = async (payload) => {
    setSaving(true);
    setMessage('');
    setError('');

    try {
      await utilityReadingApi.createUtilityReading(payload);
      setMessage(t('utilityReadingManagement.created'));
      setFormKey((current) => current + 1);
      setFormOpen(false);
      await loadData();
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('utilityReadingManagement.createError'));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (payload) => {
    setSaving(true);
    setMessage('');
    setError('');

    try {
      await utilityReadingApi.updateAdminUtilityReading(editingReading.id, payload);
      setMessage(t('utilityReadingManagement.updated'));
      setEditingReading(null);
      setFormOpen(false);
      await loadData();
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('utilityReadingManagement.updateError'));
    } finally {
      setSaving(false);
    }
  };

  const renderActions = (reading) => (
    <div className="table-actions">
      <button
        className="secondary-button compact-button"
        type="button"
        onClick={() => {
          setEditingReading(reading);
          setFormOpen(true);
        }}
      >
        {t('utilityReadingManagement.edit')}
      </button>
    </div>
  );

  const formTitle = editingReading
    ? `${formatRoomCode(editingReading)} - ${formatDisplayMonth(editingReading.month)}`
    : t('utilityReadingManagement.record');

  return (
    <section className="content-section">
      <PageHeader
        eyebrow={t('role.admin')}
        title={t('utilityReadingManagement.title')}
        actions={
          <button
            className="button-link"
            type="button"
            onClick={() => {
              setEditingReading(null);
              setFormOpen(true);
            }}
          >
            {t('utilityReadingManagement.record')}
          </button>
        }
      />

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">{t('utilityReadingManagement.loading')}</div>
      ) : (
        <section className="utility-reading-workspace utility-reading-workspace-list-only">
          <UtilityReadingTable readings={readings} renderActions={renderActions} />
        </section>
      )}

      <ActionDialog
        className="action-dialog-wide"
        eyebrow={editingReading ? t('utilityReadingManagement.editReading') : t('utilityReadingManagement.newReading')}
        labelledBy="admin-utility-reading-dialog-title"
        open={formOpen}
        title={formTitle}
        onClose={() => {
          if (!saving) {
            setFormOpen(false);
            setEditingReading(null);
          }
        }}
      >
        <UtilityReadingForm
          key={editingReading?.id || `new-reading-${formKey}`}
          rooms={editingReading ? rooms : occupiedRooms}
          readings={readings}
          initialValues={editingReading}
          loading={saving}
          mode={editingReading ? 'edit' : 'create'}
          onFetchElectricityReading={utilityReadingApi.fetchElectricityReadingPreview}
          onFetchWaterReading={utilityReadingApi.fetchWaterReadingPreview}
          submitLabel={editingReading ? t('buildingManagement.saveChanges') : t('utilityReadingManagement.record')}
          onSubmit={editingReading ? handleUpdate : handleCreate}
          onCancel={editingReading ? () => {
            setFormOpen(false);
            setEditingReading(null);
          } : undefined}
        />
      </ActionDialog>
    </section>
  );
}
