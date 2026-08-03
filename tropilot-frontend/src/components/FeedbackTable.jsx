import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import {
  formatFeedbackDateTime,
  getFeedbackStatusClass,
} from '../utils/feedbackOptions.js';
import { formatDisplayMonth } from '../utils/dateFormat.js';
import { formatEnumLabel } from '../utils/i18nFormat.js';
import { formatRoomLabel } from '../utils/roomDisplay.js';

/** Định dạng mã hoặc số lượng phản hồi để hiển thị nhất quán trong bảng. */
function formatNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue)
    ? numberValue.toLocaleString('en-US', { maximumFractionDigits: 2 })
    : value;
}

const DEFAULT_COLUMNS = ['title', 'type', 'resident', 'room', 'invoice', 'status', 'reply', 'created'];

/** Bảng phản hồi của cư dân, hỗ trợ truyền thêm nút thao tác từ từng trang sử dụng. */
export default function FeedbackTable({
  feedbacks,
  renderActions,
  renderExpandedRow,
  visibleColumns = DEFAULT_COLUMNS
}) {
  const { t } = useTranslation();
  const hasActions = Boolean(renderActions);
  const activeColumns = hasActions && !visibleColumns.includes('actions')
    ? [...visibleColumns, 'actions']
    : visibleColumns;

  const columns = {
    title: {
      header: t('tables.feedbacks.title'),
      cell: (feedback) => (
        <>
          <strong>{feedback.title}</strong>
          <span className="table-subtext">{feedback.content}</span>
        </>
      )
    },
    type: {
      header: t('tables.common.type'),
      cell: (feedback) => formatEnumLabel(t, 'feedbackType', feedback.type)
    },
    resident: {
      header: t('tables.common.resident'),
      cell: (feedback) => (
        <>
          <strong>{feedback.residentHeadName}</strong>
          <span className="table-subtext">{feedback.residentHeadEmail}</span>
        </>
      )
    },
    room: {
      header: t('tables.common.room'),
      cell: (feedback) => (
        <>
          <strong>{formatRoomLabel(feedback)}</strong>
          <span className="table-subtext">{feedback.buildingCode}</span>
        </>
      )
    },
    invoice: {
      header: t('tables.common.invoice'),
      cell: (feedback) => feedback.invoiceId ? (
        <>
          <strong>#{feedback.invoiceId}</strong>
          <span className="table-subtext">
            {formatDisplayMonth(feedback.invoiceMonth)} - {formatNumber(feedback.invoiceTotalAmount)}
          </span>
        </>
      ) : (
        t('common.notLinked')
      )
    },
    status: {
      header: t('tables.common.status'),
      cell: (feedback) => (
        <span className={getFeedbackStatusClass(feedback.status)}>
          {formatEnumLabel(t, 'feedbackStatus', feedback.status)}
        </span>
      )
    },
    reply: {
      header: t('tables.common.reply'),
      cell: (feedback) => (
        <>
          {feedback.reply || t('common.noReply')}
          {feedback.repliedByName && (
            <span className="table-subtext">{t('tables.feedbacks.by', { name: feedback.repliedByName })}</span>
          )}
        </>
      )
    },
    created: {
      header: t('tables.common.created'),
      cell: (feedback) => formatFeedbackDateTime(feedback.createdAt)
    },
    actions: {
      header: t('tables.common.actions'),
      cell: (feedback) => renderActions(feedback)
    }
  };

  return (
    <div className="table-wrap">
      <table className={`data-table feedback-table ${activeColumns.length <= 6 ? 'compact-feedback-table' : ''}`}>
        <thead>
          <tr>
            {activeColumns.map((columnKey) => (
              <th key={columnKey} className={`feedback-col-${columnKey}`}>
                {columns[columnKey].header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {feedbacks.map((feedback) => {
            const expandedContent = renderExpandedRow?.(feedback);

            return (
              <Fragment key={feedback.id}>
                <tr className={expandedContent ? 'feedback-expanded-parent-row' : undefined}>
                  {activeColumns.map((columnKey) => (
                    <td key={columnKey} className={`feedback-col-${columnKey}`}>
                      {columns[columnKey].cell(feedback)}
                    </td>
                  ))}
                </tr>
                {expandedContent && (
                  <tr className="feedback-expanded-row">
                    <td colSpan={activeColumns.length}>{expandedContent}</td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
      {feedbacks.length === 0 && <div className="empty-state flat-empty-state">{t('tables.feedbacks.empty')}</div>}
    </div>
  );
}
