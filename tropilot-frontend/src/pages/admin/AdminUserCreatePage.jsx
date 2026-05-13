import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as adminUserApi from '../../api/adminUserApi.js';
import PageHeader from '../../components/PageHeader.jsx';

const initialForm = {
  fullName: '',
  email: '',
  phone: '',
  role: 'STAFF'
};

export default function AdminUserCreatePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await adminUserApi.createUser(form);
      navigate('/admin/users', { replace: true });
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'User could not be created');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="content-section narrow-section">
      <div className="page-title-row">
        <PageHeader eyebrow="Administrator" title="Create user" />
        <Link className="secondary-link" to="/admin/users">
          Back to users
        </Link>
      </div>

      {error && <div className="alert error-alert">{error}</div>}

      <form className="panel-form" onSubmit={handleSubmit}>
        <label htmlFor="fullName">Full name</label>
        <input
          id="fullName"
          name="fullName"
          value={form.fullName}
          onChange={handleChange}
          maxLength={120}
          required
        />

        <label htmlFor="email">Email address</label>
        <input
          id="email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          maxLength={160}
          required
        />

        <label htmlFor="phone">Phone number</label>
        <input
          id="phone"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          maxLength={30}
        />

        <label htmlFor="role">Role</label>
        <select id="role" name="role" value={form.role} onChange={handleChange}>
          <option value="STAFF">Staff</option>
          <option value="RESIDENT_HEAD">Head resident</option>
        </select>

        <button type="submit" disabled={loading}>
          {loading ? 'Creating user...' : 'Create user'}
        </button>
      </form>
    </section>
  );
}
