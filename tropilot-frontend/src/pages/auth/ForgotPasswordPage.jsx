import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { requestPasswordResetCode } from '../../api/authApi.js';
import LineIcon from '../../components/common/LineIcon.jsx';
import { getDashboardPath } from '../../utils/roleRoutes.js';
import brandLogo from '../../assets/no_name_backgroud.png';

/** Trang gửi yêu cầu đặt lại mật khẩu thông qua địa chỉ email. */
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
    <main className="auth-page login-page forgot-password-page">
      <div className="login-backdrop" aria-hidden="true">
        <span className="login-dots login-dots-top" />
        <span className="login-dots login-dots-bottom" />
        <span className="login-city login-city-left" />
        <span className="login-city login-city-right" />
        <span className="login-wave" />
      </div>

      <section className="auth-panel login-panel forgot-password-panel" aria-labelledby="forgot-password-title">
        <div className="login-heading">
          <div className="login-brand" aria-label="Tropilot">
            <img className="auth-logo-image" src={brandLogo} alt="" aria-hidden="true" />
            <span className="login-wordmark"><span className="login-wordmark-dark">TRO</span><span className="login-wordmark-blue">PILOT</span></span>
          </div>
          <div>
            <h1 id="forgot-password-title">{t('auth.forgotPassword.title')}</h1>
            <p className="helper-text forgot-password-description">{t('auth.forgotPassword.description')}</p>
          </div>
        </div>

        {error && <div className="alert error-alert login-error">{error}</div>}

        <form className="auth-form login-form forgot-password-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label htmlFor="forgot-email">{t('auth.forgotPassword.email')}</label>
            <div className="login-input-wrap">
              <LineIcon name="mail" className="login-input-icon" />
              <input
                id="forgot-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder={t('auth.forgotPassword.emailPlaceholder')}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
          </div>

          <button className="login-submit-button" type="submit" disabled={loading}>
            {loading ? t('auth.forgotPassword.submitting') : t('auth.forgotPassword.submit')}
          </button>

          <Link className="auth-link" to="/login">
            {t('auth.common.backToLogin')}
          </Link>
        </form>
      </section>
    </main>
  );
}
