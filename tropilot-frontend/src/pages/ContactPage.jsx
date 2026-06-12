import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as contactApi from '../api/contactApi.js';
import PageHeader from '../components/PageHeader.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const createEmptyPhone = () => ({
  displayName: '',
  phoneNumber: ''
});

const createEmptyForm = () => ({
  email: '',
  officeAddress: '',
  workingStartTime: '',
  workingEndTime: '',
  phones: [createEmptyPhone()],
  currentPassword: ''
});

function contactToForm(contact) {
  return {
    email: contact?.email || '',
    officeAddress: contact?.officeAddress || '',
    workingStartTime: contact?.workingStartTime?.slice(0, 5) || '',
    workingEndTime: contact?.workingEndTime?.slice(0, 5) || '',
    phones: contact?.phones?.length
      ? contact.phones.map((phone) => ({
          displayName: phone.displayName || '',
          phoneNumber: phone.phoneNumber || ''
        }))
      : [createEmptyPhone()],
    currentPassword: ''
  };
}

function phoneHref(phoneNumber) {
  return `tel:${phoneNumber.replace(/[^\d+]/g, '')}`;
}

export default function ContactPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [contact, setContact] = useState(null);
  const [form, setForm] = useState(createEmptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    contactApi
      .getSystemContact()
      .then((response) => {
        if (!active) {
          return;
        }

        setContact(response.data);
        setForm(contactToForm(response.data));
      })
      .catch((apiError) => {
        if (active) {
          setError(apiError.response?.data?.message || t('contact.messages.loadError'));
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
  }, [t]);

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handlePhoneChange = (index, field, value) => {
    setForm((current) => ({
      ...current,
      phones: current.phones.map((phone, phoneIndex) => (
        phoneIndex === index ? { ...phone, [field]: value } : phone
      ))
    }));
  };

  const addPhone = () => {
    setForm((current) => ({
      ...current,
      phones: current.phones.length < 20
        ? [...current.phones, createEmptyPhone()]
        : current.phones
    }));
  };

  const removePhone = (index) => {
    setForm((current) => ({
      ...current,
      phones: current.phones.filter((_, phoneIndex) => phoneIndex !== index)
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    if (form.workingEndTime <= form.workingStartTime) {
      setError(t('contact.messages.invalidWorkingHours'));
      return;
    }

    setSaving(true);

    try {
      const response = await contactApi.updateSystemContact({
        email: form.email.trim(),
        officeAddress: form.officeAddress.trim(),
        workingStartTime: form.workingStartTime,
        workingEndTime: form.workingEndTime,
        phones: form.phones.map((phone) => ({
          displayName: phone.displayName.trim(),
          phoneNumber: phone.phoneNumber.trim()
        })),
        currentPassword: form.currentPassword
      });

      setContact(response.data);
      setForm(contactToForm(response.data));
      setMessage(t('contact.messages.updated'));
    } catch (apiError) {
      setError(apiError.response?.data?.message || t('contact.messages.updateError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="content-section contact-page">
      <PageHeader eyebrow={t('contact.eyebrow')} title={t('contact.title')} />
      <p className="page-support-text">{t('contact.description')}</p>

      {message && <div className="alert success-alert">{message}</div>}
      {error && <div className="alert error-alert">{error}</div>}

      {loading ? (
        <div className="empty-state">{t('contact.messages.loading')}</div>
      ) : (
        <div className={`contact-layout${isAdmin ? ' is-editable' : ''}`}>
          <ContactSummary contact={contact} t={t} />
          {isAdmin && (
            <ContactEditor
              form={form}
              saving={saving}
              t={t}
              onAddPhone={addPhone}
              onFieldChange={handleFieldChange}
              onPhoneChange={handlePhoneChange}
              onRemovePhone={removePhone}
              onSubmit={handleSubmit}
            />
          )}
        </div>
      )}
    </section>
  );
}

function ContactSummary({ contact, t }) {
  if (!contact?.configured) {
    return (
      <section className="settings-panel contact-summary-panel">
        <div className="empty-state compact-empty-state">
          {t('contact.messages.notConfigured')}
        </div>
      </section>
    );
  }

  return (
    <section className="settings-panel contact-summary-panel">
      <div className="contact-section-heading">
        <span className="section-eyebrow">{t('contact.sections.details')}</span>
        <h2>{t('contact.summaryTitle')}</h2>
      </div>

      <dl className="contact-detail-list">
        <ContactDetail
          label={t('contact.fields.email')}
          value={<a href={`mailto:${contact.email}`}>{contact.email}</a>}
        />
        <ContactDetail
          label={t('contact.fields.officeAddress')}
          value={contact.officeAddress}
        />
        <ContactDetail
          label={t('contact.fields.workingHours')}
          value={
            contact.workingStartTime && contact.workingEndTime
              ? t('contact.workingHoursRange', {
                  start: contact.workingStartTime.slice(0, 5),
                  end: contact.workingEndTime.slice(0, 5)
                })
              : contact.workingHours
          }
        />
      </dl>

      <div className="contact-phone-section">
        <div>
          <span className="section-eyebrow">{t('contact.sections.phones')}</span>
          <h3>{t('contact.phoneListTitle')}</h3>
        </div>
        <div className="contact-phone-list">
          {contact.phones.map((phone, index) => (
            <a
              className="contact-phone-card"
              href={phoneHref(phone.phoneNumber)}
              key={`${phone.displayName}-${phone.phoneNumber}-${index}`}
            >
              <span>{phone.displayName}</span>
              <strong>{phone.phoneNumber}</strong>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactDetail({ label, value }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function ContactEditor({
  form,
  saving,
  t,
  onAddPhone,
  onFieldChange,
  onPhoneChange,
  onRemovePhone,
  onSubmit
}) {
  return (
    <form className="panel-form contact-editor" onSubmit={onSubmit}>
      <div className="contact-section-heading">
        <span className="section-eyebrow">{t('contact.sections.edit')}</span>
        <h2>{t('contact.editTitle')}</h2>
      </div>

      <div className="form-grid">
        <div>
          <label htmlFor="contactEmail">{t('contact.fields.email')}</label>
          <input
            id="contactEmail"
            maxLength={160}
            name="email"
            required
            type="email"
            value={form.email}
            onChange={onFieldChange}
          />
        </div>

        <div className="form-grid-wide contact-working-hours">
          <div>
            <label htmlFor="contactWorkingStartTime">
              {t('contact.fields.workingStartTime')}
            </label>
            <input
              id="contactWorkingStartTime"
              name="workingStartTime"
              required
              type="time"
              value={form.workingStartTime}
              onChange={onFieldChange}
            />
          </div>

          <div>
            <label htmlFor="contactWorkingEndTime">
              {t('contact.fields.workingEndTime')}
            </label>
            <input
              id="contactWorkingEndTime"
              name="workingEndTime"
              min={form.workingStartTime}
              required
              type="time"
              value={form.workingEndTime}
              onChange={onFieldChange}
            />
          </div>
        </div>

        <div className="form-grid-wide">
          <label htmlFor="contactOfficeAddress">{t('contact.fields.officeAddress')}</label>
          <input
            id="contactOfficeAddress"
            maxLength={255}
            name="officeAddress"
            required
            value={form.officeAddress}
            onChange={onFieldChange}
          />
        </div>
      </div>

      <div className="contact-phone-editor">
        <div className="contact-phone-editor-header">
          <div>
            <span className="section-eyebrow">{t('contact.sections.phones')}</span>
            <h3>{t('contact.phoneEditorTitle')}</h3>
          </div>
          <button
            className="secondary-button compact-button"
            disabled={form.phones.length >= 20}
            type="button"
            onClick={onAddPhone}
          >
            {t('contact.actions.addPhone')}
          </button>
        </div>

        <div className="contact-phone-editor-list">
          {form.phones.map((phone, index) => (
            <div className="contact-phone-editor-row" key={index}>
              <div>
                <label htmlFor={`contactPhoneName-${index}`}>
                  {t('contact.fields.phoneName')}
                </label>
                <input
                  id={`contactPhoneName-${index}`}
                  maxLength={100}
                  required
                  value={phone.displayName}
                  onChange={(event) => onPhoneChange(index, 'displayName', event.target.value)}
                />
              </div>
              <div>
                <label htmlFor={`contactPhoneNumber-${index}`}>
                  {t('contact.fields.phoneNumber')}
                </label>
                <input
                  id={`contactPhoneNumber-${index}`}
                  inputMode="tel"
                  maxLength={30}
                  required
                  value={phone.phoneNumber}
                  onChange={(event) => onPhoneChange(index, 'phoneNumber', event.target.value)}
                />
              </div>
              <button
                aria-label={t('contact.actions.removePhoneNamed', {
                  name: phone.displayName || index + 1
                })}
                className="danger-button compact-button"
                disabled={form.phones.length === 1}
                type="button"
                onClick={() => onRemovePhone(index)}
              >
                {t('contact.actions.removePhone')}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="contactCurrentPassword">
          {t('contact.fields.currentPassword')}
        </label>
        <input
          id="contactCurrentPassword"
          autoComplete="current-password"
          name="currentPassword"
          required
          type="password"
          value={form.currentPassword}
          onChange={onFieldChange}
        />
        <span className="field-help">{t('contact.passwordHelp')}</span>
      </div>

      <button disabled={saving} type="submit">
        {saving ? t('contact.actions.saving') : t('contact.actions.save')}
      </button>
    </form>
  );
}
