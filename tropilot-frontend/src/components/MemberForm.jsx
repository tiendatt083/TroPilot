import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const emptyForm = {
  fullName: '',
  phone: '',
  email: '',
  relationship: '',
  moveInDate: ''
};

export default function MemberForm({ className = '', initialValues, loading, submitLabel, onSubmit, onCancel }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    setForm({
      ...emptyForm,
      ...initialValues,
      moveInDate: initialValues?.moveInDate || ''
    });
  }, [initialValues]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      fullName: form.fullName,
      phone: form.phone,
      email: form.email,
      relationship: form.relationship,
      moveInDate: form.moveInDate
    });
  };

  return (
    <form className={`panel-form ${className}`.trim()} onSubmit={handleSubmit}>
      <label htmlFor="fullName">{t('forms.member.fullName')}</label>
      <input
        id="fullName"
        name="fullName"
        value={form.fullName}
        onChange={handleChange}
        maxLength={120}
        required
      />

      <label htmlFor="phone">{t('forms.member.phone')}</label>
      <input id="phone" name="phone" value={form.phone} onChange={handleChange} maxLength={30} required />

      <label htmlFor="email">{t('forms.member.email')}</label>
      <input
        id="email"
        name="email"
        type="email"
        value={form.email || ''}
        onChange={handleChange}
        maxLength={120}
        required
      />

      <label htmlFor="relationship">{t('forms.member.relationship')}</label>
      <input
        id="relationship"
        name="relationship"
        value={form.relationship || ''}
        onChange={handleChange}
        maxLength={80}
        required
      />

      <label htmlFor="moveInDate">{t('forms.member.moveInDate')}</label>
      <input
        id="moveInDate"
        name="moveInDate"
        type="date"
        lang="en-GB"
        value={form.moveInDate || ''}
        onChange={handleChange}
        required
      />

      <div className="button-row form-button-row">
        {onCancel && (
          <button className="secondary-button inline-button" type="button" onClick={onCancel}>
            {t('common.cancel')}
          </button>
        )}
        <button type="submit" disabled={loading}>
          {loading ? t('common.saving') : submitLabel}
        </button>
      </div>
    </form>
  );
}
