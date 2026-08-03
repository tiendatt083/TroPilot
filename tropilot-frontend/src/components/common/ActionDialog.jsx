import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ModalCloseButton from './ModalCloseButton.jsx';

/** Hộp thoại dùng chung cho các thao tác; đóng được bằng nút X, phím Escape hoặc bấm ra ngoài. */
export default function ActionDialog({
  children,
  className = '',
  eyebrow,
  labelledBy = 'action-dialog-title',
  onClose,
  open,
  title
}) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="account-modal-overlay" role="presentation" onMouseDown={onClose}>
      <section
        aria-labelledby={labelledBy}
        aria-modal="true"
        className={`account-detail-modal action-dialog ${className}`.trim()}
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="account-modal-header">
          <div>
            {eyebrow && <span className="section-eyebrow">{eyebrow}</span>}
            <h2 id={labelledBy}>{title}</h2>
          </div>
          <ModalCloseButton label={t('common.close')} onClick={onClose} />
        </div>
        {children}
      </section>
    </div>
  );
}
