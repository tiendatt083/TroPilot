import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as serviceFeeApi from '../../api/serviceFeeApi.js';
import PageHeader from '../../components/PageHeader.jsx';
import ServiceFeeForm from '../../components/ServiceFeeForm.jsx';

export default function AdminServiceFeeCreatePage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (payload) => {
    setError('');
    setLoading(true);

    try {
      await serviceFeeApi.createAdminServiceFee(payload);
      navigate('/admin/service-fees', {
        replace: true,
        state: { message: 'Service fee created successfully.' }
      });
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Service fee could not be created');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="content-section narrow-section">
      <div className="page-title-row">
        <PageHeader eyebrow="Administrator" title="Create service fee" />
        <Link className="secondary-link" to="/admin/service-fees">
          Back to service fees
        </Link>
      </div>

      {error && <div className="alert error-alert">{error}</div>}

      <ServiceFeeForm loading={loading} submitLabel="Create service fee" onSubmit={handleSubmit} />
    </section>
  );
}
