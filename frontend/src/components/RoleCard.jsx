import React from 'react';

const RoleCard = ({ title, description, icon, onSelect }) => {
  return (
    <div 
      onClick={onSelect}
      style={{
        border: '2px solid var(--border-color)',
        borderRadius: '8px',
        padding: '2rem',
        cursor: 'pointer',
        transition: 'all 0.2s',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
        backgroundColor: 'var(--white)',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.borderColor = 'var(--primary-color)';
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-color)';
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ fontSize: '3rem' }}>{icon}</div>
      <h3 style={{ margin: 0 }}>{title}</h3>
      <p style={{ color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>{description}</p>
    </div>
  );
};

export default RoleCard;
