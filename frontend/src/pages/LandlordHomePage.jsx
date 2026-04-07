import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PrimaryButton from '../components/PrimaryButton';

const LandlordHomePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userDataStr = localStorage.getItem('user');
    if (!userDataStr) {
      navigate('/');
      return;
    }
    
    try {
      const parsedUser = JSON.parse(userDataStr);
      if (parsedUser.role !== 'LANDLORD') {
        navigate('/tenant-home');
        return;
      }
      setUser(parsedUser);
    } catch (e) {
      localStorage.removeItem('user');
      navigate('/');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('selectedRole');
    navigate('/');
  };

  if (!user) return null;

  return (
    <div className="page-container" style={{ alignItems: 'flex-start', justifyContent: 'flex-start' }}>
      <header style={{ 
        width: '100%', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '1rem 0',
        borderBottom: '1px solid var(--border-color)',
        marginBottom: '2rem'
      }}>
        <h1 style={{ margin: 0, color: 'var(--primary-color)' }}>HomeNest - Landlord Portal</h1>
        <div style={{ width: '120px' }}>
          <PrimaryButton onClick={handleLogout}>Logout</PrimaryButton>
        </div>
      </header>

      <main style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
        <div className="card" style={{ maxWidth: '100%' }}>
          <h2>Welcome Admin (Landlord), {user.fullName}!</h2>
          <div style={{ 
            display: 'inline-block',
            padding: '0.25rem 0.75rem',
            backgroundColor: 'var(--bg-color)',
            border: '1px solid var(--border-color)',
            borderRadius: '9999px',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: 'var(--text-muted)'
          }}>
            Role: {user.role}
          </div>
          
          <p style={{ marginTop: '2rem', color: 'var(--text-muted)' }}>
            This is the Landlord Admin Dashboard. Here you can start managing your properties, viewing tenant lists, and tracking revenue.
          </p>
        </div>
      </main>
    </div>
  );
};

export default LandlordHomePage;
