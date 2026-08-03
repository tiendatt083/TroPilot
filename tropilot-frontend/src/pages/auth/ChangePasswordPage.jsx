import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { getDashboardPath } from '../../utils/roleRoutes.js';

/** Trang đổi mật khẩu cho người dùng đã đăng nhập, kiểm tra mật khẩu hiện tại và mật khẩu mới. */
export default function ChangePasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { changeFirstPassword, user } = useAuth();
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const updatedUser = await changeFirstPassword(form);
      navigate(getDashboardPath(updatedUser.role), { replace: true });
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('auth.changePassword.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="change-password-title">
        <div>
          <p className="eyebrow">Tropilot</p>
          <h1 id="change-password-title">{t('auth.changePassword.title')}</h1>
        </div>

        <p className="helper-text">{user?.email}</p>
        {error && <div className="alert error-alert">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="currentPassword">{t('auth.changePassword.currentPassword')}</label>
          <input
            id="currentPassword"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            value={form.currentPassword}
            onChange={handleChange}
            required
          />

          <label htmlFor="newPassword">{t('auth.changePassword.newPassword')}</label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={form.newPassword}
            onChange={handleChange}
            required
          />

          <label htmlFor="confirmPassword">{t('auth.changePassword.confirmPassword')}</label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={form.confirmPassword}
            onChange={handleChange}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? t('auth.changePassword.submitting') : t('auth.changePassword.submit')}
          </button>
        </form>
      </section>
    </main>
  );
}
