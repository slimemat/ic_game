<script setup>
import { computed } from "vue";
import VisualConceptDiagram from "./VisualConceptDiagram.vue";

/**
 * RardiHintPostIt: Exibe a "Cola Visual do Rardi" em formato de post-it rabiscado
 * quando o jogador abre o botão de Dica (?) nas fases espaciais, ou exibe o banner
 * padrão nas demais fases (ex.: padrões de cores), respeitando SRP e OCP.
 */
const props = defineProps({
  /** Texto de dica contextual da fase/sub-etapa atual */
  hintText: {
    type: String,
    required: true,
  },
  /** Metadados opcionais da cola visual do Rardi (retornados por resolveVisualHintForLevel) */
  visualHint: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["replay-tutorial"]);

const isMirrorConcept = computed(
  () =>
    props.visualHint?.concept === "flip_h" ||
    props.visualHint?.concept === "flip_v",
);

function handleReplayClick() {
  if (props.visualHint?.tutorialId) {
    emit("replay-tutorial", props.visualHint.tutorialId);
  }
}
</script>

<template>
  <!-- Modo 1: Post-it Visual do Rardi (Fases de Rotação e Transformação/Espelho) -->
  <div
    v-if="visualHint"
    class="rardi-hint-postit"
    :style="{ '--postit-bg': visualHint.color || '#fef08a' }"
    role="note"
  >
    <div class="postit-tape" aria-hidden="true"></div>

    <!-- Zona 1: Faixa superior dedicada ao conceito + referência curta -->
    <header class="postit-header">
      <span class="postit-concept-badge">
        📌 {{ $t(visualHint.titleKey) }}
      </span>
      <span
        v-if="visualHint.badgeKey"
        class="postit-ref-pill"
        :class="{ 'is-mirror': isMirrorConcept }"
      >
        {{ $t(visualHint.badgeKey) }}
      </span>
    </header>

    <!-- Zona 2: Diagrama animado clicável (abre "Rever Prática") + apoio visual e frase única -->
    <component
      :is="visualHint.tutorialId ? 'button' : 'div'"
      :type="visualHint.tutorialId ? 'button' : undefined"
      class="postit-diagram-trigger"
      :class="{ 'is-interactive': Boolean(visualHint.tutorialId) }"
      :aria-label="
        visualHint.tutorialId
          ? $t('tutorials.desk.btn_replay_short')
          : undefined
      "
      :title="
        visualHint.tutorialId
          ? $t('tutorials.desk.btn_replay_short')
          : undefined
      "
      @click.stop="handleReplayClick"
    >
      <VisualConceptDiagram
        class="postit-diagram"
        :concept="visualHint.concept"
        size="sm"
        :customDoodleUrl="visualHint.customDoodleUrl || null"
      />
      <span v-if="visualHint.tutorialId" class="diagram-replay-caption">
        ↺ {{ $t("tutorials.desk.btn_replay_micro") }}
      </span>
    </component>

    <div class="postit-copy">
      <div
        v-if="visualHint.sketchImages?.length"
        class="postit-sketch-strip"
        aria-hidden="true"
      >
        <template v-for="(sketch, sIdx) in visualHint.sketchImages" :key="sIdx">
          <div
            class="postit-sketch-item"
            :style="{ '--sketch-tilt': sketch.tilt || '-1.5deg' }"
          >
            <img
              :src="sketch.src"
              :alt="sketch.labelKey ? $t(sketch.labelKey) : ''"
              class="postit-sketch-img"
              draggable="false"
            />
            <span v-if="sketch.labelKey" class="postit-sketch-label">
              {{ $t(sketch.labelKey) }}
            </span>
          </div>
          <span
            v-if="sIdx < visualHint.sketchImages.length - 1"
            class="postit-sketch-arrow"
          >
            →
          </span>
        </template>
      </div>

      <p class="postit-level-hint">
        {{ hintText }}
      </p>
    </div>
  </div>

  <!-- Modo 2: Dica padrão limpa (Fases de Cores ou outros contextos sem diagrama espacial) -->
  <p v-else class="standard-hint-banner">
    <span class="hint-bulb" aria-hidden="true">💡</span>
    <span>{{ hintText }}</span>
  </p>
</template>

<style scoped>
.rardi-hint-postit {
  position: relative;
  width: 100%;
  margin-top: 8px;
  padding: 12px 13px 11px;
  background-color: var(--postit-bg, #fef08a);
  background-image: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.38) 0%,
    rgba(0, 0, 0, 0.03) 100%
  );
  border-radius: 10px;
  border: 1.5px solid rgba(161, 98, 7, 0.32);
  box-shadow:
    0 8px 20px rgba(0, 0, 0, 0.35),
    inset 0 -4px 8px rgba(0, 0, 0, 0.04);
  display: grid;
  grid-template-columns: 80px minmax(0, 1fr);
  grid-template-areas:
    "header header"
    "diagram copy";
  align-items: center;
  gap: 8px 12px;
  text-align: left;
  color: #1e293b;
  pointer-events: auto;
  transform: rotate(-0.4deg);
}

