import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const TOOLTIP_OFFSET = 10;
const CURSOR_TOOLTIP_OFFSET = 14;

function findTooltipTarget(target) {
  if (!(target instanceof Element)) {
    return null;
  }

  return target.closest('[data-tooltip]');
}

function getTooltipText(element) {
  return element?.getAttribute('data-tooltip')?.trim() || '';
}

function shouldFollowCursor(element) {
  return element?.getAttribute('data-tooltip-follow') === 'true';
}

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

export default function GlobalTooltip() {
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    let activeElement = null;
    let lastPointerPosition = null;

    const updateTooltip = () => {
      const text = getTooltipText(activeElement);

      if (!activeElement || !document.documentElement.contains(activeElement) || !text) {
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
