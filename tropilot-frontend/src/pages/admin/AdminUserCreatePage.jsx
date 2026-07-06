import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import * as adminUserApi from '../../features/users/api.js';
import PageHeader from '../../components/PageHeader.jsx';
import AdminUserCreateForm from '../../components/AdminUserCreateForm.jsx';

const ALLOWED_ROLES = new Set(['STAFF', 'RESIDENT_HEAD']);
const ALLOWED_RETURN_PATHS = new Set(['/admin/users', '/admin/residents']);

export default function AdminUserCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedRole = searchParams.get('role');
  const requestedReturnPath = searchParams.get('returnTo');
  const roleLocked = ALLOWED_ROLES.has(requestedRole);
  const returnPath = ALLOWED_RETURN_PATHS.has(requestedReturnPath)
    ? requestedReturnPath
    : '/admin/users';
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (form) => {
    setError('');
    setLoading(true);

    try {
      await adminUserApi.createUser(form);
      navigate(returnPath, { replace: true });
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('userCreate.messages.createError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="content-section narrow-section">
      <div className="page-title-row">
        <PageHeader
          eyebrow={t('userCreate.eyebrow')}
          title={t('userCreate.title')}
        />
        <Link className="secondary-link" to={returnPath}>
          {returnPath === '/admin/residents'
            ? t('userCreate.backToResidents')
            : t('userCreate.backToUsers')}
        </Link>
      </div>

      {error && <div className="alert error-alert">{error}</div>}

      <div className="panel-form">
        <AdminUserCreateForm
          formIdPrefix="adminUserCreatePage"
          initialRole={requestedRole}
          loading={loading}
          roleLocked={roleLocked}
          onSubmit={handleSubmit}
        />
      </div>
    </section>
  );
}
