import { formatDisplayDateTime } from '../utils/dateFormat.js';
import { resolveFileUrl } from '../utils/fileUrl.js';

export default function ContractFileHistoryList({ files }) {
  const previousFiles = Array.isArray(files) ? files : [];

  if (previousFiles.length === 0) {
    return null;
  }

  return (
    <section className="contract-history-panel">
      <div className="contract-history-header">
        <div>
          <span>Previous files</span>
          <strong>Previous contract files</strong>
        </div>
        <p>Use these files to compare older signed contract versions.</p>
      </div>

      <div className="contract-history-list">
        {previousFiles.map((file, index) => (
          <article className="contract-history-item" key={file.id || `${file.fileUrl}-${index}`}>
            <div>
              <strong>Previous contract #{previousFiles.length - index}</strong>
              <span>
                Replaced by {file.replacedByName || 'Admin'} on {formatDisplayDateTime(file.replacedAt, 'Not provided')}
              </span>
            </div>
            <a className="secondary-link" href={resolveFileUrl(file.fileUrl)} target="_blank" rel="noreferrer">
              Open previous file
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}
