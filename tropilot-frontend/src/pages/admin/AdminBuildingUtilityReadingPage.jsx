import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';
import * as utilityReadingApi from '../../api/utilityReadingApi.js';
import PageHeader from '../../components/PageHeader.jsx';
import UtilityReadingForm from '../../components/UtilityReadingForm.jsx';
import UtilityReadingOverview from '../../components/UtilityReadingOverview.jsx';
import UtilityReadingTable from '../../components/UtilityReadingTable.jsx';
import { formatDisplayMonth } from '../../utils/dateFormat.js';
import { formatRoomCode } from '../../utils/roomDisplay.js';

export default function AdminBuildingUtilityReadingPage() {
  const { t } = useTranslation();
  const { building } = useOutletContext();
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [overview, setOverview] = useState(null);
  const [readings, setReadings] = useState([]);
  const [editingReading, setEditingReading] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const monthlyReadings = readings.filter((reading) => reading.month === selectedMonth);

  const loadData = async (month = selectedMonth) => {
    setError('');

    try {
      const [overviewResponse, readingsResponse] = await Promise.all([
        utilityReadingApi.getAdminUtilityReadingOverview({ buildingId: building.id, month }),
        utilityReadingApi.getAdminUtilityReadings({ buildingId: building.id })
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
      await utilityReadingApi.createUtilityReading({
        ...payload,
        buildingId: building.id
      });
      setMessage(t('buildingUtilityReadings.created'));
      setFormKey((current) => current + 1);
      await loadData(selectedMonth);
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
      await loadData(selectedMonth);
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('buildingUtilityReadings.updateError'));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (reading) => {
    setSelectedMonth(reading.month);
    setEditingReading(reading);
  };

  const renderActions = (reading) => (
    <div className="table-actions">
      <button className="secondary-button compact-button" type="button" onClick={() => handleEdit(reading)}>
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

      <UtilityReadingOverview
        month={selectedMonth}
        overview={overview}
        loading={loading}
        onMonthChange={setSelectedMonth}
      />

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
              key={editingReading?.id || `new-building-reading-${building.id}-${selectedMonth}-${formKey}`}
              rooms={editingReading ? [toRoomOption(editingReading)] : (overview?.eligibleRooms || [])}
              readings={readings}
              initialValues={editingReading}
              selectedMonth={selectedMonth}
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

          <UtilityReadingTable readings={monthlyReadings} renderActions={renderActions} />
        </section>
      )}
    </div>
  );
}

function getCurrentMonth() {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 7);
}

function toRoomOption(reading) {
  return {
    id: reading.roomId,
    roomCode: reading.roomCode,
    roomName: reading.roomName,
    buildingCode: reading.buildingCode
  };
}
