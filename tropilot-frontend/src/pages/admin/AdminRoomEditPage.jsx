import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as buildingApi from '../../features/buildings/api.js';
import * as roomApi from '../../features/rooms/api.js';
import useRoomRouteContext from '../../features/rooms/useRoomRouteContext.js';
import PageHeader from '../../components/PageHeader.jsx';
import RoomForm from '../../components/RoomForm.jsx';
import { translateInterfaceText } from '../../utils/interfaceTranslations.js';

export default function AdminRoomEditPage() {
  useTranslation();
  const { roomBasePath, roomId } = useRoomRouteContext('admin');
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [buildings, setBuildings] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    Promise.all([roomApi.getAdminRoom(roomId), buildingApi.getAdminBuildings()])
      .then(([roomResponse, buildingResponse]) => {
        if (active) {
          setRoom(roomResponse.data);
          setBuildings(buildingResponse.data);
        }
      })
      .catch((apiError) => {
        if (active) {
          setError(translateInterfaceText(apiError.response?.data?.message || 'Room could not be loaded'));
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
  }, [roomId]);

  const handleSubmit = async (payload) => {
    setError('');
    setSaving(true);

    try {
      const response = await roomApi.updateAdminRoom(roomId, payload);
      navigate(`${roomBasePath}/${response.data.id}`, {
        replace: true,
        state: { message: translateInterfaceText('Room updated successfully.') }
      });
    } catch (apiError) {
      setError(translateInterfaceText(apiError.response?.data?.message || 'Room could not be updated'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="empty-state">{translateInterfaceText('Loading room...')}</div>;
  }

  return (
    <section className="content-section narrow-section">
      <div className="page-title-row">
        <PageHeader eyebrow={translateInterfaceText('Administrator')} title={translateInterfaceText('Edit room')} />
        <Link className="secondary-link" to={`${roomBasePath}/${roomId}`}>
          {translateInterfaceText('Back to details')}
        </Link>
      </div>

      {error && <div className="alert error-alert">{error}</div>}

      {room && (
        <RoomForm
          buildingOptions={buildings}
          initialValues={room}
          lockBuilding
          loading={saving}
          submitLabel={translateInterfaceText('Save')}
          onSubmit={handleSubmit}
        />
      )}
    </section>
  );
}
