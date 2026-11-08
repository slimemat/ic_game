import { ref, onMounted, onBeforeUnmount, nextTick } from "vue";
import AudioManager from "../game/managers/AudioManager";

/**
 * Composable reutilizável (SOLID / DRY) para gerenciar Drag & Drop manual
 * e Auto-Drag por toque/clique entre uma bandeja de opções e um slot alvo.
 *
 * Mantém o elemento arrastável sempre vivo no DOM (usando translate3d),
 * evitando desaparecimentos abruptos e permitindo troca suave entre peças.
 *
 * @param {{
 *   onOptionPlaced?: (option: Object) => void,
 *   onOptionRemoved?: () => void,
 *   isDisabled?: () => boolean
 * }} options
 */
export function useSlotDragAndDrop({
  onOptionPlaced,
  onOptionRemoved,
  isDisabled = () => false,
} = {}) {
  const targetSlotRef = ref(null);
  const homeSlotRefs = ref({});

  // ID da opção atualmente encaixada dentro do slot RESULTADO (?)
  const placedOptionId = ref(null);
  // Coordenadas (dx, dy) relativas ao berço da peça encaixada até o centro do slot
  const placedCoordinates = ref({ x: 0, y: 0 });

  // Estado de arraste ativo com ponteiro (mouse/touch)
  const draggingOptionId = ref(null);
  const dragOffset = ref({ x: 0, y: 0 });
  const isPointerDragging = ref(false);
  const isSlotHot = ref(false);

  let pointerDownInfo = null;

  function setHomeSlotRef(optId, el) {
    if (el) {
      homeSlotRefs.value[optId] = el;
    }
  }

  function playSfx(key, volume = 0.5) {
    try {
      AudioManager.play(key, { volume });
    } catch (e) {}
  }

  /**
   * Calcula o vetor (dx, dy) do centro do berço de origem (homeSlot) até o centro do slot alvo.
   */
  function computeVectorToTargetSlot(optId) {
    const homeEl = homeSlotRefs.value[optId];
    const slotEl = targetSlotRef.value;
    if (!homeEl || !slotEl) return { x: 0, y: -115 };

    const homeRect = homeEl.getBoundingClientRect();
    const slotRect = slotEl.getBoundingClientRect();

    const homeCx = homeRect.left + homeRect.width / 2;
    const homeCy = homeRect.top + homeRect.height / 2;
    const slotCx = slotRect.left + slotRect.width / 2;
    const slotCy = slotRect.top + slotRect.height / 2;

    return {
      x: slotCx - homeCx,
      y: slotCy - homeCy,
    };
  }

  /**
   * Verifica se a peça deslocada em (offsetX, offsetY) está sobre o slot de destino.
   */
  function checkIsOverTargetSlot(optId, offsetX, offsetY) {
    const homeEl = homeSlotRefs.value[optId];
    const slotEl = targetSlotRef.value;
    if (!homeEl || !slotEl) return false;

    const homeRect = homeEl.getBoundingClientRect();
    const slotRect = slotEl.getBoundingClientRect();

    const pieceCx = homeRect.left + homeRect.width / 2 + offsetX;
    const pieceCy = homeRect.top + homeRect.height / 2 + offsetY;

    const slotCx = slotRect.left + slotRect.width / 2;
    const slotCy = slotRect.top + slotRect.height / 2;

    const limitX = slotRect.width * 0.8;
    const limitY = slotRect.height * 0.8;

    return (
      Math.abs(pieceCx - slotCx) <= limitX &&
      Math.abs(pieceCy - slotCy) <= limitY
    );
  }

  /**
   * Recalcula a posição da peça encaixada caso a janela seja redimensionada.
   */
  function refreshPlacedPosition() {
    if (placedOptionId.value) {
      placedCoordinates.value = computeVectorToTargetSlot(placedOptionId.value);
    }
  }

  /**
   * Posiciona programaticamente uma opção dentro do slot (ex: ao restaurar um passo já concluído).
   */
  async function setPlacedOption(optId) {
    draggingOptionId.value = null;
    isPointerDragging.value = false;
    isSlotHot.value = false;
    placedOptionId.value = optId || null;

    if (optId) {
      await nextTick();
      placedCoordinates.value = computeVectorToTargetSlot(optId);
    } else {
      placedCoordinates.value = { x: 0, y: 0 };
    }
  }

  function clearSlot() {
    pointerDownInfo = null;
    draggingOptionId.value = null;
    isPointerDragging.value = false;
    isSlotHot.value = false;
    placedOptionId.value = null;
    placedCoordinates.value = { x: 0, y: 0 };
    dragOffset.value = { x: 0, y: 0 };
  }

  /**
   * Encaixa a opção no slot RESULTADO (?) com transição suave e aciona o callback de validação.
   */
  function placeOptionIntoSlot(option) {
    draggingOptionId.value = null;
    isPointerDragging.value = false;
    isSlotHot.value = false;

    placedCoordinates.value = computeVectorToTargetSlot(option.id);
    placedOptionId.value = option.id;

    onOptionPlaced?.(option);
  }

  function handlePointerDown(option, event) {
    if (isDisabled()) return;
    if (event.button !== undefined && event.button !== 0) return;

    const isAlreadyInSlot = placedOptionId.value === option.id;
    const startOffset = isAlreadyInSlot
      ? { ...placedCoordinates.value }
      : { x: 0, y: 0 };

    pointerDownInfo = {
      option,
      startX: event.clientX,
      startY: event.clientY,
      startOffset,
      isAlreadyInSlot,
      hasExceededThreshold: false,
    };

    draggingOptionId.value = option.id;
    dragOffset.value = { ...startOffset };
    isPointerDragging.value = false;

    window.addEventListener("pointermove", onGlobalPointerMove);
    window.addEventListener("pointerup", onGlobalPointerUp);
    window.addEventListener("pointercancel", onGlobalPointerUp);
  }

  function onGlobalPointerMove(event) {
    if (!pointerDownInfo) return;

    const dx = event.clientX - pointerDownInfo.startX;
    const dy = event.clientY - pointerDownInfo.startY;
    const dist = Math.hypot(dx, dy);

    if (!pointerDownInfo.hasExceededThreshold && dist >= 8) {
      pointerDownInfo.hasExceededThreshold = true;
      isPointerDragging.value = true;
      playSfx("connect", 0.4);
    }

    if (pointerDownInfo.hasExceededThreshold) {
      const nextX = pointerDownInfo.startOffset.x + dx;
      const nextY = pointerDownInfo.startOffset.y + dy;
      dragOffset.value = { x: nextX, y: nextY };
      isSlotHot.value = checkIsOverTargetSlot(
        pointerDownInfo.option.id,
        nextX,
        nextY,
      );
    }
  }

  function onGlobalPointerUp(event) {
    window.removeEventListener("pointermove", onGlobalPointerMove);
    window.removeEventListener("pointerup", onGlobalPointerUp);
    window.removeEventListener("pointercancel", onGlobalPointerUp);

    if (!pointerDownInfo) return;

    const {
      option,
      startX,
      startY,
      startOffset,
      isAlreadyInSlot,
      hasExceededThreshold,
    } = pointerDownInfo;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    const dist = Math.hypot(dx, dy);

    pointerDownInfo = null;
    isPointerDragging.value = false;
    isSlotHot.value = false;

    // 1. Foi um TOQUE / CLIQUE (< 10px):
    if (!hasExceededThreshold || dist < 10) {
      draggingOptionId.value = null;
      if (isAlreadyInSlot && !option.isCorrect) {
        // Se tocou em uma peça incorreta que já estava no slot, devolve para a bandeja
        placedOptionId.value = null;
        placedCoordinates.value = { x: 0, y: 0 };
        playSfx("swipe", 0.45);
        onOptionRemoved?.();
        return;
      }
      // Faz o Auto-Drag automático da peça até o slot RESULTADO (?)
      placeOptionIntoSlot(option);
      return;
    }

    // 2. Foi um ARRASTE MANUAL: verifica se soltou sobre o slot RESULTADO (?)
    const finalX = startOffset.x + dx;
    const finalY = startOffset.y + dy;

    if (checkIsOverTargetSlot(option.id, finalX, finalY)) {
      placeOptionIntoSlot(option);
      return;
    }

    // 3. Soltou fora do slot: devolve suavemente para o berço de origem
    draggingOptionId.value = null;
    if (isAlreadyInSlot) {
      placedOptionId.value = null;
      placedCoordinates.value = { x: 0, y: 0 };
      onOptionRemoved?.();
    }
    playSfx("swipe", 0.45);
  }

  /**
   * Retorna o estilo inline (translate3d) para o card da opção.
   */
  function getCardTransformStyle(optId) {
    if (draggingOptionId.value === optId) {
      const { x, y } = dragOffset.value;
      const scale = isPointerDragging.value ? 1.1 : 1.02;
      return {
        transform: `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${scale})`,
        transition: isPointerDragging.value
          ? "none"
          : "transform 0.24s cubic-bezier(0.22, 1, 0.36, 1)",
        zIndex: 90,
      };
    }

    if (placedOptionId.value === optId) {
      const { x, y } = placedCoordinates.value;
      return {
        transform: `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(1)`,
        transition: "transform 0.24s cubic-bezier(0.22, 1, 0.36, 1)",
        zIndex: 75,
      };
    }

    return {
      transform: "translate3d(0px, 0px, 0) scale(1)",
      transition: "transform 0.24s cubic-bezier(0.22, 1, 0.36, 1)",
      zIndex: 5,
    };
  }

  onMounted(() => {
    window.addEventListener("resize", refreshPlacedPosition);
  });

  onBeforeUnmount(() => {
    window.removeEventListener("resize", refreshPlacedPosition);
    window.removeEventListener("pointermove", onGlobalPointerMove);
    window.removeEventListener("pointerup", onGlobalPointerUp);
    window.removeEventListener("pointercancel", onGlobalPointerUp);
  });

  return {
    targetSlotRef,
    placedOptionId,
    draggingOptionId,
    isPointerDragging,
    isSlotHot,
    setHomeSlotRef,
    setPlacedOption,
    clearSlot,
    placeOptionIntoSlot,
    handlePointerDown,
    getCardTransformStyle,
  };
}
