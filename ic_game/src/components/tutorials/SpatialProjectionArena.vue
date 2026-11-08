<script setup>
import { computed, watch, ref } from "vue";
import spritepaintImg from "../../assets/images/spritepaint.png";
import { useSlotDragAndDrop } from "../../composables/useSlotDragAndDrop";

const props = defineProps({
  /** Lista das 3 alternativas do passo atual */
  options: {
    type: Array,
    required: true,
  },
  /** Chave da operação espacial ('rotate_cw' | 'rotate_ccw' | 'flip_h' | 'flip_v') */
  actionKey: {
    type: String,
    default: "rotate_cw",
  },
  /** ID da opção já posicionada neste passo (caso o jogador volte para rever o passo) */
  initialPlacedOptionId: {
    type: String,
    default: null,
  },
});

const emit = defineEmits(["option-placed", "option-removed"]);

const lastWrongPlacedId = ref(null);

const {
  targetSlotRef,
  placedOptionId,
  draggingOptionId,
  isSlotHot,
  setHomeSlotRef,
  setPlacedOption,
  placeOptionIntoSlot,
  handlePointerDown,
  getCardTransformStyle,
} = useSlotDragAndDrop({
  onOptionPlaced: (option) => {
    if (!option.isCorrect) {
      lastWrongPlacedId.value = option.id;
      setTimeout(() => {
        if (lastWrongPlacedId.value === option.id) {
          lastWrongPlacedId.value = null;
        }
      }, 460);
    } else {
      lastWrongPlacedId.value = null;
    }
    emit("option-placed", option);
  },
  onOptionRemoved: () => {
    lastWrongPlacedId.value = null;
    emit("option-removed");
  },
});

// Sincroniza quando o passo do tutorial muda
watch(
  () => [props.actionKey, props.initialPlacedOptionId],
  ([, newPlacedId]) => {
    lastWrongPlacedId.value = null;
    setPlacedOption(newPlacedId);
  },
  { immediate: true },
);

const placedOption = computed(() => {
  if (!placedOptionId.value) return null;
  return props.options.find((o) => o.id === placedOptionId.value) || null;
});

const isPlacedValid = computed(() => Boolean(placedOption.value?.isCorrect));
const isPlacedInvalid = computed(() =>
  Boolean(placedOption.value && !placedOption.value.isCorrect),
);

const actionBadgeLabel = computed(() => {
  if (props.actionKey === "rotate_cw") return "↷ 90°";
  if (props.actionKey === "rotate_ccw") return "↶ 90°";
  if (props.actionKey === "flip_h") return "⇄ Espelho H";
  if (props.actionKey === "flip_v") return "⇅ Espelho V";
  return "➜";
});

const slotHeaderText = computed(() => {
  if (isPlacedValid.value) return "CORRETO ✓";
  if (isPlacedInvalid.value) return "INCORRETO ✕";
  return "RESULTADO (?)";
});

function getPieceTransformStyle(piece) {
  if (!piece) return {};
  const angle = piece.angle || 0;
  const sx = piece.flipX ? -1 : 1;
  const sy = piece.flipY ? -1 : 1;
  return {
    transform: `rotate(${angle}deg) scaleX(${sx}) scaleY(${sy})`,
  };
}
</script>

