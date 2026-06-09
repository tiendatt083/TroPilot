import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';
import * as utilityReadingApi from '../../api/utilityReadingApi.js';
import PageHeader from '../../components/PageHeader.jsx';
import UtilityReadingForm from '../../components/UtilityReadingForm.jsx';
import UtilityReadingOverview from '../../components/UtilityReadingOverview.jsx';
import UtilityReadingTable from '../../components/UtilityReadingTable.jsx';

export default function StaffBuildingUtilityReadingPage() {
  const { t } = useTranslation();
  const { building } = useOutletContext();
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [overview, setOverview] = useState(null);
  const [readings, setReadings] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const monthlyReadings = readings.filter((reading) => reading.month === selectedMonth);

  const loadData = async (month = selectedMonth) => {
    setError('');

    try {
      const [overviewResponse, readingsResponse] = await Promise.all([
        utilityReadingApi.getStaffUtilityReadingOverview({ buildingId: building.id, month }),
        utilityReadingApi.getStaffUtilityReadings({ buildingId: building.id })
      ]);
      setOverview(overviewResponse.data);
      setReadings(readingsResponse.data);
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('buildingUtilityReadings.loadError'));
    }
  };

  useEffect(() => {
    setLoading(true);
    loadData(selectedMonth).finally(() => setLoading(false));
  }, [building.id, selectedMonth, t]);

  const handleSubmit = async (payload) => {
    setSaving(true);
    setMessage('');
    setError('');

    try {
      await utilityReadingApi.createUtilityReading({
        ...payload,
        buildingId: building.id
      });
      setMessage(t('buildingUtilityReadings.created'));
      await loadData(selectedMonth);
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('buildingUtilityReadings.createError'));
    } finally {
      setSaving(false);
    }
  };

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
              eyebrow={t('buildingUtilityReadings.newReading')}
              title={t('buildingUtilityReadings.recordReading')}
            />
            <UtilityReadingForm
              key={`staff-building-reading-${building.id}-${selectedMonth}-${overview?.pendingRooms || 0}`}
              rooms={overview?.eligibleRooms || []}
              readings={readings}
              selectedMonth={selectedMonth}
              loading={saving}
              submitLabel={t('buildingUtilityReadings.recordReading')}
              onSubmit={handleSubmit}
            />
          </div>

          <UtilityReadingTable readings={monthlyReadings} />
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
