import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as contactApi from '../api/contactApi.js';
import LineIcon from '../components/common/LineIcon.jsx';
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
  phones: [createEmptyPhone()]
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
      : [createEmptyPhone()]
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
        }))
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
      <div className="contact-shell">
        <header className="contact-hero">
          <div className="contact-hero-copy">
            <span className="page-eyebrow">{t('contact.eyebrow')}</span>
            <h1>{t('contact.title')}</h1>
            <p>{t('contact.description')}</p>
          </div>
          <ContactHeroIllustration />
        </header>

        {message && <div className="alert success-alert">{message}</div>}
        {error && <div className="alert error-alert">{error}</div>}

        {loading ? (
          <div className="empty-state contact-loading-state">{t('contact.messages.loading')}</div>
        ) : (
          <div className="contact-layout">
            {isAdmin ? (
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
            ) : (
              <ContactSummary contact={contact} t={t} />
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function ContactSummary({ contact, t }) {
  if (!contact?.configured) {
    return (
      <section className="settings-panel contact-summary-panel contact-card">
        <div className="empty-state compact-empty-state">
          {t('contact.messages.notConfigured')}
        </div>
      </section>
    );
  }

  return (
    <section className="settings-panel contact-summary-panel contact-card">
      <ContactSectionHeading
        eyebrow={t('contact.sections.details')}
        icon="user"
        title={t('contact.summaryTitle')}
      />

      <dl className="contact-detail-list">
        <ContactDetail
          icon="mail"
          label={t('contact.fields.email')}
          value={<a href={`mailto:${contact.email}`}>{contact.email}</a>}
        />
        <ContactDetail
          icon="mapPin"
          label={t('contact.fields.officeAddress')}
          value={contact.officeAddress}
        />
        <ContactDetail
          icon="clock"
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

      <section className="contact-phone-section">
        <ContactSectionHeading
          eyebrow={t('contact.sections.phones')}
          icon="phone"
          title={t('contact.phoneListTitle')}
        />
        <div className="contact-phone-list">
          {contact.phones.map((phone, index) => (
            <a
              className="contact-phone-card"
              href={phoneHref(phone.phoneNumber)}
              key={`${phone.displayName}-${phone.phoneNumber}-${index}`}
            >
              <LineIcon className="contact-card-icon" name="phone" />
              <span>{phone.displayName}</span>
              <strong>{phone.phoneNumber}</strong>
            </a>
          ))}
        </div>
      </section>
    </section>
  );
}

function ContactDetail({ icon, label, value }) {
  return (
    <div>
      <dt>
        <LineIcon className="contact-detail-icon" name={icon} />
        <span>{label}</span>
      </dt>
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
      <section className="contact-card">
        <ContactSectionHeading
          eyebrow={t('contact.sections.edit')}
          icon="user"
          title={t('contact.editTitle')}
        />

        <div className="form-grid contact-general-grid">
          <div className="contact-field contact-email-field">
            <label htmlFor="contactEmail">{t('contact.fields.email')}</label>
            <ContactFieldControl icon="mail">
              <input
                id="contactEmail"
                maxLength={160}
                name="email"
                required
                type="email"
                value={form.email}
                onChange={onFieldChange}
              />
            </ContactFieldControl>
          </div>

          <div className="contact-field">
            <label htmlFor="contactWorkingStartTime">
              {t('contact.fields.workingStartTime')}
            </label>
            <ContactFieldControl icon="clock">
              <input
                id="contactWorkingStartTime"
                inputMode="numeric"
                maxLength={5}
                name="workingStartTime"
                pattern="([01][0-9]|2[0-3]):[0-5][0-9]"
                placeholder="08:00"
                required
                type="text"
                value={form.workingStartTime}
                onChange={onFieldChange}
              />
            </ContactFieldControl>
          </div>

          <div className="contact-field">
            <label htmlFor="contactWorkingEndTime">
              {t('contact.fields.workingEndTime')}
            </label>
            <ContactFieldControl icon="clock">
              <input
                id="contactWorkingEndTime"
                inputMode="numeric"
                maxLength={5}
                name="workingEndTime"
                pattern="([01][0-9]|2[0-3]):[0-5][0-9]"
                placeholder="17:00"
                required
                type="text"
                value={form.workingEndTime}
                onChange={onFieldChange}
              />
            </ContactFieldControl>
          </div>

          <div className="form-grid-wide contact-field">
            <label htmlFor="contactOfficeAddress">{t('contact.fields.officeAddress')}</label>
            <ContactFieldControl icon="mapPin">
              <input
                id="contactOfficeAddress"
                maxLength={255}
                name="officeAddress"
                required
                value={form.officeAddress}
                onChange={onFieldChange}
              />
            </ContactFieldControl>
          </div>
        </div>
      </section>

      <section className="contact-card contact-phone-editor">
        <div className="contact-phone-editor-header">
          <ContactSectionHeading
            eyebrow={t('contact.sections.phones')}
            icon="phone"
            title={t('contact.phoneEditorTitle')}
          />
          <button
            className="secondary-button compact-button contact-add-phone-button"
            disabled={form.phones.length >= 20}
            type="button"
            onClick={onAddPhone}
          >
            <LineIcon className="contact-button-icon" name="plus" />
            {t('contact.actions.addPhone')}
          </button>
        </div>

        <div className="contact-phone-table">
          <div className="contact-phone-table-head" aria-hidden="true">
            <span>{t('contact.fields.phoneName')}</span>
            <span>{t('contact.fields.phoneNumber')}</span>
            <span />
          </div>
          <div className="contact-phone-editor-list">
            {form.phones.map((phone, index) => (
              <div className="contact-phone-editor-row" key={index}>
                <div>
                  <label className="visually-hidden" htmlFor={`contactPhoneName-${index}`}>
                    {t('contact.fields.phoneName')}
                  </label>
                  <ContactFieldControl icon="user">
                    <input
                      id={`contactPhoneName-${index}`}
                      maxLength={100}
                      required
                      value={phone.displayName}
                      onChange={(event) => onPhoneChange(index, 'displayName', event.target.value)}
                    />
                  </ContactFieldControl>
                </div>
                <div>
                  <label className="visually-hidden" htmlFor={`contactPhoneNumber-${index}`}>
                    {t('contact.fields.phoneNumber')}
                  </label>
                  <ContactFieldControl icon="phone">
                    <input
                      id={`contactPhoneNumber-${index}`}
                      inputMode="tel"
                      maxLength={30}
                      required
                      value={phone.phoneNumber}
                      onChange={(event) => onPhoneChange(index, 'phoneNumber', event.target.value)}
                    />
                  </ContactFieldControl>
                </div>
                <button
                  aria-label={t('contact.actions.removePhoneNamed', {
                    name: phone.displayName || index + 1
                  })}
                  className="icon-action-button icon-action-danger contact-remove-phone-button"
                  disabled={form.phones.length === 1}
                  title={t('contact.actions.removePhone')}
                  type="button"
                  onClick={() => onRemovePhone(index)}
                >
                  <LineIcon name="trash" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="contact-submit-row">
        <button className="contact-save-button" disabled={saving} type="submit">
          <LineIcon className="contact-button-icon" name="save" />
          {saving ? t('contact.actions.saving') : t('contact.actions.save')}
        </button>
      </div>
    </form>
  );
}

function ContactSectionHeading({ eyebrow, icon, title }) {
  return (
    <div className="contact-section-heading">
      <span className="contact-section-icon">
        <LineIcon name={icon} />
      </span>
      <div>
        {eyebrow && <span className="section-eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
      </div>
    </div>
  );
}

function ContactFieldControl({ children, icon }) {
  return (
    <div className="contact-field-control">
      <LineIcon className="contact-field-icon" name={icon} />
      {children}
    </div>
  );
}

function ContactHeroIllustration() {
  return (
    <div className="contact-hero-art" aria-hidden="true">
      <svg viewBox="0 0 220 150" role="img">
        <circle cx="118" cy="72" r="64" />
        <path d="M66 66h88v58H66z" className="hero-envelope" />
        <path d="m66 67 44 35 44-35" className="hero-envelope-line" />
        <path d="M81 37h62l18 18v40H81z" className="hero-paper" />
        <path d="M143 37v19h18" className="hero-paper-line" />
        <path d="M96 57h34" className="hero-paper-line" />
        <path d="M96 74h46" className="hero-paper-line" />
        <path d="M172 34h28a10 10 0 0 1 10 10v12a10 10 0 0 1-10 10h-12l-12 11v-11h-4a10 10 0 0 1-10-10V44a10 10 0 0 1 10-10Z" className="hero-bubble" />
        <path d="M177 50h4M187 50h4M197 50h4" className="hero-bubble-dots" />
        <path d="M32 128c12-17 28-16 38 0" className="hero-plant" />
        <path d="M34 128c-4-17 4-28 19-33 3 16-3 27-19 33Z" className="hero-leaf" />
        <path d="M178 128c9-20 24-25 39-14-8 16-20 22-39 14Z" className="hero-leaf" />
      </svg>
    </div>
  );
}
