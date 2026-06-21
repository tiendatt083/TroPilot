import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { requestPasswordResetCode } from '../../api/authApi.js';
import { getDashboardPath } from '../../utils/roleRoutes.js';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated && user?.mustChangePassword) {
    return <Navigate to="/change-password" replace />;
  }

  if (isAuthenticated) {
    return <Navigate to={getDashboardPath(user?.role)} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const normalizedEmail = email.trim();
      await requestPasswordResetCode({ email: normalizedEmail });
      navigate('/reset-password', {
        state: {
          email: normalizedEmail,
          notice: t('auth.forgotPassword.sent')
        }
      });
    } catch (apiError) {
      if (apiError.response?.status === 400) {
        setError(t('auth.forgotPassword.notRegistered'));
      } else {
        setError(apiError.response?.data?.message || t('auth.forgotPassword.error'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="forgot-password-title">
        <div>
          <p className="eyebrow">Tropilot</p>
          <h1 id="forgot-password-title">{t('auth.forgotPassword.title')}</h1>
        </div>

        <p className="helper-text">{t('auth.forgotPassword.description')}</p>
        {error && <div className="alert error-alert">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="forgot-email">{t('auth.forgotPassword.email')}</label>
          <input
            id="forgot-email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? t('auth.forgotPassword.submitting') : t('auth.forgotPassword.submit')}
          </button>
        </form>

        <div className="auth-footer-links">
          <Link className="auth-link" to="/login">
            {t('auth.common.backToLogin')}
          </Link>
          <Link className="auth-link" to="/reset-password">
            {t('auth.forgotPassword.haveCode')}
          </Link>
        </div>
      </section>
    </main>
  );
}
