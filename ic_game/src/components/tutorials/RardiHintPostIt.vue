<script setup>
import VisualConceptDiagram from "./VisualConceptDiagram.vue";

/**
 * RardiHintPostIt: Exibe a "Cola Visual do Rardi" em formato de post-it rabiscado
 * quando o jogador abre o botão de Dica (?) nas fases espaciais, ou exibe o card
 * de dica padrão nas demais fases (ex.: padrões de cores), respeitando SRP e OCP.
 */
defineProps({
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

defineEmits(["replay-tutorial"]);
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

    <!-- Diagrama animado à esquerda (mostra o TOPO e os LADOS em movimento) -->
    <VisualConceptDiagram
      :concept="visualHint.concept"
      size="sm"
      :customDoodleUrl="visualHint.customDoodleUrl || null"
    />

    <!-- Explicação rápida + Regra de Ouro à direita -->
    <div class="postit-body">
      <div class="postit-header-row">
        <span class="postit-author-tag">
          📌 {{ $t(visualHint.titleKey) }}
        </span>
        <button
          v-if="visualHint.tutorialId"
          type="button"
          class="btn-replay-mini"
          @click.stop="$emit('replay-tutorial', visualHint.tutorialId)"
        >
          {{ $t("tutorials.desk.btn_replay_short") }}
        </button>
      </div>

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
              :alt="sketch.label || ''"
              class="postit-sketch-img"
              draggable="false"
            />
            <span v-if="sketch.label" class="postit-sketch-label">
              {{ sketch.label }}
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

      <p
        v-else-if="visualHint.goldenRuleKey && $t(visualHint.goldenRuleKey)"
        class="postit-golden-rule"
      >
        {{ $t(visualHint.goldenRuleKey) }}
      </p>

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
  margin-top: 8px;
  padding: 14px 14px 14px 12px;
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
  display: flex;
  align-items: center;
  gap: 12px;
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

.postit-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.postit-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.postit-author-tag {
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: #713f12;
  background: rgba(255, 255, 255, 0.65);
  padding: 1px 6px;
  border-radius: 5px;
}

.btn-replay-mini {
  background: #0f172a;
  color: #f8fafc;
  border: none;
  border-radius: 6px;
  padding: 2px 7px;
  font-size: 0.65rem;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    background-color 0.15s ease;
  white-space: nowrap;
}

.btn-replay-mini:hover {
  background: #0284c7;
  transform: translateY(-1px);
}

.postit-golden-rule {
  margin: 0;
  font-family: var(--font-handwritten);
  font-size: clamp(1.04rem, 3.6vw, 1.18rem);
  font-weight: 700;
  color: #292524;
  line-height: 1.2;
}

.postit-sketch-strip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 0;
}

.postit-sketch-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  transform: rotate(var(--sketch-tilt, -1.5deg));
}

.postit-sketch-img {
  width: 38px;
  height: 38px;
  object-fit: contain;
  image-rendering: pixelated;
  mix-blend-mode: multiply;
  filter: sepia(0.58) hue-rotate(-8deg) saturate(1.55) brightness(1.12)
    contrast(0.95);
  opacity: 0.88;
}

.postit-sketch-label {
  font-family: var(--font-handwritten);
  font-size: 0.84rem;
  font-weight: 700;
  line-height: 1;
  color: #44403c;
}

.postit-sketch-arrow {
  font-family: var(--font-handwritten);
  font-size: 1.02rem;
  font-weight: 700;
  color: #b91c1c;
  margin-bottom: 10px;
}

.postit-level-hint {
  margin: 0;
  font-family: var(--font-handwritten);
  font-size: clamp(1.02rem, 3.5vw, 1.15rem);
  font-weight: 600;
  color: #292524;
  line-height: 1.22;
  border-top: 1px dashed rgba(15, 23, 42, 0.18);
  padding-top: 4px;
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