<template>
  <div class="spatial-arena-wrapper">
    <!-- 1. PALCO DE PROJEÇÃO MENTAL: [ORIGINAL (0°)] ➜ [RESULTADO (?)] -->
    <section class="projection-arena">
      <!-- Quadro 1: Peça Original (0°) com Marcador de Topo ▲ -->
      <div class="arena-stage-slot original-slot blueprint-grid-surface">
        <span class="slot-header-tag">ORIGINAL (0°)</span>
        <div class="piece-with-anchor">
          <span class="spatial-top-anchor" aria-hidden="true">▲</span>
          <img
            :src="spritepaintImg"
            alt="Original 0°"
            class="arena-sprite-img"
            draggable="false"
          />
        </div>
      </div>

      <!-- Seta de Transformação Central -->
      <div class="arena-transform-bridge" aria-hidden="true">
        <span class="bridge-action-pill">{{ actionBadgeLabel }}</span>
        <span class="bridge-arrow">➜</span>
      </div>

      <!-- Quadro 2: Slot de Destino RESULTADO (?) -->
      <div
        ref="targetSlotRef"
        class="arena-stage-slot target-slot blueprint-grid-surface"
        :class="{
          'is-drop-hot': isSlotHot,
          'is-slot-valid': isPlacedValid,
          'is-slot-invalid': isPlacedInvalid,
        }"
      >
        <span class="slot-header-tag">
          {{ slotHeaderText }}
        </span>

        <!-- Ponto de interrogação visível apenas quando nenhuma peça está encaixada -->
        <div
          v-if="!placedOptionId"
          class="empty-target-placeholder"
          aria-hidden="true"
        >
          <span class="question-mark-sym">?</span>
        </div>
      </div>
    </section>

    <!-- 2. BANDEJA DE 3 POST-ITS ARRASTÁVEIS / CLICÁVEIS (Sempre vivos no DOM) -->
    <section class="options-choice-section">
      <span class="options-section-label">
        {{ $t("tutorials.desk.choose_option_label") }}
      </span>

      <div class="options-grid-3">
        <div
          v-for="(opt, oIdx) in options"
          :key="opt.id"
          :ref="(el) => setHomeSlotRef(opt.id, el)"
          class="postit-home-slot"
        >
          <div
            role="button"
            tabindex="0"
            class="postit-option-btn"
            :class="{
              'is-dragging': draggingOptionId === opt.id,
              'is-placed-valid': placedOptionId === opt.id && opt.isCorrect,
              'is-placed-invalid': placedOptionId === opt.id && !opt.isCorrect,
              'is-wrong-shake': lastWrongPlacedId === opt.id,
            }"
            :style="getCardTransformStyle(opt.id)"
            @pointerdown="handlePointerDown(opt, $event)"
            @keydown.enter.prevent="placeOptionIntoSlot(opt)"
            @keydown.space.prevent="placeOptionIntoSlot(opt)"
          >
            <div
              class="postit-tape-strip option-mini-tape"
              aria-hidden="true"
            />
            <span class="option-letter-tag">
              {{ String.fromCharCode(65 + oIdx) }}
            </span>

            <div
              class="piece-with-anchor option-piece-box"
              :style="getPieceTransformStyle(opt)"
            >
              <span class="spatial-top-anchor" aria-hidden="true">▲</span>
              <img
                :src="spritepaintImg"
                :alt="`Opção ${oIdx + 1}`"
                class="arena-sprite-img"
                draggable="false"
              />
            </div>

            <!-- Selo visual de validação (✓ verde ou ✕ vermelho) quando encaixado no slot -->
            <span
              v-if="placedOptionId === opt.id"
              class="placed-status-stamp"
              :class="opt.isCorrect ? 'stamp-valid' : 'stamp-invalid'"
              aria-hidden="true"
            >
              {{ opt.isCorrect ? "✓" : "✕" }}
            </span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.spatial-arena-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 1. PALCO DE PROJEÇÃO MENTAL */
.projection-arena {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 2px;
}

.arena-stage-slot {
  position: relative;
  width: 116px;
  aspect-ratio: 1 / 1;
  border-radius: 12px;
  border: 2px solid #cbd5e1;
  box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 14px;
  transition:
    border-color 0.18s ease,
    background-color 0.18s ease,
    box-shadow 0.18s ease;
}

.arena-stage-slot.target-slot {
  border-style: dashed;
  border-color: #0284c7;
  background-color: #f0f9ff;
}

.arena-stage-slot.target-slot.is-drop-hot {
  border-style: solid;
  border-width: 3px;
  border-color: var(--accent-color);
  background-color: #e0f2fe;
  box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.22);
}

.arena-stage-slot.target-slot.is-slot-valid {
  border-style: solid;
  border-width: 2.5px;
  border-color: var(--color-valid-border);
  background-color: #f0fdf4;
  box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.18);
}

.arena-stage-slot.target-slot.is-slot-invalid {
  border-style: solid;
  border-width: 2.5px;
  border-color: var(--color-invalid-border);
  background-color: #fef2f2;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.18);
}

.slot-header-tag {
  position: absolute;
  top: 4px;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  font-size: 0.56rem;
  font-weight: 800;
  color: #475569;
  background: rgba(255, 255, 255, 0.92);
  padding: 1px 6px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  z-index: 80;
  pointer-events: none;
}

