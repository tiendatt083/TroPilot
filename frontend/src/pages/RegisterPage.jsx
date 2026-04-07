import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import { validateRegisterForm } from '../utils/validators';
import { authApi } from '../api/auth';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState('');
  const [step, setStep] = useState(1); // 1: Info, 2: OTP
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    otp: ''
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
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
    setApiError('');
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    const validationErrors = validateRegisterForm(formData);
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    setApiError('');

    try {
      const response = await authApi.sendRegisterOtp({ email: formData.email.trim(), role });
      setSuccessMessage(response.message || 'OTP sent! Please check your email.');
      setStep(2);
    } catch (error) {
      if (error.data && typeof error.data === 'object' && Object.keys(error.data).length > 0) {
        setErrors(error.data);
      } else {
        setApiError(error.message || 'Failed to send OTP.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    setApiError('');
    setSuccessMessage('');

    try {
      const response = await authApi.sendRegisterOtp({ email: formData.email.trim(), role });
      setSuccessMessage('New OTP sent! Please check your email.');
    } catch (error) {
      setApiError(error.message || 'Failed to resend OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!formData.otp.trim()) {
      setErrors({ otp: 'OTP is required' });
      return;
    }

    setIsLoading(true);
    setApiError('');
    setSuccessMessage('');

    try {
      const response = await authApi.register({ ...formData, role });
      
      if (response.success) {
        localStorage.setItem('successMessage', 'Registration successful! Please login.');
        navigate('/login');
      } else {
        setApiError(response.message || 'Registration failed');
      }
    } catch (error) {
      if (error.data && typeof error.data === 'object') {
        setErrors(error.data);
      } else {
        setApiError(error.message || 'An error occurred during registration');
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
          <h2>Create an Account</h2>
          <p style={{ color: 'var(--text-muted)' }}>Register as <strong style={{ color: 'var(--primary-color)' }}>{role}</strong></p>
        </div>

        {apiError && <div className="alert-error">{apiError}</div>}
        {successMessage && <div className="alert-success">{successMessage}</div>}

        {step === 1 ? (
          <form onSubmit={handleSendOtp}>
            <InputField label="Full Name" name="fullName" value={formData.fullName} onChange={handleChange} error={errors.fullName} placeholder="John Doe" />
            <InputField label="Email" name="email" value={formData.email} onChange={handleChange} error={errors.email} placeholder="email@example.com" />
            <InputField label="Phone" name="phone" value={formData.phone} onChange={handleChange} error={errors.phone} placeholder="0123456789" />
            <InputField label="Password" name="password" type="password" value={formData.password} onChange={handleChange} error={errors.password} placeholder="At least 6 characters" />
            <InputField label="Confirm Password" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} error={errors.confirmPassword} placeholder="Type your password again" />
            
            <div className="mt-4">
              <PrimaryButton type="submit" disabled={isLoading}>
                {isLoading ? 'Sending OTP...' : 'Next'}
              </PrimaryButton>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <InputField label="Email (Verification)" name="email" value={formData.email} disabled={true} onChange={() => {}} />
            <InputField label="OTP Code" name="otp" value={formData.otp} onChange={handleChange} error={errors.otp} placeholder="Enter 6-digit code" />
            
            <div className="mt-4">
              <PrimaryButton type="submit" disabled={isLoading}>
                {isLoading ? 'Creating account...' : 'Verify & Register'}
              </PrimaryButton>
            </div>
            
            <div className="text-center mt-3" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
               <button 
                 type="button" 
                 onClick={() => { setStep(1); setSuccessMessage(''); }}
                 style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
               >
                 &larr; Back to edit details
               </button>
               <button 
                 type="button" 
                 onClick={handleResendOtp}
                 disabled={isLoading}
                 style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: isLoading ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
               >
                 Resend OTP
               </button>
            </div>
          </form>
        )}

        <div className="text-center mt-4" style={{ fontSize: '0.875rem' }}>
          Already have an account? <Link to="/login">Login here</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
