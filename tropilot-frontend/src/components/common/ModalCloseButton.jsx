import LineIcon from './LineIcon.jsx';

export default function ModalCloseButton({ label, onClick }) {
  return (
    <button
      aria-label={label}
      className="account-modal-close"
      title={label}
      type="button"
      onClick={onClick}
    >
      <LineIcon name="close" />
    </button>
  );
}
