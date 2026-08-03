import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDisplayDate } from '../utils/dateFormat.js';
import { openFileUrl, resolveFileUrl } from '../utils/fileUrl.js';

const EMPTY_REQUEST = {
  title: '',
  content: '',
  assignedToId: '',
  image: null
};

/** Khung hiển thị và cập nhật lịch sử bảo trì của một thiết bị. */
export default function EquipmentMaintenancePanel({
  equipment,
  history,
  historyLoading,
  hideHeader = false,
  requestLoading,
  requireAssignee = false,
  staffUsers = [],
  showHistory,
  submitLabel,
  submittingLabel,
  onClose,
  onSubmit
}) {
  const { t } = useTranslation();
  const [request, setRequest] = useState(EMPTY_REQUEST);
  const [formKey, setFormKey] = useState(0);

  if (!equipment) {
    return null;
  }

  const handleChange = (event) => {
    const { name, value, files } = event.target;
    setRequest((current) => ({
      ...current,
      [name]: files ? files[0] || null : value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const succeeded = await onSubmit(request);

    if (succeeded) {
      setRequest(EMPTY_REQUEST);
      setFormKey((current) => current + 1);
    }
  };

  return (
    <section className="equipment-maintenance-panel">
      {!hideHeader && (
        <div className="building-section-header">
          <div>
            <span className="eyebrow">
              {showHistory ? t('equipment.history.eyebrow') : t('equipment.request.eyebrow')}
            </span>
            <h2>
              {showHistory ? t('equipment.history.title') : t('equipment.request.title')}: {equipment.name}
            </h2>
          </div>
          <button className="secondary-button inline-button" type="button" onClick={onClose}>
            {t('equipment.actions.closePanel')}
          </button>
        </div>
      )}

      {showHistory ? (
        <div className="equipment-history-list">
          {historyLoading ? (
            <div className="empty-state">{t('equipment.history.loading')}</div>
          ) : (
            <>
              {history.map((item) => (
                <article key={item.id} className="equipment-history-item">
                  <div>
                    <strong>{formatDisplayDate(item.maintenanceDate, t('common.notProvided'))}</strong>
                    <span>{item.performedByName || t('common.notAssigned')}</span>
                  </div>
                  <p>{item.resultNote || t('details.noResultNote')}</p>
                  {item.resultImageUrl && (
                    <a
                      className="secondary-link"
                      href={resolveFileUrl(item.resultImageUrl)}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(event) => openFileUrl(item.resultImageUrl, event)}
                    >
                      {t('details.resultImage')}
                    </a>
                  )}
                </article>
              ))}
              {history.length === 0 && <div className="empty-state">{t('equipment.history.empty')}</div>}
            </>
          )}
        </div>
      ) : (
        <form key={formKey} className="panel-form equipment-request-form" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="equipmentRequestTitle">{t('equipment.request.fields.title')}</label>
            <input
              id="equipmentRequestTitle"
              name="title"
              value={request.title}
              maxLength="160"
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label htmlFor="equipmentRequestContent">{t('equipment.request.fields.content')}</label>
            <textarea
              id="equipmentRequestContent"
              name="content"
              rows="5"
              value={request.content}
              maxLength="2000"
              onChange={handleChange}
              required
            />
          </div>
          {requireAssignee && (
            <div>
              <label htmlFor="equipmentRequestAssignedTo">{t('equipment.request.fields.assignedStaff')}</label>
              <select
                id="equipmentRequestAssignedTo"
                name="assignedToId"
                value={request.assignedToId}
                onChange={handleChange}
                required
              >
                <option value="">{t('maintenance.admin.selectStaff')}</option>
                {staffUsers.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.fullName} - {staff.email}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label htmlFor="equipmentRequestImage">{t('equipment.request.fields.image')}</label>
            <input
              id="equipmentRequestImage"
              name="image"
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleChange}
            />
            <small className="field-help">{t('equipment.request.imageHelp')}</small>
          </div>
          <div className="equipment-request-action-row">
            <button className="equipment-request-submit-button" type="submit" disabled={requestLoading}>
              {requestLoading
                ? submittingLabel || t('equipment.request.submitting')
                : submitLabel || t('equipment.request.submit')}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
