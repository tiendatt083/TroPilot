import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import * as buildingApi from '../../api/buildingApi.js';
import BuildingForm from '../../components/BuildingForm.jsx';
import PageHeader from '../../components/PageHeader.jsx';

export default function AdminBuildingEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [building, setBuilding] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    buildingApi
      .getAdminBuilding(id)
      .then((response) => {
        if (active) {
          setBuilding(response.data);
        }
      })
      .catch((apiError) => {
        if (active) {
          setError(apiError.response?.data?.message || 'Building could not be loaded');
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
      const response = await buildingApi.updateAdminBuilding(id, payload);
      navigate(`/admin/buildings/${response.data.id}`, {
        replace: true,
        state: { message: 'Building updated successfully.' }
      });
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Building could not be updated');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="empty-state">Loading building...</div>;
  }

  return (
    <section className="content-section narrow-section">
      <div className="page-title-row">
        <PageHeader eyebrow="Administrator" title="Edit building" />
        <Link className="secondary-link" to={`/admin/buildings/${id}`}>
          Back to details
        </Link>
      </div>

      {error && <div className="alert error-alert">{error}</div>}

      {building && (
        <BuildingForm
          initialValues={building}
          loading={saving}
          submitLabel="Save changes"
          onSubmit={handleSubmit}
        />
      )}
    </section>
  );
}
