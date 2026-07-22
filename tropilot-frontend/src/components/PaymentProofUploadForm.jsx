import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

export default function PaymentProofUploadForm({ invoiceId, loading, onSubmit }) {
  const { t } = useTranslation();
  const fileInputRef = useRef(null);

  const handleFileChange = async (event) => {
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

  return (
    <div className="payment-proof-compact">
      <input
        ref={fileInputRef}
        id="proofImage"
        name="proofImage"
        type="file"
        accept="image/jpeg,image/png"
        onChange={handleFileChange}
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
