import React from 'react';

const PrimaryButton = ({ children, onClick, type = 'button', disabled = false, fullWidth = true }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        backgroundColor: disabled ? '#9ca3af' : 'var(--primary-color)',
        color: 'white',
        border: 'none',
        padding: '0.75rem 1.5rem',
        borderRadius: '4px',
        fontSize: '1rem',
        fontWeight: '500',
        cursor: disabled ? 'not-allowed' : 'pointer',
        width: fullWidth ? '100%' : 'auto',
        transition: 'background-color 0.2s',
      }}
      onMouseOver={(e) => {
        if (!disabled) e.currentTarget.style.backgroundColor = 'var(--primary-hover)';
      }}
      onMouseOut={(e) => {
        if (!disabled) e.currentTarget.style.backgroundColor = 'var(--primary-color)';
      }}
    >
      {children}
    </button>
  );
};

export default PrimaryButton;
