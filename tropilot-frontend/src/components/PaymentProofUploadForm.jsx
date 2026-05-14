import { useState } from 'react';

export default function PaymentProofUploadForm({ invoiceId, loading, onSubmit }) {
  const [proofImage, setProofImage] = useState(null);
  const [note, setNote] = useState('');

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

  return (
    <form className="panel-form payment-proof-form" onSubmit={handleSubmit}>
      <label htmlFor="proofImage">Payment proof image</label>
      <input
        id="proofImage"
        name="proofImage"
        type="file"
        accept="image/jpeg,image/png"
        onChange={(event) => setProofImage(event.target.files?.[0] || null)}
        required
      />

      <label htmlFor="paymentNote">Payment note</label>
      <textarea
        id="paymentNote"
        name="paymentNote"
        rows="3"
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Optional payment note"
      />

      <button type="submit" disabled={loading || !proofImage}>
        {loading ? 'Uploading...' : 'Upload payment proof'}
      </button>
    </form>
  );
}
