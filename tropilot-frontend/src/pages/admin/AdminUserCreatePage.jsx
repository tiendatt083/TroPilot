import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import * as adminUserApi from '../../api/adminUserApi.js';
import PageHeader from '../../components/PageHeader.jsx';

const ALLOWED_ROLES = new Set(['STAFF', 'RESIDENT_HEAD']);
const ALLOWED_RETURN_PATHS = new Set(['/admin/users', '/admin/residents']);

function createInitialForm(role) {
  return {
    fullName: '',
    email: '',
    phone: '',
    role: ALLOWED_ROLES.has(role) ? role : 'STAFF'
  };
}

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
  const [form, setForm] = useState(() => createInitialForm(requestedRole));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setForm(createInitialForm(requestedRole));
  }, [requestedRole]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
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

      <form className="panel-form" onSubmit={handleSubmit}>
        <label htmlFor="fullName">{t('userCreate.fields.fullName')}</label>
        <input
          id="fullName"
          name="fullName"
          value={form.fullName}
          onChange={handleChange}
          maxLength={120}
          required
        />

        <label htmlFor="email">{t('userCreate.fields.email')}</label>
        <input
          id="email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          maxLength={160}
          required
        />

        <label htmlFor="phone">{t('userCreate.fields.phone')}</label>
        <input
          id="phone"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          maxLength={30}
        />

        <label htmlFor="role">{t('userCreate.fields.role')}</label>
        <select
          id="role"
          name="role"
          value={form.role}
          onChange={handleChange}
          disabled={roleLocked}
        >
          <option value="STAFF">{t('userCreate.roles.staff')}</option>
          <option value="RESIDENT_HEAD">{t('userCreate.roles.residentHead')}</option>
        </select>

        <button type="submit" disabled={loading}>
          {loading ? t('userCreate.actions.creating') : t('userCreate.actions.create')}
        </button>
      </form>
    </section>
  );
}
