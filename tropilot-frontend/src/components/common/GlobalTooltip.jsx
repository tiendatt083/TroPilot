import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/** Tooltip toàn cục: tự đọc nhãn của các nút, đặt vị trí phù hợp và hiển thị ngoài cây giao diện chính. */
const TOOLTIP_OFFSET = 10;
const CURSOR_TOOLTIP_OFFSET = 14;
const TOOLTIP_TARGET_SELECTOR = [
  '[data-tooltip]',
  '.icon-action-button[aria-label]',
  '.table-icon-button[aria-label]',
  '.chat-icon-button[aria-label]',
  '.settings-icon-button[aria-label]',
  '.icon-button[aria-label]'
].join(', ');

/** Tìm phần tử cha gần nhất có thể hiển thị tooltip từ phần tử đang được trỏ tới. */
function findTooltipTarget(target) {
  if (!(target instanceof Element)) {
    return null;
  }

  return target.closest(TOOLTIP_TARGET_SELECTOR);
}

/** Lấy nội dung tooltip theo thứ tự ưu tiên từ các thuộc tính hỗ trợ. */
function getTooltipText(element) {
  return (
    element?.getAttribute('data-tooltip')?.trim() ||
    element?.getAttribute('aria-label')?.trim() ||
    element?.getAttribute('title')?.trim() ||
    element?.getAttribute('data-native-title')?.trim() ||
    ''
  );
}

/** Kiểm tra tooltip này có cần di chuyển theo con trỏ chuột hay không. */
function shouldFollowCursor(element) {
  return element?.getAttribute('data-tooltip-follow') === 'true';
}

/** Tạm cất title gốc để tránh trình duyệt hiển thị tooltip mặc định trùng với tooltip của ứng dụng. */
function suppressNativeTooltip(element) {
  if (!element?.hasAttribute('title')) {
    return;
  }

  element.setAttribute('data-native-title', element.getAttribute('title') || '');
  element.removeAttribute('title');
}

/** Trả lại title gốc khi người dùng không còn trỏ vào phần tử. */
function restoreNativeTooltip(element) {
  if (!element?.hasAttribute('data-native-title')) {
    return;
  }

  const title = element.getAttribute('data-native-title') || '';
  element.removeAttribute('data-native-title');

  if (title) {
    element.setAttribute('title', title);
  }
}

/** Tính vị trí tooltip: đi theo chuột hoặc ưu tiên đặt phía trên nút nếu còn chỗ. */
function getTooltipPosition(element, text, pointerPosition = null) {
  if (shouldFollowCursor(element) && pointerPosition) {
    return {
      left: pointerPosition.clientX + CURSOR_TOOLTIP_OFFSET,
      placement: 'cursor',
      text,
      top: pointerPosition.clientY + CURSOR_TOOLTIP_OFFSET
    };
  }

  const rect = element.getBoundingClientRect();
  const canShowAbove = rect.top > 48;
  const left = rect.left + rect.width / 2;
  const top = canShowAbove
    ? rect.top - TOOLTIP_OFFSET
    : rect.bottom + TOOLTIP_OFFSET;

  return {
    left,
    placement: canShowAbove ? 'above' : 'below',
    text,
    top
  };
}

/** Lắng nghe sự kiện toàn trang để hiển thị một tooltip thống nhất cho mọi nút hỗ trợ. */
export default function GlobalTooltip() {
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    let activeElement = null;
    let lastPointerPosition = null;

    const updateTooltip = () => {
      const text = getTooltipText(activeElement);

      if (!activeElement || !document.documentElement.contains(activeElement) || !text) {
        restoreNativeTooltip(activeElement);
        activeElement = null;
        setTooltip(null);
        return;
      }

      setTooltip(getTooltipPosition(activeElement, text, lastPointerPosition));
    };

    const showTooltip = (event) => {
      const element = findTooltipTarget(event.target);
      const text = getTooltipText(element);

      if (!element || !text) {
        return;
      }

      activeElement = element;
      lastPointerPosition = event.pointerType
        ? { clientX: event.clientX, clientY: event.clientY }
        : null;
      suppressNativeTooltip(element);
      setTooltip(getTooltipPosition(element, text, lastPointerPosition));
    };

    const moveTooltip = (event) => {
      if (!activeElement || !shouldFollowCursor(activeElement)) {
        return;
      }

      lastPointerPosition = { clientX: event.clientX, clientY: event.clientY };
      updateTooltip();
    };

    const hideTooltip = (event) => {
      if (
        activeElement &&
        event.relatedTarget instanceof Node &&
        activeElement.contains(event.relatedTarget)
      ) {
        return;
      }

      restoreNativeTooltip(activeElement);
      activeElement = null;
      lastPointerPosition = null;
      setTooltip(null);
    };

    document.addEventListener('pointerover', showTooltip);
    document.addEventListener('pointermove', moveTooltip);
    document.addEventListener('pointerout', hideTooltip);
    document.addEventListener('focusin', showTooltip);
    document.addEventListener('focusout', hideTooltip);
    window.addEventListener('resize', updateTooltip);
    window.addEventListener('scroll', updateTooltip, true);

    return () => {
      restoreNativeTooltip(activeElement);
      document.removeEventListener('pointerover', showTooltip);
      document.removeEventListener('pointermove', moveTooltip);
      document.removeEventListener('pointerout', hideTooltip);
      document.removeEventListener('focusin', showTooltip);
      document.removeEventListener('focusout', hideTooltip);
      window.removeEventListener('resize', updateTooltip);
      window.removeEventListener('scroll', updateTooltip, true);
    };
  }, []);

  if (!tooltip) {
    return null;
  }

  return createPortal(
    <div
      aria-hidden="true"
      className={`global-action-tooltip is-${tooltip.placement}`}
      style={{ left: tooltip.left, top: tooltip.top }}
    >
      {tooltip.text}
    </div>,
    document.body
  );
}
