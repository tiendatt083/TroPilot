import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function PaymentProofUploadForm({ compact = false, invoiceId, loading, onSubmit }) {
  const { t } = useTranslation();
  const fileInputRef = useRef(null);
  const [proofImage, setProofImage] = useState(null);
  const [note, setNote] = useState('');

  const handleCompactFileChange = async (event) => {
    const file = event.target.files?.[0] || null;

    if (!file) {
      return;
    }

    try {
      await onSubmit({ invoiceId, proofImage: file, note: '' });
      event.target.value = '';
    } catch {
      event.target.value = '';
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!proofImage) {
      return;
    }

    try {
      await onSubmit({ invoiceId, proofImage, note });
      setProofImage(null);
      setNote('');
      event.target.reset();
    } catch {
      // The parent page owns the visible API error message.
    }
  };

  if (compact) {
    return (
      <div className="payment-proof-compact">
        <input
          ref={fileInputRef}
          id="proofImage"
          name="proofImage"
          type="file"
          accept="image/jpeg,image/png"
          onChange={handleCompactFileChange}
        />
        <button
          className="button-link payment-proof-upload-button"
          type="button"
          disabled={loading}
          onClick={() => fileInputRef.current?.click()}
        >
          {loading ? t('forms.payment.uploading') : t('forms.payment.uploadProof')}
        </button>
      </div>
    );
  }

  return (
    <form className="panel-form payment-proof-form" onSubmit={handleSubmit}>
      <label htmlFor="proofImage">{t('forms.payment.proofImage')}</label>
      <input
        id="proofImage"
        name="proofImage"
        type="file"
        accept="image/jpeg,image/png"
        onChange={(event) => setProofImage(event.target.files?.[0] || null)}
        required
      />

      <label htmlFor="paymentNote">{t('forms.payment.note')}</label>
      <textarea
        id="paymentNote"
        name="paymentNote"
        rows="3"
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder={t('forms.payment.optionalNote')}
      />

      <button type="submit" disabled={loading || !proofImage}>
        {loading ? t('forms.payment.uploading') : t('forms.payment.uploadProof')}
      </button>
    </form>
  );
}
