import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import * as utilityReadingApi from '../../features/invoices/utilityReadingApi.js';
import * as roomApi from '../../features/rooms/api.js';
import PageHeader from '../../components/PageHeader.jsx';
import UtilityReadingForm from '../../components/UtilityReadingForm.jsx';
import { isOccupiedRoom } from '../../utils/roomEligibility.js';

export default function StaffUtilityReadingCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [readings, setReadings] = useState([]);
  const [error, setError] = useState('');
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const occupiedRooms = useMemo(() => rooms.filter(isOccupiedRoom), [rooms]);

  useEffect(() => {
    Promise.all([
      roomApi.getStaffRooms(),
      utilityReadingApi.getStaffUtilityReadings()
    ])
      .then(([roomsResponse, readingsResponse]) => {
        setRooms(roomsResponse.data);
        setReadings(readingsResponse.data);
      })
      .catch((apiError) => setError(apiError.response?.data?.message || t('utilityReadingManagement.roomsLoadError')))
      .finally(() => setLoadingData(false));
  }, []);

  const handleSubmit = async (payload) => {
    setSaving(true);
    setError('');

    try {
      await utilityReadingApi.createUtilityReading(payload);
      navigate('/staff/utility-readings', { replace: true });
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('utilityReadingManagement.createError'));
    } finally {
      setSaving(false);
    }
  };

  if (loadingData) {
    return <div className="empty-state">{t('utilityReadingManagement.loadingRooms')}</div>;
  }

  return (
    <section className="content-section narrow-section">
      <div className="page-title-row">
        <PageHeader eyebrow={t('role.staff')} title={t('utilityReadingManagement.recordTitle')} />
        <Link className="secondary-link" to="/staff/utility-readings">
          {t('utilityReadingManagement.back')}
        </Link>
      </div>

      {error && <div className="alert error-alert">{error}</div>}

      <UtilityReadingForm
        rooms={occupiedRooms}
        readings={readings}
        loading={saving}
        submitLabel={t('utilityReadingManagement.record')}
        onSubmit={handleSubmit}
      />
    </section>
  );
}
