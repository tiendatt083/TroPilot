import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.jsx';
import ModalCloseButton from './common/ModalCloseButton.jsx';

const EMPTY_FORM = {
  fullName: '',
  phone: ''
};

export default function AdminProfileDialog({ open, onClose }) {
  const { t } = useTranslation();
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    setForm({
      fullName: user?.fullName || '',
      phone: user?.phone || ''
    });
    setEditing(false);
    setMessage('');
    setError('');

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose, open, user]);

  if (!open) {
    return null;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');
    setSaving(true);

    try {
      await updateProfile({
        fullName: form.fullName.trim(),
        phone: form.phone.trim()
      });
      setMessage(t('profile.messages.updated'));
      setEditing(false);
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('profile.messages.updateError'));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = () => {
    setForm({
      fullName: user?.fullName || '',
      phone: user?.phone || ''
    });
    setMessage('');
    setError('');
    setEditing(true);
  };

  return (
    <div className="account-modal-overlay" role="presentation" onMouseDown={onClose}>
      <section
        aria-labelledby="admin-profile-dialog-title"
        aria-modal="true"
        className="account-detail-modal admin-profile-dialog"
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="account-modal-header">
          <div>
            <span className="section-eyebrow">{t('profile.eyebrow')}</span>
            <h2 id="admin-profile-dialog-title">{t('profile.title')}</h2>
          </div>
          <ModalCloseButton label={t('common.close')} onClick={onClose} />
        </div>

        {message && <div className="alert success-alert">{message}</div>}
        {error && <div className="alert error-alert">{error}</div>}

        {!editing ? (
          <div className="admin-profile-view">
            <div className="admin-profile-summary-grid">
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
                <strong>{t('role.admin')}</strong>
              </div>
            </div>

            <div className="admin-profile-actions">
              <button type="button" onClick={handleEdit}>
                {t('common.edit')}
              </button>
            </div>
          </div>
        ) : (
          <form className="admin-profile-form" onSubmit={handleSubmit}>
            <div className="form-grid">
            <div>
              <label htmlFor="adminProfileFullName">{t('profile.fields.fullName')}</label>
              <input
                id="adminProfileFullName"
                maxLength={120}
                name="fullName"
                required
                value={form.fullName}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="adminProfileEmail">{t('profile.fields.email')}</label>
              <input
                id="adminProfileEmail"
                disabled
                readOnly
                type="email"
                value={user?.email || ''}
              />
            </div>

            <div>
              <label htmlFor="adminProfilePhone">{t('profile.fields.phone')}</label>
              <input
                id="adminProfilePhone"
                maxLength={30}
                name="phone"
                value={form.phone}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="adminProfileRole">{t('profile.fields.role')}</label>
              <input
                id="adminProfileRole"
                disabled
                readOnly
                value={t('role.admin')}
              />
            </div>

          </div>

          <div className="admin-profile-actions">
            <button disabled={saving} type="submit">
              {saving ? t('profile.actions.saving') : t('profile.actions.save')}
            </button>
          </div>
        </form>
        )}
      </section>
    </div>
  );
}
