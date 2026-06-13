import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import * as buildingApi from '../../features/buildings/api.js';
import * as roomApi from '../../features/rooms/api.js';
import PageHeader from '../../components/PageHeader.jsx';
import RoomForm from '../../components/RoomForm.jsx';

export default function AdminRoomCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedBuildingId = searchParams.get('buildingId') || '';
  const [buildings, setBuildings] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingBuildings, setLoadingBuildings] = useState(true);

  useEffect(() => {
    let active = true;

    buildingApi
      .getAdminBuildings()
      .then((response) => {
        if (active) {
          setBuildings(response.data);
        }
      })
      .catch((apiError) => {
        if (active) {
          setError(apiError.response?.data?.message || 'Buildings could not be loaded');
        }
      })
      .finally(() => {
        if (active) {
          setLoadingBuildings(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (payload) => {
    setError('');
    setLoading(true);

    try {
      const response = await roomApi.createAdminRoom(payload);
      navigate(selectedBuildingId ? `/admin/buildings/${selectedBuildingId}/rooms` : `/admin/rooms/${response.data.id}`, {
        replace: true,
        state: { message: 'Room created successfully.' }
      });
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Room could not be created');
    } finally {
      setLoading(false);
    }
  };

  const initialRoomValues = useMemo(
    () => (selectedBuildingId ? { buildingId: selectedBuildingId } : undefined),
    [selectedBuildingId]
  );

  return (
    <section className="content-section narrow-section">
      <div className="page-title-row">
        <PageHeader eyebrow="Administrator" title="Create room" />
        <Link className="secondary-link" to={selectedBuildingId ? `/admin/buildings/${selectedBuildingId}/rooms` : '/admin/rooms'}>
          Back to rooms
        </Link>
      </div>

      {error && <div className="alert error-alert">{error}</div>}
      {!loadingBuildings && buildings.length === 0 && (
        <div className="alert error-alert">Create a building before creating rooms.</div>
      )}

      {loadingBuildings ? (
        <div className="empty-state">Loading buildings...</div>
      ) : (
        <RoomForm
          buildingOptions={buildings}
          initialValues={initialRoomValues}
          loading={loading}
          submitLabel="Create room"
          onSubmit={handleSubmit}
        />
      )}
    </section>
  );
}
