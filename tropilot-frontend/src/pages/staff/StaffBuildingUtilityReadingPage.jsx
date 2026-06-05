import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import * as roomApi from '../../api/roomApi.js';
import * as utilityReadingApi from '../../api/utilityReadingApi.js';
import PageHeader from '../../components/PageHeader.jsx';
import UtilityReadingForm from '../../components/UtilityReadingForm.jsx';
import UtilityReadingTable from '../../components/UtilityReadingTable.jsx';
import { isOccupiedRoom } from '../../utils/roomEligibility.js';

export default function StaffBuildingUtilityReadingPage() {
  const { building } = useOutletContext();
  const [rooms, setRooms] = useState([]);
  const [readings, setReadings] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const occupiedRooms = useMemo(() => rooms.filter(isOccupiedRoom), [rooms]);

  const buildingFilter = { buildingId: building.id };

  const loadData = async () => {
    setError('');

    try {
      const [roomsResponse, readingsResponse] = await Promise.all([
        roomApi.getStaffRooms(buildingFilter),
        utilityReadingApi.getStaffUtilityReadings(buildingFilter)
      ]);
      setRooms(roomsResponse.data);
      setReadings(readingsResponse.data);
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Utility readings could not be loaded');
    }
  };

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, [building.id]);

  const handleSubmit = async (payload) => {
    setSaving(true);
    setMessage('');
    setError('');

    try {
      await utilityReadingApi.createUtilityReading({
        ...payload,
        buildingId: building.id
      });
      setMessage('Utility reading recorded successfully.');
      await loadData();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Utility reading could not be created');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="building-workspace split-workspace">
      <section>
        <PageHeader eyebrow="Reading entry" title="Record reading" />
        {message && <div className="alert success-alert">{message}</div>}
        {error && <div className="alert error-alert">{error}</div>}
        {loading ? (
          <div className="empty-state">Loading rooms...</div>
        ) : (
          <UtilityReadingForm
            rooms={occupiedRooms}
            readings={readings}
            loading={saving}
            submitLabel="Record reading"
            onSubmit={handleSubmit}
          />
        )}
      </section>

      <section>
        <PageHeader eyebrow="Billing records" title="Utility readings" />
        {loading ? <div className="empty-state">Loading readings...</div> : <UtilityReadingTable readings={readings} />}
      </section>
    </div>
  );
}
