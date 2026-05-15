function formatDateTime(value) {
  if (!value) {
    return 'Not available';
  }

  return String(value).replace('T', ' ').slice(0, 16);
}

function formatAction(action) {
  if (!action) {
    return 'Not available';
  }

  return action
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default function ActivityLogTable({ logs }) {
  return (
    <div className="table-wrap">
      <table className="data-table activity-log-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>User</th>
            <th>Action</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td>{formatDateTime(log.createdAt)}</td>
              <td>
                <strong>{log.userFullName}</strong>
                <span className="table-subtext">{log.userEmail}</span>
                <span className="table-subtext">{log.userRole}</span>
              </td>
              <td>
                <strong>{formatAction(log.action)}</strong>
                <span className="table-subtext">{log.action}</span>
              </td>
              <td>{log.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {logs.length === 0 && <div className="empty-state flat-empty-state">No activity logs found.</div>}
    </div>
  );
}
