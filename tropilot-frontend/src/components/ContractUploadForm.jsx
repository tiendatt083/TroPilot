import { useState } from 'react';

export default function ContractUploadForm({ loading, onSubmit }) {
  const [file, setFile] = useState(null);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(file);
  };

  return (
    <form className="panel-form upload-form" onSubmit={handleSubmit}>
      <label htmlFor="contractFile">Contract file</label>
      <input
        id="contractFile"
        name="contractFile"
        type="file"
        accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
        onChange={(event) => setFile(event.target.files?.[0] || null)}
        required
      />
      <p className="muted-text">Allowed file types: jpg, jpeg, png, pdf. Maximum size: 10 MB.</p>
      <button type="submit" disabled={loading || !file}>
        {loading ? 'Uploading...' : 'Upload contract'}
      </button>
    </form>
  );
}
