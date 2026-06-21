import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { getDashboardPath } from '../../utils/roleRoutes.js';

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
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="login-title">
        <div>
          <p className="eyebrow">Tropilot</p>
          <h1 id="login-title">{t('auth.signIn.title')}</h1>
        </div>

        {error && <div className="alert error-alert">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="email">{t('auth.signIn.email')}</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            required
          />

          <label htmlFor="password">{t('auth.signIn.password')}</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={form.password}
            onChange={handleChange}
            required
          />
          <div className="auth-link-row">
            <Link className="auth-link" to="/forgot-password">
              {t('auth.signIn.forgotPassword')}
            </Link>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? t('auth.signIn.submitting') : t('auth.signIn.submit')}
          </button>
        </form>
      </section>
    </main>
  );
}
