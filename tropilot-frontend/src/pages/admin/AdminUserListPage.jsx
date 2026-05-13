import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as adminUserApi from '../../api/adminUserApi.js';
import PageHeader from '../../components/PageHeader.jsx';

export default function AdminUserListPage() {
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  const loadUsers = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await adminUserApi.getUsers();
      setUsers(response.data);
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Users could not be loaded');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleStatusAction = async (user, action) => {
    setActionId(user.id);
    setMessage('');
    setError('');

    try {
      if (action === 'lock') {
        await adminUserApi.lockUser(user.id);
        setMessage(`${user.fullName} was locked successfully.`);
      } else {
        await adminUserApi.unlockUser(user.id);
        setMessage(`${user.fullName} was unlocked successfully.`);
      }

      await loadUsers();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Account status could not be updated');
    } finally {
      setActionId(null);
    }
  };

  const handleResetPassword = async (user) => {
    setActionId(user.id);
    setMessage('');
    setError('');

    try {
      const response = await adminUserApi.resetPassword(user.id);
      setMessage(`Temporary password for ${user.fullName}: ${response.data.temporaryPassword}`);
      await loadUsers();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Password could not be reset');
    } finally {
      setActionId(null);
    }
  };

  return (
    <section className="content-section">
      <div className="page-title-row">
        <PageHeader eyebrow="Administrator" title="User management" />
        <Link className="button-link" to="/admin/users/create">
          Create user
        </Link>
      </div>

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">Loading users...</div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Account status</th>
                <th>Password status</th>
                <th>Temporary password</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.fullName}</td>
                  <td>{user.email}</td>
                  <td>{formatRole(user.role)}</td>
                  <td>
                    <span className={`status-pill status-${user.status.toLowerCase()}`}>
                      {formatStatus(user.status)}
                    </span>
                  </td>
                  <td>
                    {user.mustChangePassword ? (
                      <span className="password-state pending-password">Password not changed</span>
                    ) : (
                      <span className="password-state changed-password">Password changed</span>
                    )}
                  </td>
                  <td>
                    {user.mustChangePassword ? (
                      <span className="temporary-password-value">
                        {user.temporaryPassword || 'Temporary password unavailable'}
                      </span>
                    ) : (
                      <span className="muted-text">Password changed by user</span>
                    )}
                  </td>
                  <td>
                    <div className="table-actions">
                      {user.status === 'LOCKED' ? (
                        <button
                          className="secondary-button compact-button"
                          type="button"
                          disabled={actionId === user.id}
                          onClick={() => handleStatusAction(user, 'unlock')}
                        >
                          Unlock
                        </button>
                      ) : (
                        <button
                          className="secondary-button compact-button"
                          type="button"
                          disabled={actionId === user.id || user.role === 'ADMIN'}
                          onClick={() => handleStatusAction(user, 'lock')}
                        >
                          Lock
                        </button>
                      )}
                      <button
                        className="secondary-button compact-button"
                        type="button"
                        disabled={actionId === user.id || user.role === 'ADMIN'}
                        onClick={() => handleResetPassword(user)}
                      >
                        Regenerate
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function formatRole(role) {
  if (role === 'RESIDENT_HEAD') {
    return 'Head resident';
  }

  if (role === 'STAFF') {
    return 'Staff';
  }

  return 'Administrator';
}

function formatStatus(status) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}
