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
  /** Garante isolamento explícito de estado/pontuação em modo sandbox de tutorial */
  sandboxMode: {
    type: Boolean,
    default: true,
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

const ACTION_BADGE_MAP = {
  rotate_cw: "↻ 90°",
  rotate_ccw: "↺ 90°",
  flip_h: "⇄ Espelho H",
  flip_v: "⇅ Espelho V",
};

const actionBadgeLabel = computed(
  () => ACTION_BADGE_MAP[props.actionKey] || "➜",
);

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
  <div class="spatial-arena-wrapper" :data-sandbox="sandboxMode">
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

      <!-- Indicador direcional legível entre Original e Resultado -->
      <div class="arena-transform-bridge" aria-hidden="true">
        <span class="bridge-action-badge">{{ actionBadgeLabel }}</span>
        <svg
          class="bridge-arrow-svg"
          viewBox="0 0 44 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M2 8H39M33 2L40 8L33 14"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
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
            <div class="postit-top-band" aria-hidden="true"></div>
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
  gap: 10px;
  padding: 2px 0;
}

.arena-stage-slot {
  position: relative;
  width: clamp(98px, 27vw, 112px);
  aspect-ratio: 1 / 1;
  border-radius: 6px;
  border: 2px solid #94a3b8;
  box-shadow: inset 0 2px 4px rgba(15, 23, 42, 0.06);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 14px;
  transition:
    border-color 0.16s ease,
    background-color 0.16s ease,
    box-shadow 0.16s ease;
}

.arena-stage-slot.target-slot {
  border-style: dashed;
  border-color: #0284c7;
  background-color: #f0f9ff;
}

.arena-stage-slot.target-slot.is-drop-hot {
  border-style: solid;
  border-width: 2.5px;
  border-color: #0284c7;
  background-color: #e0f2fe;
  box-shadow:
    inset 0 0 0 2px rgba(14, 165, 233, 0.25),
    0 0 0 3px rgba(14, 165, 233, 0.22);
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
  font-family: var(--font-mono);
  font-size: 0.56rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  color: #475569;
  background: rgba(255, 255, 255, 0.94);
  padding: 1px 6px;
  border-radius: 3px;
  border: 1px solid #cbd5e1;
  z-index: 80;
  pointer-events: none;
}

.target-slot.is-drop-hot .slot-header-tag {
  color: #0369a1;
  border-color: #38bdf8;
  background: #e0f2fe;
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
  justify-content: center;
  gap: 4px;
  min-width: 58px;
}

.bridge-action-badge {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 700;
  color: #0369a1;
  background: #e0f2fe;
  border: 1.5px solid #38bdf8;
  padding: 3px 8px;
  border-radius: 4px;
  box-shadow: 0 2px 0 rgba(2, 132, 199, 0.18);
  white-space: nowrap;
}

.bridge-arrow-svg {
  width: 38px;
  height: 14px;
  color: #0284c7;
}

.piece-with-anchor {
  position: relative;
  width: 58px;
  height: 58px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.arena-sprite-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  image-rendering: pixelated;
  filter: drop-shadow(0 2px 4px rgba(15, 23, 42, 0.16));
  pointer-events: none;
}

.empty-target-placeholder {
  width: 56px;
  height: 56px;
  border-radius: 6px;
  border: 2px dashed rgba(2, 132, 199, 0.38);
  display: flex;
  align-items: center;
  justify-content: center;
}

.question-mark-sym {
  font-family: var(--font-mono);
  font-size: 1.5rem;
  font-weight: 700;
  color: #0284c7;
}

/* 2. BANDEJA DE 3 POST-ITS ARRASTÁVEIS / CLICÁVEIS */
.options-choice-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.options-section-label {
  font-size: 0.72rem;
  font-weight: 700;
  color: #334155;
  text-align: center;
}

.options-grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  width: 100%;
  max-width: 340px;
  margin: 0 auto;
}

