import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as buildingApi from '../../api/buildingApi.js';
import BuildingForm from '../../components/BuildingForm.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import { translateInterfaceText } from '../../utils/interfaceTranslations.js';

/** Trang chỉnh sửa thông tin cơ bản của một tòa nhà. */
export default function AdminBuildingEditPage() {
  useTranslation();
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
          setError(translateInterfaceText(apiError.response?.data?.message || 'Building could not be loaded'));
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
        state: { message: translateInterfaceText('Building updated successfully.') }
      });
    } catch (apiError) {
      setError(translateInterfaceText(apiError.response?.data?.message || 'Building could not be updated'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="empty-state">{translateInterfaceText('Loading building...')}</div>;
  }

  return (
    <section className="content-section narrow-section">
      <div className="page-title-row">
        <PageHeader eyebrow={translateInterfaceText('Administrator')} title={translateInterfaceText('Edit building')} />
        <Link className="secondary-link" to={`/admin/buildings/${id}`}>
          {translateInterfaceText('Back to details')}
        </Link>
      </div>

      {error && <div className="alert error-alert">{error}</div>}

      {building && (
        <BuildingForm
          initialValues={building}
          loading={saving}
          submitLabel={translateInterfaceText('Save changes')}
          onSubmit={handleSubmit}
        />
      )}
    </section>
  );
}
