import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import { validateLoginForm } from '../utils/validators';
import { authApi } from '../api/auth';

const LoginPage = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState('');
  
  const [formData, setFormData] = useState({
    emailOrPhone: '',
    password: ''
  });
  
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const selectedRole = localStorage.getItem('selectedRole');
    if (!selectedRole) {
      navigate('/');
      return;
    }
    setRole(selectedRole);

    const message = localStorage.getItem('successMessage');
    if (message) {
      setSuccessMessage(message);
      localStorage.removeItem('successMessage');
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
    setApiError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateLoginForm(formData);
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    setApiError('');

    try {
      const response = await authApi.login({ ...formData, role });
      
      if (response.success) {
        localStorage.setItem('user', JSON.stringify(response.data));
        navigate('/home');
      } else {
        setApiError(response.message || 'Login failed');
      }
    } catch (error) {
      if (error.data) {
        // Validation errors returned appropriately if any
        if (typeof error.data === 'string') {
          setApiError(error.data);
        } else {
          setApiError(error.message || 'Invalid credentials');
        }
      } else {
        setApiError(error.message || 'An error occurred during login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!role) return null;

  return (
    <div className="page-container">
      <div className="card">
        <div className="text-center mb-4">
          <h2>Welcome Back</h2>
          <p style={{ color: 'var(--text-muted)' }}>Login as <strong style={{ color: 'var(--primary-color)' }}>{role}</strong></p>
        </div>

        {successMessage && <div className="alert-success">{successMessage}</div>}
        {apiError && <div className="alert-error">{apiError}</div>}

        <form onSubmit={handleSubmit}>
          <InputField
            label="Email or Phone"
            name="emailOrPhone"
            value={formData.emailOrPhone}
            onChange={handleChange}
            error={errors.emailOrPhone}
            placeholder="Enter your email or phone"
          />

          <InputField
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            placeholder="Enter your password"
          />

          <div className="mt-4">
            <PrimaryButton type="submit" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login'}
            </PrimaryButton>
          </div>
        </form>

        <div className="text-center mt-4" style={{ fontSize: '0.875rem' }}>
          Don't have an account? <Link to="/register">Register here</Link>
          <br /><br />
          <Link to="/" style={{ color: 'var(--text-muted)' }}>Change Role</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
