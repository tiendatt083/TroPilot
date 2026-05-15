import { useEffect, useState } from 'react';
import * as activityLogApi from '../../api/activityLogApi.js';
import ActivityLogTable from '../../components/ActivityLogTable.jsx';
import PageHeader from '../../components/PageHeader.jsx';

export default function AdminActivityLogPage() {
  const [logs, setLogs] = useState([]);
  const [action, setAction] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadLogs = async (targetAction = action) => {
    setError('');

    try {
      const response = await activityLogApi.getAdminActivityLogs(targetAction.trim());
      setLogs(response.data);
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Activity logs could not be loaded');
    }
  };

  useEffect(() => {
    let active = true;

    activityLogApi
      .getAdminActivityLogs()
      .then((response) => {
        if (active) {
          setLogs(response.data);
        }
      })
      .catch((apiError) => {
        if (active) {
          setError(apiError.response?.data?.message || 'Activity logs could not be loaded');
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    loadLogs();
  };

  const handleClear = () => {
    setAction('');
    loadLogs('');
  };

  return (
    <section className="content-section">
      <PageHeader eyebrow="Administrator" title="Activity logs" />

      {error && <div className="alert error-alert">{error}</div>}

      <form className="search-row" onSubmit={handleSubmit}>
        <input
          aria-label="Action filter"
          placeholder="Filter by action"
          value={action}
          onChange={(event) => setAction(event.target.value)}
        />
        <button className="inline-button" type="submit">
          Filter
        </button>
        <button className="secondary-button inline-button" type="button" onClick={handleClear}>
          Clear
        </button>
      </form>

      {loading ? (
        <div className="empty-state">Loading activity logs...</div>
      ) : (
        <ActivityLogTable logs={logs} />
      )}
    </section>
  );
}
