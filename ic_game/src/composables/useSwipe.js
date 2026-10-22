/**
 * Detecta swipe horizontal em eventos de toque.
 * Ignora gestos majoritariamente verticais (rolagem).
 */
export function useSwipe({
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
  maxVerticalRatio = 0.6,
}) {
  let startX = 0;
  let startY = 0;
  let tracking = false;

  function onStart(event) {
    const touch = event.changedTouches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    tracking = true;
  }

  function onEnd(event) {
    if (!tracking) return;
    tracking = false;

    const touch = event.changedTouches[0];
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;

    if (Math.abs(dx) < threshold) return;
    if (Math.abs(dy) > Math.abs(dx) * maxVerticalRatio) return;

    if (dx < 0) onSwipeLeft?.();
    else onSwipeRight?.();
  }

  return { onStart, onEnd };
}