.target-slot.is-slot-valid .slot-header-tag {
  color: var(--color-valid-shadow);
  border-color: #86efac;
  background: var(--color-valid-bg);
}

.target-slot.is-slot-invalid .slot-header-tag {
  color: var(--color-invalid-shadow);
  border-color: #fca5a5;
  background: var(--color-invalid-bg);
}

.arena-transform-bridge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.bridge-action-pill {
  font-size: 0.65rem;
  font-weight: 900;
  color: #0369a1;
  background: #e0f2fe;
  border: 1px solid #7dd3fc;
  padding: 2px 7px;
  border-radius: 999px;
  white-space: nowrap;
}

.bridge-arrow {
  font-size: 1.35rem;
  font-weight: 900;
  color: #0284c7;
  line-height: 1;
}

.piece-with-anchor {
  position: relative;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.arena-sprite-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  image-rendering: pixelated;
  filter: drop-shadow(0 3px 5px rgba(0, 0, 0, 0.16));
  pointer-events: none;
}

.empty-target-placeholder {
  width: 60px;
  height: 60px;
  border-radius: 10px;
  border: 2px dashed rgba(2, 132, 199, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
}

.question-mark-sym {
  font-size: 1.6rem;
  font-weight: 900;
  color: #0284c7;
}

/* 2. BANDEJA DE 3 POST-ITS ARRASTÁVEIS / CLICÁVEIS */
.options-choice-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.options-section-label {
  font-size: 0.7rem;
  font-weight: 800;
  color: #334155;
  text-align: center;
}

.options-grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  width: 100%;
  max-width: 360px;
  margin: 0 auto;
}

.postit-home-slot {
  position: relative;
  aspect-ratio: 1 / 1;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.06);
  border: 1.5px dashed rgba(100, 116, 139, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
}

.postit-option-btn {
  position: relative;
  width: 100%;
  height: 100%;
  background: #f8fafc;
  border: 2.5px solid #cbd5e1;
  border-radius: 12px;
  box-shadow: 0 3px 0 #94a3b8;
  cursor: grab;
  touch-action: none;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  user-select: none;
  -webkit-user-select: none;
  will-change: transform;
}

.postit-option-btn:hover {
  background: #fef9c3;
  border-color: var(--folder-border);
  box-shadow: 0 3px 0 var(--folder-shadow);
}

.postit-option-btn.is-dragging {
  cursor: grabbing;
  background: #fef9c3;
  border-color: var(--accent-color);
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.28);
}

/* Contorno VERDE quando encaixado e CORRETO */
.postit-option-btn.is-placed-valid {
  background: var(--color-valid-bg);
  border-color: var(--color-valid-border);
  border-width: 3px;
  box-shadow:
    0 4px 12px rgba(22, 163, 74, 0.25),
    0 0 0 2px rgba(22, 163, 74, 0.2);
}

/* Contorno VERMELHO quando encaixado e INCORRETO */
.postit-option-btn.is-placed-invalid {
  background: var(--color-invalid-bg);
  border-color: var(--color-invalid-border);
  border-width: 3px;
  box-shadow:
    0 4px 12px rgba(239, 68, 68, 0.25),
    0 0 0 2px rgba(239, 68, 68, 0.2);
}

.postit-option-btn.is-wrong-shake .option-piece-box {
  animation: lockShake 0.42s ease-in-out;
}

.option-mini-tape {
  top: -5px;
  width: 28px;
  height: 8px;
}

.option-letter-tag {
  position: absolute;
  top: 4px;
  left: 6px;
  font-size: 0.62rem;
  font-weight: 900;
  color: #64748b;
  pointer-events: none;
}

.option-piece-box {
  width: 58px;
  height: 58px;
  pointer-events: none;
}

.placed-status-stamp {
  position: absolute;
  bottom: -6px;
  right: -6px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid #ffffff;
  color: #ffffff;
  font-size: 0.72rem;
  font-weight: 900;
  display: inline-grid;
  place-items: center;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.22);
  animation: stampPop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  pointer-events: none;
}

.placed-status-stamp.stamp-valid {
  background: var(--color-valid-border);
}

.placed-status-stamp.stamp-invalid {
  background: var(--color-invalid-border);
}
</style>
