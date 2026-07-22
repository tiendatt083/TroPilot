import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import LineIcon from '../../components/common/LineIcon.jsx';
import { getDashboardPath } from '../../utils/roleRoutes.js';
import brandLogo from '../../assets/no_name_backgroud.png';

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, signIn, user } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
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
    setLoading(true);

    try {
      const loggedInUser = await signIn(form);
      const redirectPath = loggedInUser.mustChangePassword
        ? '/change-password'
        : location.state?.from?.pathname || getDashboardPath(loggedInUser.role);

      navigate(redirectPath, { replace: true });
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('auth.signIn.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page login-page">
      <div className="login-backdrop" aria-hidden="true">
        <span className="login-dots login-dots-top" />
        <span className="login-dots login-dots-bottom" />
        <span className="login-city login-city-left" />
        <span className="login-city login-city-right" />
        <span className="login-wave" />
      </div>

      <section className="auth-panel login-panel" aria-labelledby="login-title">
        <div className="login-heading">
          <div className="login-brand" aria-label="Tropilot">
            <span className="login-wordmark">Tropilot</span>
            <img className="auth-logo-image" src={brandLogo} alt="" aria-hidden="true" />
          </div>
          <h1 id="login-title">{t('auth.signIn.title')}</h1>
        </div>

        {error && <div className="alert error-alert login-error">{error}</div>}

        <form className="auth-form login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label htmlFor="email">{t('auth.signIn.email')}</label>
            <div className="login-input-wrap">
              <LineIcon name="mail" className="login-input-icon" />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder={t('auth.signIn.emailPlaceholder')}
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="login-field">
            <label htmlFor="password">{t('auth.signIn.password')}</label>
            <div className="login-input-wrap">
              <LineIcon name="lock" className="login-input-icon" />
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder={t('auth.signIn.passwordPlaceholder')}
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="auth-link-row">
            <Link className="auth-link" to="/forgot-password">
              {t('auth.signIn.forgotPassword')}
            </Link>
          </div>

          <button className="login-submit-button" type="submit" disabled={loading}>
            {loading ? t('auth.signIn.submitting') : t('auth.signIn.submit')}
          </button>
        </form>
      </section>
    </main>
  );
}
