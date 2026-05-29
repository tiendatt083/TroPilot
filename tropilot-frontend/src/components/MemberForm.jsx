import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const emptyForm = {
  fullName: '',
  phone: '',
  identityNumber: '',
  dateOfBirth: '',
  relationship: '',
  moveInDate: '',
  note: ''
};

export default function MemberForm({ initialValues, loading, submitLabel, onSubmit, onCancel }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    setForm({
      ...emptyForm,
      ...initialValues,
      dateOfBirth: initialValues?.dateOfBirth || '',
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
      identityNumber: form.identityNumber || null,
      dateOfBirth: form.dateOfBirth || null,
      relationship: form.relationship || null,
      moveInDate: form.moveInDate || null,
      note: form.note || null
    });
  };

  return (
    <form className="panel-form" onSubmit={handleSubmit}>
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

      <div className="form-grid">
        <div>
          <label htmlFor="identityNumber">{t('forms.member.identityNumber')}</label>
          <input
            id="identityNumber"
            name="identityNumber"
            value={form.identityNumber || ''}
            onChange={handleChange}
            maxLength={60}
          />
        </div>
        <div>
          <label htmlFor="relationship">{t('forms.member.relationship')}</label>
          <input
            id="relationship"
            name="relationship"
            value={form.relationship || ''}
            onChange={handleChange}
            maxLength={80}
          />
        </div>
      </div>

      <div className="form-grid">
        <div>
          <label htmlFor="dateOfBirth">{t('forms.member.dateOfBirth')}</label>
          <input
            id="dateOfBirth"
            name="dateOfBirth"
            type="date"
            value={form.dateOfBirth || ''}
            onChange={handleChange}
          />
        </div>
        <div>
          <label htmlFor="moveInDate">{t('forms.member.moveInDate')}</label>
          <input
            id="moveInDate"
            name="moveInDate"
            type="date"
            value={form.moveInDate || ''}
            onChange={handleChange}
          />
        </div>
      </div>

      <label htmlFor="note">{t('tables.common.note')}</label>
      <textarea id="note" name="note" value={form.note || ''} onChange={handleChange} maxLength={1000} rows="4" />

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
