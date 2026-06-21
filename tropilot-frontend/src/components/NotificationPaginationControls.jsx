import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

function getPageNumbers(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index);
  }

  const start = Math.max(0, Math.min(currentPage - 1, totalPages - 3));
  return Array.from({ length: 3 }, (_, index) => start + index);
}

export default function NotificationPaginationControls({
  page,
  pageSize,
  totalItems,
  onPageChange,
  translationPrefix = 'notifications'
}) {
  const { t } = useTranslation();
  const totalPages = Math.ceil(totalItems / pageSize);
  const pageNumbers = useMemo(() => getPageNumbers(page, totalPages), [page, totalPages]);
  const from = totalItems === 0 ? 0 : page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, totalItems);

  return (
    <div className="notification-pagination">
      <span>
        {t(`${translationPrefix}.pagination.summary`, {
          from,
          to,
          total: totalItems
        })}
      </span>

      <div className="notification-page-buttons" aria-label={t(`${translationPrefix}.pagination.ariaLabel`)}>
        <button
          className="secondary-button compact-button"
          type="button"
          disabled={page <= 0}
          onClick={() => onPageChange(page - 1)}
        >
          {t(`${translationPrefix}.pagination.previous`)}
        </button>

        {pageNumbers.map((pageNumber) => (
          <button
            key={pageNumber}
            className={`secondary-button compact-button ${pageNumber === page ? 'is-active' : ''}`}
            type="button"
            disabled={pageNumber === page}
            onClick={() => onPageChange(pageNumber)}
          >
            {pageNumber + 1}
          </button>
        ))}

        <button
          className="secondary-button compact-button"
          type="button"
          disabled={totalPages === 0 || page >= totalPages - 1}
          onClick={() => onPageChange(page + 1)}
        >
          {t(`${translationPrefix}.pagination.next`)}
        </button>
      </div>
    </div>
  );
}
