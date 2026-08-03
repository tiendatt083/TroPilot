import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ActionDialog from '../components/common/ActionDialog.jsx';
import LineIcon from '../components/common/LineIcon.jsx';
import ManagementPageHero from '../components/common/ManagementPageHero.jsx';
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

/** Trang hồ sơ cá nhân, cho phép người dùng xem và cập nhật thông tin cơ bản của mình. */
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

  const profileItems = [
    {
      icon: 'user',
      label: t('profile.fields.fullName'),
      value: user?.fullName || t('common.notAvailable')
    },
    {
      icon: 'mail',
      label: t('profile.fields.email'),
      value: user?.email || t('common.notAvailable')
    },
    {
      icon: 'phone',
      label: t('profile.fields.phone'),
      value: user?.phone || t('common.notProvided')
    },
    {
      icon: 'checkShield',
      label: t('profile.fields.status'),
      value: getStatusLabel(t, user?.status)
    }
  ];
  const pageClassName = [
    'content-section',
    'profile-page',
    user?.role === 'STAFF' ? 'staff-profile-page' : '',
    user?.role === 'RESIDENT_HEAD' ? 'resident-profile-page' : ''
  ].filter(Boolean).join(' ');

  return (
    <section className={pageClassName}>
      <ManagementPageHero
        actions={(
          <button className="button-link profile-hero-edit-button" type="button" onClick={handleEdit}>
            <LineIcon name="edit" />
            {t('common.edit')}
          </button>
        )}
        description={t('profile.description')}
        title={t('profile.title')}
      />

      {message && <div className="alert success-alert">{message}</div>}

      <section className="profile-summary-card">
        <div className="profile-identity-row">
          <div className="profile-avatar" aria-hidden="true">
            <LineIcon name="user" />
          </div>
          <div className="profile-identity-copy">
            <span className="section-eyebrow">{t('profile.sections.account')}</span>
            <h2>{user?.fullName || t('common.notAvailable')}</h2>
            <p>{user?.email || t('common.notAvailable')}</p>
          </div>
          <span className="role-pill profile-role-pill">{getRoleLabel(t, user?.role)}</span>
        </div>

        <div className="profile-detail-grid">
          {profileItems.map((item) => (
            <div className="profile-detail-item" key={item.label}>
              <span className="profile-detail-icon" aria-hidden="true">
                <LineIcon name={item.icon} />
              </span>
              <div>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            </div>
          ))}
        </div>
      </section>

      <ActionDialog
        className="profile-edit-dialog"
        eyebrow={t('profile.sections.edit')}
        labelledBy="profile-edit-dialog-title"
        onClose={handleCancelEdit}
        open={editing}
        title={t('profile.editTitle')}
      >
        {error && <div className="alert error-alert">{error}</div>}

        <form className="panel-form profile-edit-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div>
              <label htmlFor="profileFullName">{t('profile.fields.fullName')}</label>
              <input
                id="profileFullName"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                maxLength={120}
                required
              />
            </div>

            <div>
              <label htmlFor="profilePhone">{t('profile.fields.phone')}</label>
              <input
                id="profilePhone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                maxLength={30}
              />
            </div>
          </div>

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

          <div className="form-action-row profile-edit-actions">
            <button type="submit" disabled={loading}>
              <LineIcon name="save" />
              {loading ? t('profile.actions.saving') : t('profile.actions.save')}
            </button>
          </div>
        </form>
      </ActionDialog>
    </section>
  );
}
