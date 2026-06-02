import { useEffect, useState } from 'react';
import * as roomApi from '../../api/roomApi.js';
import * as utilityReadingApi from '../../api/utilityReadingApi.js';
import PageHeader from '../../components/PageHeader.jsx';
import UtilityReadingForm from '../../components/UtilityReadingForm.jsx';
import UtilityReadingTable from '../../components/UtilityReadingTable.jsx';
import { formatDisplayMonth } from '../../utils/dateFormat.js';
import { formatRoomCode } from '../../utils/roomDisplay.js';

export default function AdminUtilityReadingPage() {
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
        roomApi.getAdminRooms(),
        utilityReadingApi.getAdminUtilityReadings()
      ]);
      setRooms(roomsResponse.data);
      setReadings(readingsResponse.data);
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Utility readings could not be loaded');
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
      await utilityReadingApi.updateAdminUtilityReading(editingReading.id, payload);
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
    <section className="content-section">
      <PageHeader eyebrow="Administrator" title="Utility readings" />

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">Loading utility readings...</div>
      ) : (
        <section className="utility-reading-workspace">
          <div>
            <PageHeader
              eyebrow={editingReading ? 'Edit reading' : 'New reading'}
              title={editingReading ? `${formatRoomCode(editingReading)} - ${formatDisplayMonth(editingReading.month)}` : 'Record reading'}
            />
            <UtilityReadingForm
              key={editingReading?.id || `new-reading-${formKey}`}
              rooms={rooms}
              readings={readings}
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
    </section>
  );
}
