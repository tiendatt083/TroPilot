import LineIcon from './LineIcon.jsx';

/** Nút đóng dùng chung cho hộp thoại, có nhãn hỗ trợ trình đọc màn hình. */
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
