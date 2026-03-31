import React from 'react';
import { useNavigate } from 'react-router-dom';
import RoleCard from '../components/RoleCard';

const RoleSelectionPage = () => {
  const navigate = useNavigate();

  const handleRoleSelect = (role) => {
    localStorage.setItem('selectedRole', role);
    navigate('/login');
  };

  return (
    <div className="page-container">
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', color: 'var(--primary-color)' }}>Rental Hub</h1>
        <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>Choose your account type to continue</p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '2rem',
        width: '100%',
        maxWidth: '800px'
      }}>
        <RoleCard 
          title="For Landlord" 
          description="Manage your properties, tenants, and track your rental income."
          icon="🏢"
          onSelect={() => handleRoleSelect('LANDLORD')}
        />
        
        <RoleCard 
          title="For Tenant" 
          description="Find a place to live, manage contracts, and pay rent easily."
          icon="🏠"
          onSelect={() => handleRoleSelect('TENANT')}
        />
      </div>
    </div>
  );
};

export default RoleSelectionPage;
