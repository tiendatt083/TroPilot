import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';
import * as roomApi from '../../api/roomApi.js';
import * as utilityReadingApi from '../../api/utilityReadingApi.js';
import PageHeader from '../../components/PageHeader.jsx';
import UtilityReadingForm from '../../components/UtilityReadingForm.jsx';
import UtilityReadingTable from '../../components/UtilityReadingTable.jsx';
import { formatDisplayMonth } from '../../utils/dateFormat.js';
import { isOccupiedRoom } from '../../utils/roomEligibility.js';
import { formatRoomCode } from '../../utils/roomDisplay.js';

export default function AdminBuildingUtilityReadingPage() {
  const { t } = useTranslation();
  const { building } = useOutletContext();
  const [rooms, setRooms] = useState([]);
  const [readings, setReadings] = useState([]);
  const [editingReading, setEditingReading] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const occupiedRooms = useMemo(() => rooms.filter(isOccupiedRoom), [rooms]);

  const loadData = async () => {
    setError('');

    try {
      const [roomsResponse, readingsResponse] = await Promise.all([
        roomApi.getAdminRooms({ buildingId: building.id }),
        utilityReadingApi.getAdminUtilityReadings({ buildingId: building.id })
      ]);
      setRooms(roomsResponse.data);
      setReadings(readingsResponse.data);
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('buildingUtilityReadings.loadError'));
    }
  };

  useEffect(() => {
    setLoading(true);
    setEditingReading(null);
    loadData().finally(() => setLoading(false));
  }, [building.id, t]);

  const handleCreate = async (payload) => {
    setSaving(true);
    setMessage('');
    setError('');

    try {
      await utilityReadingApi.createUtilityReading({
        ...payload,
        buildingId: building.id
      });
      setMessage(t('buildingUtilityReadings.created'));
      setFormKey((current) => current + 1);
      await loadData();
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('buildingUtilityReadings.createError'));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (payload) => {
    setSaving(true);
    setMessage('');
    setError('');

    try {
      await utilityReadingApi.updateAdminUtilityReading(editingReading.id, {
        ...payload,
        buildingId: building.id
      });
      setMessage(t('buildingUtilityReadings.updated'));
      setEditingReading(null);
      await loadData();
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('buildingUtilityReadings.updateError'));
    } finally {
      setSaving(false);
    }
  };

  const renderActions = (reading) => (
    <div className="table-actions">
      <button className="secondary-button compact-button" type="button" onClick={() => setEditingReading(reading)}>
        {t('common.edit')}
      </button>
    </div>
  );

  return (
    <div className="building-workspace">
      <PageHeader eyebrow={t('buildingUtilityReadings.eyebrow')} title={t('buildingUtilityReadings.title')} />
      <p className="page-support-text">{t('buildingUtilityReadings.description')}</p>

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">{t('buildingUtilityReadings.loading')}</div>
      ) : (
        <section className="utility-reading-workspace">
          <div>
            <PageHeader
              eyebrow={
                editingReading
                  ? t('buildingUtilityReadings.editReading')
                  : t('buildingUtilityReadings.newReading')
              }
              title={
                editingReading
                  ? `${formatRoomCode(editingReading)} - ${formatDisplayMonth(editingReading.month)}`
                  : t('buildingUtilityReadings.recordReading')
              }
            />
            <UtilityReadingForm
              key={editingReading?.id || `new-building-reading-${building.id}-${formKey}`}
              rooms={editingReading ? rooms : occupiedRooms}
              readings={readings}
              initialValues={editingReading}
              loading={saving}
              mode={editingReading ? 'edit' : 'create'}
              submitLabel={
                editingReading
                  ? t('buildingUtilityReadings.saveChanges')
                  : t('buildingUtilityReadings.recordReading')
              }
              onSubmit={editingReading ? handleUpdate : handleCreate}
              onCancel={editingReading ? () => setEditingReading(null) : undefined}
            />
          </div>

          <UtilityReadingTable readings={readings} renderActions={renderActions} />
        </section>
      )}
    </div>
  );
}
