import NotificationPaginationControls from './NotificationPaginationControls.jsx';
import NotificationTable from './NotificationTable.jsx';

export default function NotificationHistoryPanel({
  notifications,
  page,
  pageSize,
  totalItems,
  onPageChange,
  showReadStatus = false,
  showTarget = true
}) {
  return (
    <section className="building-section notification-history-section">
      <NotificationTable
        notifications={notifications}
        showReadStatus={showReadStatus}
        showTarget={showTarget}
      />
      <NotificationPaginationControls
        page={page}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={onPageChange}
      />
    </section>
  );
}
