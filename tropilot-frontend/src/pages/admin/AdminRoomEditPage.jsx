import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import * as buildingApi from '../../features/buildings/api.js';
import * as roomApi from '../../features/rooms/api.js';
import PageHeader from '../../components/PageHeader.jsx';
import RoomForm from '../../components/RoomForm.jsx';

export default function AdminRoomEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [buildings, setBuildings] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    Promise.all([roomApi.getAdminRoom(id), buildingApi.getAdminBuildings()])
      .then(([roomResponse, buildingResponse]) => {
        if (active) {
          setRoom(roomResponse.data);
          setBuildings(buildingResponse.data);
        }
      })
      .catch((apiError) => {
        if (active) {
          setError(apiError.response?.data?.message || 'Room could not be loaded');
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [id]);

  const handleSubmit = async (payload) => {
    setError('');
    setSaving(true);

    try {
      const response = await roomApi.updateAdminRoom(id, payload);
      navigate(`/admin/rooms/${response.data.id}`, {
        replace: true,
        state: { message: 'Room updated successfully.' }
      });
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Room could not be updated');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="empty-state">Loading room...</div>;
  }

  return (
    <section className="content-section narrow-section">
      <div className="page-title-row">
        <PageHeader eyebrow="Administrator" title="Edit room" />
        <Link className="secondary-link" to={`/admin/rooms/${id}`}>
          Back to details
        </Link>
      </div>

      {error && <div className="alert error-alert">{error}</div>}

      {room && (
        <RoomForm
          buildingOptions={buildings}
          initialValues={room}
          loading={saving}
          submitLabel="Save changes"
          onSubmit={handleSubmit}
        />
      )}
    </section>
  );
}
