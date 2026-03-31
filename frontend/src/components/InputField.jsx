import React from 'react';

const InputField = ({ label, type = 'text', name, value, onChange, error, placeholder }) => {
  return (
    <div className="form-group">
      <label className="form-label" htmlFor={name}>
        {label}
      </label>
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '0.75rem',
          border: `1px solid ${error ? 'var(--error-color)' : 'var(--border-color)'}`,
          borderRadius: '4px',
          outline: 'none',
          fontSize: '1rem',
        }}
      />
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default InputField;
