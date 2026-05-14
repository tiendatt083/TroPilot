import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as roomApi from '../../api/roomApi.js';
import * as utilityReadingApi from '../../api/utilityReadingApi.js';
import PageHeader from '../../components/PageHeader.jsx';
import UtilityReadingForm from '../../components/UtilityReadingForm.jsx';

export default function StaffUtilityReadingCreatePage() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState('');
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    roomApi
      .getStaffRooms()
      .then((response) => setRooms(response.data))
      .catch((apiError) => setError(apiError.response?.data?.message || 'Rooms could not be loaded'))
      .finally(() => setLoadingRooms(false));
  }, []);

  const handleSubmit = async (payload) => {
    setSaving(true);
    setError('');

    try {
      await utilityReadingApi.createUtilityReading(payload);
      navigate('/staff/utility-readings', { replace: true });
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Utility reading could not be created');
    } finally {
      setSaving(false);
    }
  };

  if (loadingRooms) {
    return <div className="empty-state">Loading rooms...</div>;
  }

  return (
    <section className="content-section narrow-section">
      <div className="page-title-row">
        <PageHeader eyebrow="Operations staff" title="Record utility reading" />
        <Link className="secondary-link" to="/staff/utility-readings">
          Back to readings
        </Link>
      </div>

      {error && <div className="alert error-alert">{error}</div>}

      <UtilityReadingForm
        rooms={rooms}
        loading={saving}
        submitLabel="Record reading"
        onSubmit={handleSubmit}
      />
    </section>
  );
}
