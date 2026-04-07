import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import { authApi } from '../api/auth';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState('');
  const [step, setStep] = useState(1); // 1: Send OTP, 2: Reset Password
  
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const selectedRole = localStorage.getItem('selectedRole');
    if (!selectedRole) {
      navigate('/');
      return;
    }
    setRole(selectedRole);
  }, [navigate]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await authApi.forgotPassword({ email, role });
      setSuccess(res.message || 'OTP sent successfully! Please check your email.');
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otp.trim() || !newPassword || !confirmPassword) {
      setError('All fields are required');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await authApi.resetPassword({ email, role, otp, newPassword });
      setSuccess(res.message || 'Password reset successfully!');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  if (!role) return null;

  return (
    <div className="page-container">
      <div className="card">
        <div className="text-center mb-4">
          <h2>Forgot Password</h2>
          <p style={{ color: 'var(--text-muted)' }}>Reset password for <strong style={{ color: 'var(--primary-color)' }}>{role}</strong></p>
        </div>

        {error && <div className="alert-error">{error}</div>}
        {success && <div className="alert-success">{success}</div>}

        {step === 1 ? (
          <form onSubmit={handleSendOtp}>
            <InputField
              label="Email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your registered email"
            />
            <div className="mt-4">
              <PrimaryButton type="submit" disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send OTP'}
              </PrimaryButton>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword}>
            <InputField
              label="Email"
              name="email"
              value={email}
              disabled={true}
              onChange={() => {}}
            />
            <InputField
              label="OTP Code"
              name="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter 6-digit OTP"
            />
            <InputField
              label="New Password"
              name="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
            />
            <InputField
              label="Confirm New Password"
              name="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Type your new password again"
            />
            <div className="mt-4">
              <PrimaryButton type="submit" disabled={isLoading}>
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </PrimaryButton>
            </div>
          </form>
        )}

        <div className="text-center mt-4" style={{ fontSize: '0.875rem' }}>
          <Link to="/login">Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
