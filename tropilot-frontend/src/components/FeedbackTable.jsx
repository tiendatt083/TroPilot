import {
  formatFeedbackDateTime,
  getFeedbackStatusClass,
  getFeedbackStatusLabel,
  getFeedbackTypeLabel
} from '../utils/feedbackOptions.js';

function formatNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue)
    ? numberValue.toLocaleString('en-US', { maximumFractionDigits: 2 })
    : value;
}

export default function FeedbackTable({ feedbacks, renderActions }) {
  const hasActions = Boolean(renderActions);

  return (
    <div className="table-wrap">
      <table className="data-table feedback-table">
        <thead>
          <tr>
            <th>Feedback</th>
            <th>Type</th>
            <th>Resident</th>
            <th>Room</th>
            <th>Invoice</th>
            <th>Status</th>
            <th>Reply</th>
            <th>Created</th>
            {hasActions && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {feedbacks.map((feedback) => (
            <tr key={feedback.id}>
              <td>
                <strong>{feedback.title}</strong>
                <span className="table-subtext">{feedback.content}</span>
              </td>
              <td>{getFeedbackTypeLabel(feedback.type)}</td>
              <td>
                <strong>{feedback.residentHeadName}</strong>
                <span className="table-subtext">{feedback.residentHeadEmail}</span>
              </td>
              <td>
                <strong>
                  {feedback.roomCode} - {feedback.roomName}
                </strong>
                <span className="table-subtext">{feedback.buildingCode}</span>
              </td>
              <td>
                {feedback.invoiceId ? (
                  <>
                    <strong>#{feedback.invoiceId}</strong>
                    <span className="table-subtext">
                      {feedback.invoiceMonth} - {formatNumber(feedback.invoiceTotalAmount)}
                    </span>
                  </>
                ) : (
                  'Not linked'
                )}
              </td>
              <td>
                <span className={getFeedbackStatusClass(feedback.status)}>
                  {getFeedbackStatusLabel(feedback.status)}
                </span>
              </td>
              <td>
                {feedback.reply || 'No reply'}
                {feedback.repliedByName && <span className="table-subtext">By {feedback.repliedByName}</span>}
              </td>
              <td>{formatFeedbackDateTime(feedback.createdAt)}</td>
              {hasActions && <td>{renderActions(feedback)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
      {feedbacks.length === 0 && <div className="empty-state flat-empty-state">No feedbacks found.</div>}
    </div>
  );
}