.postit-tape {
  position: absolute;
  top: -6px;
  left: 50%;
  transform: translateX(-50%) rotate(-1.5deg);
  width: 56px;
  height: 11px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px dashed rgba(0, 0, 0, 0.16);
  border-radius: 2px;
  pointer-events: none;
}

/* ── Zona 1: Faixa Superior (100% largura, 1 linha) ── */
.postit-header {
  grid-area: header;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-bottom: 6px;
  border-bottom: 1px dashed rgba(113, 63, 18, 0.22);
}

.postit-concept-badge {
  min-width: 0;
  font-size: 0.74rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: #713f12;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.postit-ref-pill {
  flex-shrink: 0;
  font-family: var(--font-mono);
  font-size: 0.66rem;
  font-weight: 700;
  color: #0369a1;
  background: #e0f2fe;
  border: 1px solid #7dd3fc;
  border-radius: 6px;
  padding: 2px 7px;
  line-height: 1.2;
  white-space: nowrap;
}

.postit-ref-pill.is-mirror {
  color: #be185d;
  background: #fce7f3;
  border-color: #f9a8d4;
}

/* ── Zona 2: Diagrama Clicável + Explicação ── */
.postit-diagram-trigger {
  grid-area: diagram;
  background: none;
  border: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  color: inherit;
  transition: transform 0.12s ease;
}

.postit-diagram-trigger.is-interactive {
  cursor: pointer;
}

.postit-diagram-trigger.is-interactive:hover {
  transform: translateY(-1px);
}

.postit-diagram-trigger.is-interactive:active {
  transform: scale(0.96);
}

.postit-diagram-trigger.is-interactive:focus-visible {
  outline: 2px solid #0284c7;
  outline-offset: 2px;
  border-radius: 10px;
}

.diagram-replay-caption {
  font-family: var(--font-mono);
  font-size: 0.6rem;
  font-weight: 600;
  color: rgba(113, 63, 18, 0.72);
  letter-spacing: 0.02em;
  line-height: 1;
  white-space: nowrap;
  transition: color 0.15s ease;
}

.postit-diagram-trigger.is-interactive:hover .diagram-replay-caption {
  color: #0369a1;
}

.postit-copy {
  grid-area: copy;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.postit-sketch-strip {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  justify-content: space-between;
  width: 100%;
  gap: 2px;
  padding: 1px 0;
}

.postit-sketch-item {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  transform: rotate(var(--sketch-tilt, -1.5deg));
}

.postit-sketch-img {
  width: clamp(26px, 8vw, 34px);
  height: clamp(26px, 8vw, 34px);
  object-fit: contain;
  image-rendering: pixelated;
  mix-blend-mode: multiply;
  filter: sepia(0.58) hue-rotate(-8deg) saturate(1.55) brightness(1.12)
    contrast(0.95);
  opacity: 0.88;
}

.postit-sketch-label {
  font-family: var(--font-handwritten);
  font-size: clamp(0.68rem, 2.5vw, 0.8rem);
  font-weight: 700;
  line-height: 1;
  color: #44403c;
  white-space: nowrap;
}

.postit-sketch-arrow {
  flex-shrink: 0;
  font-family: var(--font-handwritten);
  font-size: 0.88rem;
  font-weight: 700;
  color: #b91c1c;
  margin-bottom: 10px;
}

.postit-level-hint {
  margin: 0;
  font-family: var(--font-handwritten);
  font-size: clamp(1.06rem, 3.6vw, 1.2rem);
  font-weight: 700;
  color: #292524;
  line-height: 1.22;
}

@media (max-width: 360px) {
  .rardi-hint-postit {
    grid-template-columns: 72px minmax(0, 1fr);
    gap: 8px 10px;
  }

  .postit-diagram {
    width: 72px;
    height: 72px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .postit-diagram-trigger,
  .diagram-replay-caption {
    transition: none;
  }
}

.standard-hint-banner {
  margin: 7px 0 0;
  padding-top: 7px;
  border-top: 1px solid rgba(148, 163, 184, 0.22);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-family: var(--font-main);
  font-size: clamp(0.78rem, 2.2vw, 0.9rem);
  font-weight: 500;
  color: #fde68a;
  line-height: 1.35;
}

.hint-bulb {
  font-size: 0.95rem;
  flex-shrink: 0;
}
</style>
