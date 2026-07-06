import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as buildingApi from '../../features/buildings/api.js';
import * as roomApi from '../../features/rooms/api.js';
import PageHeader from '../../components/PageHeader.jsx';
import RoomForm from '../../components/RoomForm.jsx';
import { translateInterfaceText } from '../../utils/interfaceTranslations.js';

export default function AdminRoomCreatePage() {
  useTranslation();
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
          setError(translateInterfaceText(apiError.response?.data?.message || 'Buildings could not be loaded'));
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
        state: { message: translateInterfaceText('Room created successfully.') }
      });
    } catch (apiError) {
      setError(translateInterfaceText(apiError.response?.data?.message || 'Room could not be created'));
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
        <PageHeader eyebrow={translateInterfaceText('Administrator')} title={translateInterfaceText('Create room')} />
        <Link className="secondary-link" to={selectedBuildingId ? `/admin/buildings/${selectedBuildingId}/rooms` : '/admin/rooms'}>
          {translateInterfaceText('Back to rooms')}
        </Link>
      </div>

      {error && <div className="alert error-alert">{error}</div>}
      {!loadingBuildings && buildings.length === 0 && (
        <div className="alert error-alert">{translateInterfaceText('Create a building before creating rooms.')}</div>
      )}

      {loadingBuildings ? (
        <div className="empty-state">{translateInterfaceText('Loading buildings...')}</div>
      ) : (
        <RoomForm
          buildingOptions={buildings}
          initialValues={initialRoomValues}
          loading={loading}
          submitLabel={translateInterfaceText('Create room')}
          onSubmit={handleSubmit}
        />
      )}
    </section>
  );
}
