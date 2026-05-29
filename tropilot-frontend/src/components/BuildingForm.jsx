import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const emptyForm = {
  buildingCode: '',
  name: '',
  address: '',
  floors: 1,
  description: ''
};

export default function BuildingForm({ initialValues, loading, submitLabel, onSubmit }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    setForm({
      ...emptyForm,
      ...initialValues,
      floors: initialValues?.floors || 1
    });
  }, [initialValues]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: name === 'floors' ? Number(value) : value
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(form);
  };

  return (
    <form className="panel-form" onSubmit={handleSubmit}>
      <label htmlFor="buildingCode">{t('forms.building.buildingCode')}</label>
      <input
        id="buildingCode"
        name="buildingCode"
        value={form.buildingCode}
        onChange={handleChange}
        maxLength={50}
        required
      />

      <label htmlFor="name">{t('forms.building.buildingName')}</label>
      <input
        id="name"
        name="name"
        value={form.name}
        onChange={handleChange}
        maxLength={160}
        required
      />

      <label htmlFor="address">{t('forms.building.address')}</label>
      <input
        id="address"
        name="address"
        value={form.address}
        onChange={handleChange}
        maxLength={255}
        required
      />

      <label htmlFor="floors">{t('forms.building.floors')}</label>
      <input
        id="floors"
        name="floors"
        type="number"
        min="1"
        value={form.floors}
        onChange={handleChange}
        required
      />

      <label htmlFor="description">{t('tables.common.description')}</label>
      <textarea
        id="description"
        name="description"
        value={form.description || ''}
        onChange={handleChange}
        maxLength={1000}
        rows="4"
      />

      <button type="submit" disabled={loading}>
        {loading ? t('common.saving') : submitLabel}
      </button>
    </form>
  );
}
