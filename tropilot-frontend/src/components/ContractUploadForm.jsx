import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function ContractUploadForm({
  loading,
  onSubmit,
  submitLabel,
  loadingLabel,
}) {
  const { t } = useTranslation();
  const [file, setFile] = useState(null);
  const resolvedSubmitLabel = submitLabel || t('contracts.upload.submit');
  const resolvedLoadingLabel = loadingLabel || t('contracts.upload.uploading');

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(file);
  };

  return (
    <form className="panel-form upload-form" onSubmit={handleSubmit}>
      <label htmlFor="contractFile">{t('contracts.upload.file')}</label>
      <input
        id="contractFile"
        name="contractFile"
        type="file"
        accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
        onChange={(event) => setFile(event.target.files?.[0] || null)}
        required
      />
      <p className="muted-text">{t('contracts.upload.help')}</p>
      <button type="submit" disabled={loading || !file}>
        {loading ? resolvedLoadingLabel : resolvedSubmitLabel}
      </button>
    </form>
  );
}
