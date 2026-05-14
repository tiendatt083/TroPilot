import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import * as serviceFeeApi from '../../api/serviceFeeApi.js';
import PageHeader from '../../components/PageHeader.jsx';
import ServiceFeeForm from '../../components/ServiceFeeForm.jsx';

export default function AdminServiceFeeEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [serviceFee, setServiceFee] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    serviceFeeApi
      .getAdminServiceFee(id)
      .then((response) => {
        if (active) {
          setServiceFee(response.data);
        }
      })
      .catch((apiError) => {
        if (active) {
          setError(apiError.response?.data?.message || 'Service fee could not be loaded');
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
      await serviceFeeApi.updateAdminServiceFee(id, payload);
      navigate('/admin/service-fees', {
        replace: true,
        state: { message: 'Service fee updated successfully.' }
      });
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Service fee could not be updated');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="empty-state">Loading service fee...</div>;
  }

  return (
    <section className="content-section narrow-section">
      <div className="page-title-row">
        <PageHeader eyebrow="Administrator" title="Edit service fee" />
        <Link className="secondary-link" to="/admin/service-fees">
          Back to service fees
        </Link>
      </div>

      {error && <div className="alert error-alert">{error}</div>}

      {serviceFee && (
        <ServiceFeeForm
          initialValues={serviceFee}
          loading={saving}
          submitLabel="Save changes"
          onSubmit={handleSubmit}
        />
      )}
    </section>
  );
}
