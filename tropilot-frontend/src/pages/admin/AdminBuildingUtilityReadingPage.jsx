import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import * as roomApi from '../../api/roomApi.js';
import * as utilityReadingApi from '../../api/utilityReadingApi.js';
import PageHeader from '../../components/PageHeader.jsx';
import UtilityReadingForm from '../../components/UtilityReadingForm.jsx';
import UtilityReadingTable from '../../components/UtilityReadingTable.jsx';

export default function AdminBuildingUtilityReadingPage() {
  const { building } = useOutletContext();
  const [rooms, setRooms] = useState([]);
  const [readings, setReadings] = useState([]);
  const [editingReading, setEditingReading] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formKey, setFormKey] = useState(0);

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
      setError(apiError.response?.data?.message || 'Building utility readings could not be loaded');
    }
  };

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, [building.id]);

  const handleCreate = async (payload) => {
    setSaving(true);
    setMessage('');
    setError('');

    try {
      await utilityReadingApi.createUtilityReading({
        ...payload,
        buildingId: building.id
      });
      setMessage('Utility reading created successfully.');
      setFormKey((current) => current + 1);
      await loadData();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Utility reading could not be created');
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
      setMessage('Utility reading updated successfully.');
      setEditingReading(null);
      await loadData();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Utility reading could not be updated');
    } finally {
      setSaving(false);
    }
  };

  const renderActions = (reading) => (
    <div className="table-actions">
      <button className="secondary-button compact-button" type="button" onClick={() => setEditingReading(reading)}>
        Edit
      </button>
    </div>
  );

  return (
    <div className="building-workspace">
      <PageHeader eyebrow="Building utility readings" title="Utility readings in this building" />

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">Loading utility readings...</div>
      ) : (
        <section className="utility-reading-workspace">
          <div>
            <PageHeader
              eyebrow={editingReading ? 'Edit reading' : 'New reading'}
              title={editingReading ? `${editingReading.roomCode} - ${editingReading.month}` : 'Record reading'}
            />
            <UtilityReadingForm
              key={editingReading?.id || `new-building-reading-${building.id}-${formKey}`}
              rooms={rooms}
              initialValues={editingReading}
              loading={saving}
              mode={editingReading ? 'edit' : 'create'}
              submitLabel={editingReading ? 'Save changes' : 'Record reading'}
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
