import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { resetPasswordWithCode } from '../../api/authApi.js';
import { getDashboardPath } from '../../utils/roleRoutes.js';

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [form, setForm] = useState({
    email: location.state?.email || '',
    code: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [notice] = useState(location.state?.notice || '');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated && user?.mustChangePassword) {
    return <Navigate to="/change-password" replace />;
  }

  if (isAuthenticated) {
    return <Navigate to={getDashboardPath(user?.role)} replace />;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (form.newPassword !== form.confirmPassword) {
      setError(t('auth.resetPassword.passwordMismatch'));
      return;
    }

    setLoading(true);

    try {
      await resetPasswordWithCode({
        email: form.email.trim(),
        code: form.code.trim(),
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword
      });
      setSuccess(t('auth.resetPassword.success'));
      setForm((current) => ({
        ...current,
        code: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('auth.resetPassword.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="reset-password-title">
        <div>
          <p className="eyebrow">Tropilot</p>
          <h1 id="reset-password-title">{t('auth.resetPassword.title')}</h1>
        </div>

        <p className="helper-text">{t('auth.resetPassword.description')}</p>
        {notice && !success && <div className="alert success-alert">{notice}</div>}
        {success && <div className="alert success-alert">{success}</div>}
        {error && <div className="alert error-alert">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="reset-email">{t('auth.resetPassword.email')}</label>
          <input
            id="reset-email"
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            required
          />

          <label htmlFor="reset-code">{t('auth.resetPassword.code')}</label>
          <input
            id="reset-code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            value={form.code}
            onChange={handleChange}
            required
          />

          <label htmlFor="reset-new-password">{t('auth.resetPassword.newPassword')}</label>
          <input
            id="reset-new-password"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={form.newPassword}
            onChange={handleChange}
            required
          />

          <label htmlFor="reset-confirm-password">{t('auth.resetPassword.confirmPassword')}</label>
          <input
            id="reset-confirm-password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={form.confirmPassword}
            onChange={handleChange}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? t('auth.resetPassword.submitting') : t('auth.resetPassword.submit')}
          </button>
        </form>

        <div className="auth-footer-links">
          <Link className="auth-link" to="/forgot-password">
            {t('auth.resetPassword.requestNewCode')}
          </Link>
          <Link className="auth-link" to="/login">
            {t('auth.common.backToLogin')}
          </Link>
        </div>
      </section>
    </main>
  );
}