.postit-home-slot {
  position: relative;
  aspect-ratio: 1 / 1;
  border-radius: 4px;
  background: rgba(148, 163, 184, 0.12);
  border: 1.5px dashed rgba(100, 116, 139, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Post-it real combinando com as peças do jogo Phaser */
.postit-option-btn {
  position: relative;
  width: 100%;
  height: 100%;
  background-color: #fef9c3;
  background-image: linear-gradient(
    170deg,
    rgba(255, 255, 255, 0.45) 0%,
    rgba(202, 138, 4, 0.06) 100%
  );
  border: 1.5px solid #eab308;
  border-radius: 3px;
  box-shadow:
    0 3px 0 #ca8a04,
    0 4px 8px rgba(15, 23, 42, 0.14);
  cursor: grab;
  touch-action: none;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px 8px 6px;
  user-select: none;
  -webkit-user-select: none;
  will-change: transform;
  overflow: visible;
}

.postit-top-band {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 14px;
  background: rgba(253, 224, 71, 0.85);
  border-bottom: 1px solid rgba(202, 138, 4, 0.25);
  border-top-left-radius: 2px;
  border-top-right-radius: 2px;
  pointer-events: none;
}

.postit-option-btn:hover {
  background-color: #fef08a;
  border-color: #ca8a04;
  box-shadow:
    0 4px 0 #a16207,
    0 6px 12px rgba(15, 23, 42, 0.18);
}

.postit-option-btn.is-dragging {
  cursor: grabbing;
  background-color: #fef08a;
  border-color: #0284c7;
  box-shadow: 0 12px 22px rgba(15, 23, 42, 0.26);
}

/* Contorno VERDE quando encaixado e CORRETO */
.postit-option-btn.is-placed-valid {
  background-color: var(--color-valid-bg);
  background-image: none;
  border-color: var(--color-valid-border);
  border-width: 2.5px;
  box-shadow:
    0 4px 10px rgba(22, 163, 74, 0.24),
    0 0 0 2px rgba(22, 163, 74, 0.18);
}

.postit-option-btn.is-placed-valid .postit-top-band {
  background: rgba(134, 239, 172, 0.8);
  border-bottom-color: rgba(22, 163, 74, 0.25);
}

/* Contorno VERMELHO quando encaixado e INCORRETO */
.postit-option-btn.is-placed-invalid {
  background-color: var(--color-invalid-bg);
  background-image: none;
  border-color: var(--color-invalid-border);
  border-width: 2.5px;
  box-shadow:
    0 4px 10px rgba(239, 68, 68, 0.24),
    0 0 0 2px rgba(239, 68, 68, 0.18);
}

.postit-option-btn.is-placed-invalid .postit-top-band {
  background: rgba(252, 165, 165, 0.8);
  border-bottom-color: rgba(239, 68, 68, 0.25);
}

.postit-option-btn.is-wrong-shake .option-piece-box {
  animation: lockShake 0.42s ease-in-out;
}

.option-letter-tag {
  position: absolute;
  top: 1px;
  left: 5px;
  font-family: var(--font-mono);
  font-size: 0.62rem;
  font-weight: 700;
  color: #854d0e;
  pointer-events: none;
  z-index: 2;
}

.postit-option-btn.is-placed-valid .option-letter-tag {
  color: var(--color-valid-shadow);
}

.postit-option-btn.is-placed-invalid .option-letter-tag {
  color: var(--color-invalid-shadow);
}

.option-piece-box {
  width: 52px;
  height: 52px;
  pointer-events: none;
}

.placed-status-stamp {
  position: absolute;
  bottom: -6px;
  right: -6px;
  width: 21px;
  height: 21px;
  border-radius: 50%;
  border: 2px solid #ffffff;
  color: #ffffff;
  font-size: 0.7rem;
  font-weight: 900;
  display: inline-grid;
  place-items: center;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.22);
  animation: stampPop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  pointer-events: none;
  z-index: 5;
}

.placed-status-stamp.stamp-valid {
  background: var(--color-valid-border);
}

.placed-status-stamp.stamp-invalid {
  background: var(--color-invalid-border);
}
</style>
