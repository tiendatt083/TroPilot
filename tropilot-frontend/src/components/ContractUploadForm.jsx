import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import LineIcon from './common/LineIcon.jsx';

export default function ContractUploadForm({
  loading,
  onSubmit,
  onFileChange,
  errorMessage,
  successMessage,
  submitLabel,
  loadingLabel,
}) {
  const { t } = useTranslation();
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [dragging, setDragging] = useState(false);
  const resolvedSubmitLabel = submitLabel || t('contracts.upload.submit');
  const resolvedLoadingLabel = loadingLabel || t('contracts.upload.uploading');
  const maxFileSize = 10 * 1024 * 1024;
  const maxSizeMessage = t('contracts.upload.maxSizeError', {
    defaultValue: 'Dung lượng hợp đồng không được vượt quá 10 MB.'
  });

  const selectFile = (selectedFile) => {
    onFileChange?.();

    if (!selectedFile) {
      setFile(null);
      setFileError('');
      return;
    }

    if (selectedFile.size > maxFileSize) {
      setFile(null);
      setFileError(maxSizeMessage);
      return;
    }

    setFile(selectedFile);
    setFileError('');
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!file || fileError) {
      return;
    }
    onSubmit(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    selectFile(event.dataTransfer.files?.[0] || null);
  };

  return (
    <form className="panel-form upload-form contract-upload-form" onSubmit={handleSubmit}>
      {(fileError || errorMessage || successMessage) && (
        <div className={successMessage ? 'contract-upload-feedback success' : 'contract-upload-feedback error'}>
          {successMessage || fileError || errorMessage}
        </div>
      )}
      <div
        className={['contract-upload-dropzone', dragging ? 'is-dragging' : ''].filter(Boolean).join(' ')}
        onDragLeave={() => setDragging(false)}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDrop={handleDrop}
      >
        <LineIcon name="uploadCloud" className="contract-upload-icon" />
        <strong>{t('contracts.upload.dropHint', { defaultValue: 'Kéo thả tệp vào đây' })}</strong>
        <span>{t('common.or', { defaultValue: 'hoặc' })}</span>
        <input
          className="contract-upload-input"
          id="contractFile"
          name="contractFile"
          type="file"
          accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
          onChange={(event) => selectFile(event.target.files?.[0] || null)}
        />
        <label className="contract-upload-select-button" htmlFor="contractFile">
          <LineIcon name="fileText" />
          {t('contracts.upload.chooseFile', { defaultValue: 'Chọn tệp' })}
        </label>
        {file && <p className="contract-upload-file-name">{file.name}</p>}
        <p className="muted-text">{t('contracts.upload.help')}</p>
      </div>
      <button className="contract-upload-submit" type="submit" disabled={loading || !file || Boolean(fileError)}>
        {loading ? resolvedLoadingLabel : resolvedSubmitLabel}
      </button>
    </form>
  );
}
