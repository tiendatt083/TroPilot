import { useTranslation } from 'react-i18next';
import {
  formatFeedbackDateTime,
  getFeedbackStatusClass,
} from '../utils/feedbackOptions.js';
import { formatDisplayMonth } from '../utils/dateFormat.js';
import { formatEnumLabel } from '../utils/i18nFormat.js';
import { formatRoomLabel } from '../utils/roomDisplay.js';

function formatNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue)
    ? numberValue.toLocaleString('en-US', { maximumFractionDigits: 2 })
    : value;
}

export default function FeedbackTable({ feedbacks, renderActions }) {
  const { t } = useTranslation();
  const hasActions = Boolean(renderActions);

  return (
    <div className="table-wrap">
      <table className="data-table feedback-table">
        <thead>
          <tr>
            <th>{t('tables.feedbacks.title')}</th>
            <th>{t('tables.common.type')}</th>
            <th>{t('tables.common.resident')}</th>
            <th>{t('tables.common.room')}</th>
            <th>{t('tables.common.invoice')}</th>
            <th>{t('tables.common.status')}</th>
            <th>{t('tables.common.reply')}</th>
            <th>{t('tables.common.created')}</th>
            {hasActions && <th>{t('tables.common.actions')}</th>}
          </tr>
        </thead>
        <tbody>
          {feedbacks.map((feedback) => (
            <tr key={feedback.id}>
              <td>
                <strong>{feedback.title}</strong>
                <span className="table-subtext">{feedback.content}</span>
              </td>
              <td>{formatEnumLabel(t, 'feedbackType', feedback.type)}</td>
              <td>
                <strong>{feedback.residentHeadName}</strong>
                <span className="table-subtext">{feedback.residentHeadEmail}</span>
              </td>
              <td>
                <strong>{formatRoomLabel(feedback)}</strong>
                <span className="table-subtext">{feedback.buildingCode}</span>
              </td>
              <td>
                {feedback.invoiceId ? (
                  <>
                    <strong>#{feedback.invoiceId}</strong>
                    <span className="table-subtext">
                      {formatDisplayMonth(feedback.invoiceMonth)} - {formatNumber(feedback.invoiceTotalAmount)}
                    </span>
                  </>
                ) : (
                  t('common.notLinked')
                )}
              </td>
              <td>
                <span className={getFeedbackStatusClass(feedback.status)}>
                  {formatEnumLabel(t, 'feedbackStatus', feedback.status)}
                </span>
              </td>
              <td>
                {feedback.reply || t('common.noReply')}
                {feedback.repliedByName && (
                  <span className="table-subtext">{t('tables.feedbacks.by', { name: feedback.repliedByName })}</span>
                )}
              </td>
              <td>{formatFeedbackDateTime(feedback.createdAt)}</td>
              {hasActions && <td>{renderActions(feedback)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
      {feedbacks.length === 0 && <div className="empty-state flat-empty-state">{t('tables.feedbacks.empty')}</div>}
    </div>
  );
}
