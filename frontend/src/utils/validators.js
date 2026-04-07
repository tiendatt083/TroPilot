export const validateRegisterForm = (formData) => {
  const errors = {};

  if (!formData.fullName.trim()) {
    errors.fullName = 'Full Name is required';
  }

  if (!formData.email.trim()) {
    errors.email = 'Email is required';
  }

  if (!formData.phone.trim()) {
    errors.phone = 'Phone is required';
  }

  if (!formData.password) {
    errors.password = 'Password is required';
  } else if (formData.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }

  if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return errors;
};

export const validateLoginForm = (formData) => {
  const errors = {};

  if (!formData.email.trim()) {
    errors.email = 'Email is required';
  }

  if (!formData.password) {
    errors.password = 'Password is required';
  }

  return errors;
};
