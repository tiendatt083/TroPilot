import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageHeader from '../components/PageHeader.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const initialForm = {
  fullName: '',
  phone: ''
};

function getRoleLabel(t, role) {
  if (!role) {
    return t('common.notAvailable');
  }

  if (role === 'ADMIN') {
    return t('role.admin');
  }

  if (role === 'STAFF') {
    return t('role.staff');
  }

  if (role === 'RESIDENT_HEAD') {
    return t('role.residentHead');
  }

  return role;
}

function getStatusLabel(t, status) {
  if (!status) {
    return t('common.notAvailable');
  }

  if (status === 'ACTIVE') {
    return t('common.active');
  }

  if (status === 'LOCKED') {
    return t('profile.status.locked');
  }

  if (status === 'INACTIVE') {
    return t('common.inactive');
  }

  return status;
}

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const syncFormFromUser = () => {
    setForm({
      fullName: user?.fullName || '',
      phone: user?.phone || ''
    });
  };

  useEffect(() => {
    syncFormFromUser();
  }, [user]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      await updateProfile({
        fullName: form.fullName,
        phone: form.phone
      });
      setMessage(t('profile.messages.updated'));
      setEditing(false);
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('profile.messages.updateError'));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setMessage('');
    setError('');
    syncFormFromUser();
    setEditing(true);
  };

  const handleCancelEdit = () => {
    syncFormFromUser();
    setError('');
    setEditing(false);
  };

  return (
    <section className="content-section">
      <div className="page-title-row">
        <PageHeader
          actions={!editing ? (
            <button className="button-link" type="button" onClick={handleEdit}>
              {t('common.edit')}
            </button>
          ) : null}
          eyebrow={t('profile.eyebrow')}
          title={t('profile.title')}
        />
      </div>

      <p className="page-support-text">{t('profile.description')}</p>

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      <div className={`profile-grid${editing ? '' : ' profile-grid-view-only'}`}>
        <section className="settings-panel profile-summary-panel">
          <div className="settings-language-summary">
            <span>{t('profile.sections.account')}</span>
            <strong>{user?.fullName || t('common.notAvailable')}</strong>
          </div>

          <div className="detail-panel profile-detail-panel">
            <div>
              <span>{t('profile.fields.fullName')}</span>
              <strong>{user?.fullName || t('common.notAvailable')}</strong>
            </div>
            <div>
              <span>{t('profile.fields.email')}</span>
              <strong>{user?.email || t('common.notAvailable')}</strong>
            </div>
            <div>
              <span>{t('profile.fields.phone')}</span>
              <strong>{user?.phone || t('common.notProvided')}</strong>
            </div>
            <div>
              <span>{t('profile.fields.role')}</span>
              <strong>{getRoleLabel(t, user?.role)}</strong>
            </div>
            <div>
              <span>{t('profile.fields.status')}</span>
              <strong>{getStatusLabel(t, user?.status)}</strong>
            </div>
          </div>
        </section>

        {editing && (
          <form className="panel-form profile-edit-form" onSubmit={handleSubmit}>
            <div>
              <p className="eyebrow">{t('profile.sections.edit')}</p>
              <h2>{t('profile.editTitle')}</h2>
            </div>

            <label htmlFor="profileFullName">{t('profile.fields.fullName')}</label>
            <input
              id="profileFullName"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              maxLength={120}
              required
            />

            <label htmlFor="profileEmail">{t('profile.fields.email')}</label>
            <input
              id="profileEmail"
              name="email"
              type="email"
              value={user?.email || ''}
              disabled
              readOnly
            />
            <span className="field-help">{t('profile.emailHelp')}</span>

            <label htmlFor="profilePhone">{t('profile.fields.phone')}</label>
            <input
              id="profilePhone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              maxLength={30}
            />

            <div className="form-action-row">
              <button type="submit" disabled={loading}>
                {loading ? t('profile.actions.saving') : t('profile.actions.save')}
              </button>
              <button className="secondary-button" type="button" disabled={loading} onClick={handleCancelEdit}>
                {t('common.cancel')}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
