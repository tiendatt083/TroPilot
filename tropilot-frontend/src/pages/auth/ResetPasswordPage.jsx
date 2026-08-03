import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { requestPasswordResetCode, resetPasswordWithCode } from '../../api/authApi.js';
import LineIcon from '../../components/common/LineIcon.jsx';
import { getDashboardPath } from '../../utils/roleRoutes.js';
import brandLogo from '../../assets/no_name_backgroud.png';

/** Trang đặt mật khẩu mới bằng mã hoặc liên kết đặt lại mật khẩu đã nhận. */
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
  const [toastMessage, setToastMessage] = useState(location.state?.notice || '');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    if (!toastMessage) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setToastMessage(''), 4200);
    return () => window.clearTimeout(timeoutId);
  }, [toastMessage]);

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

  const handleRequestNewCode = async () => {
    const normalizedEmail = form.email.trim();
    setError('');
    setSuccess('');

    if (!normalizedEmail) {
      setError(t('auth.resetPassword.emailRequired'));
      return;
    }

    setResendLoading(true);

    try {
      await requestPasswordResetCode({ email: normalizedEmail });
      setForm((current) => ({ ...current, email: normalizedEmail, code: '' }));
      setToastMessage(t('auth.forgotPassword.sent'));
    } catch (apiError) {
      if (apiError.response?.status === 400) {
        setError(t('auth.forgotPassword.notRegistered'));
      } else {
        setError(apiError.response?.data?.message || t('auth.forgotPassword.error'));
      }
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <main className="auth-page login-page reset-password-page">
      <div className="login-backdrop" aria-hidden="true">
        <span className="login-dots login-dots-top" />
        <span className="login-dots login-dots-bottom" />
        <span className="login-city login-city-left" />
        <span className="login-city login-city-right" />
        <span className="login-wave" />
      </div>

      {toastMessage && (
        <div className="auth-toast success-alert" role="status" aria-live="polite">
          <LineIcon name="checkShield" className="reset-notice-icon" />
          <span>{toastMessage}</span>
        </div>
      )}

      <section className="auth-panel login-panel reset-password-panel" aria-labelledby="reset-password-title">
        <div className="login-heading">
          <div className="login-brand" aria-label="Tropilot">
            <img className="auth-logo-image" src={brandLogo} alt="" aria-hidden="true" />
            <span className="login-wordmark"><span className="login-wordmark-dark">TRO</span><span className="login-wordmark-blue">PILOT</span></span>
          </div>
          <div>
            <h1 id="reset-password-title">{t('auth.resetPassword.title')}</h1>
            <p className="helper-text reset-password-description">{t('auth.resetPassword.description')}</p>
          </div>
        </div>

        {success && (
          <div className="alert success-alert reset-password-notice">
            <LineIcon name="checkShield" className="reset-notice-icon" />
            <span>{success}</span>
          </div>
        )}
        {error && <div className="alert error-alert login-error">{error}</div>}

        <form className="auth-form login-form reset-password-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label htmlFor="reset-email">{t('auth.resetPassword.email')}</label>
            <div className="login-input-wrap">
              <LineIcon name="mail" className="login-input-icon" />
              <input
                id="reset-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder={t('auth.resetPassword.emailPlaceholder')}
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="login-field">
            <label htmlFor="reset-code">{t('auth.resetPassword.code')}</label>
            <div className="login-input-wrap">
              <LineIcon name="checkShield" className="login-input-icon" />
              <input
                id="reset-code"
                name="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                placeholder={t('auth.resetPassword.codePlaceholder')}
                value={form.code}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="login-field">
            <label htmlFor="reset-new-password">{t('auth.resetPassword.newPassword')}</label>
            <div className="login-input-wrap">
              <LineIcon name="lock" className="login-input-icon" />
              <input
                id="reset-new-password"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                minLength={8}
                placeholder={t('auth.resetPassword.newPasswordPlaceholder')}
                value={form.newPassword}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="login-field">
            <label htmlFor="reset-confirm-password">{t('auth.resetPassword.confirmPassword')}</label>
            <div className="login-input-wrap">
              <LineIcon name="lock" className="login-input-icon" />
              <input
                id="reset-confirm-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                minLength={8}
                placeholder={t('auth.resetPassword.confirmPasswordPlaceholder')}
                value={form.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button className="login-submit-button" type="submit" disabled={loading}>
            {loading ? t('auth.resetPassword.submitting') : t('auth.resetPassword.submit')}
          </button>
        </form>

        <div className="reset-password-links">
          <button
            className="auth-link auth-link-button"
            type="button"
            disabled={resendLoading}
            onClick={handleRequestNewCode}
          >
            {resendLoading ? t('auth.resetPassword.resending') : t('auth.resetPassword.requestNewCode')}
          </button>
          <Link className="auth-link" to="/login">
            {t('auth.common.backToLogin')}
          </Link>
        </div>
      </section>
    </main>
  );
}
