import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as buildingApi from '../../api/buildingApi.js';
import BuildingForm from '../../components/BuildingForm.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';

/** Trang tạo mới tòa nhà cho quản trị viên. */
export default function AdminBuildingCreatePage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (payload) => {
    setError('');
    setLoading(true);

    try {
      const response = await buildingApi.createAdminBuilding(payload);
      navigate(`/admin/buildings/${response.data.id}`, {
        replace: true,
        state: { message: 'Building created successfully.' }
      });
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Building could not be created');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="content-section narrow-section">
      <div className="page-title-row">
        <PageHeader eyebrow="Administrator" title="Create building" />
        <Link className="secondary-link" to="/admin/buildings">
          Back to buildings
        </Link>
      </div>

      {error && <div className="alert error-alert">{error}</div>}

      <BuildingForm loading={loading} submitLabel="Create building" onSubmit={handleSubmit} />
    </section>
  );
}
