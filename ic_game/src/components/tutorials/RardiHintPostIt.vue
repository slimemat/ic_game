<script setup>
import { computed, onMounted, onUnmounted } from "vue";
import PostItSketchDiagram from "./PostItSketchDiagram.vue";
import PostItHand from "./PostItHand.vue";
import { DEFAULT_HAND_SKIN_ID } from "../../game/data/handSkins";

/**
 * RardiHintPostIt: Modal full-focus de dica em formato de post-it quadrado
 * com estética de caneta esferográfica azul, mão em pixel art segurando o papel
 * e marcador de página lateral para rever o tutorial.
 *
 * Princípios SOLID (SRP & OCP):
 * - Genérico e reutilizável para qualquer mini-jogo: exibe `hintText` obrigatoriamente
 *   e, opcionalmente, um diagrama espacial (`visualHint`) + botão de rever tutorial.
 */
const props = defineProps({
  /** Texto de dica contextual da fase/sub-etapa atual */
  hintText: {
    type: String,
    required: true,
  },
  /** Metadados opcionais da cola visual (ex.: retornados por resolveVisualHintForLevel) */
  visualHint: {
    type: Object,
    default: null,
  },
  /** Permite exibir ou ocultar o botão de fechar (X) */
  showClose: {
    type: Boolean,
    default: true,
  },
  /** Rótulo customizável para o botão de rever tutorial (fallback via i18n) */
  replayLabel: {
    type: String,
    default: "",
  },
  /** ID da skin customizável da mão que segura o post-it */
  handSkinId: {
    type: String,
    default: DEFAULT_HAND_SKIN_ID,
  },
});

const emit = defineEmits(["close", "replay-tutorial"]);

const canReplay = computed(() => Boolean(props.visualHint?.tutorialId));

function handleClose() {
  emit("close");
}

function handleReplayClick() {
  if (props.visualHint?.tutorialId) {
    emit("replay-tutorial", props.visualHint.tutorialId);
  }
}

function handleKeydown(event) {
  if (event.key === "Escape") {
    handleClose();
  }
}

onMounted(() => {
  window.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
  <div
    class="postit-backdrop"
    role="dialog"
    aria-modal="true"
    :aria-label="$t('pattern.hint_button_label')"
    @click="handleClose"
  >
    <div class="postit-stage" @click.stop>
      <!-- Aba adesiva / marcador de página na borda inferior esquerda -->
      <button
        v-if="canReplay"
        type="button"
        class="postit-replay-tab"
        :aria-label="replayLabel || $t('tutorials.desk.btn_replay_tutorial')"
        @click.stop="handleReplayClick"
      >
        <span class="replay-tab-icon" aria-hidden="true">↺</span>
        <span class="replay-tab-text">
          {{ replayLabel || $t("tutorials.desk.btn_replay_tutorial") }}
        </span>
      </button>

      <!-- Mão customizável em 3 seções (palma traseira + braço em z-index 1, polegar em z-index 3) -->
      <PostItHand :skinId="handSkinId" />

      <!-- Camada média (z-index: 2): Post-it Quadrado (clicar no corpo NÃO fecha o modal) -->
      <article
        class="rardi-hint-postit"
        :style="{ '--postit-bg': visualHint?.color || '#fef08a' }"
        role="note"
        @click.stop
      >
        <!-- Botão X com área de toque mínima invisível de 44x44px -->
        <button
          v-if="showClose"
          type="button"
          class="postit-close-btn"
          :aria-label="$t('tutorials.desk.close_note')"
          @click.stop="handleClose"
        >
          <svg
            viewBox="0 0 24 24"
            class="postit-close-svg"
            aria-hidden="true"
            fill="none"
          >
            <path d="M6 6 L18 18" />
            <path d="M18 6 L6 18" />
          </svg>
        </button>

        <!-- Conteúdo principal em caneta esferográfica azul -->
        <div class="postit-body">
          <PostItSketchDiagram
            v-if="visualHint?.concept"
            class="postit-diagram"
            :concept="visualHint.concept"
          />

          <p class="postit-level-hint" :class="{ 'is-text-only': !visualHint }">
            {{ hintText }}
          </p>
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped>
.postit-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(10, 15, 28, 0.72);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
  overflow: hidden;
}

.postit-stage {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: postit-lift 0.38s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

@keyframes postit-lift {
  from {
    opacity: 0;
    transform: translateY(55vh) rotate(-4deg) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) rotate(-1deg) scale(1);
  }
}

.rardi-hint-postit {
  position: relative;
  width: min(82vw, 336px);
  aspect-ratio: 1 / 1;
  padding: 36px 22px 28px;
  background-color: var(--postit-bg, #fef08a);
  background-image: linear-gradient(
    170deg,
    rgba(255, 255, 255, 0.42) 0%,
    rgba(0, 0, 0, 0.04) 100%
  );
  border-radius: 4px;
  box-shadow:
    0 22px 44px rgba(0, 0, 0, 0.48),
    0 4px 10px rgba(0, 0, 0, 0.25),
    inset 0 -10px 18px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  pointer-events: auto;
  z-index: 2;
}

/* Botão X com área de toque invisível mínima de 44x44px */
.postit-close-btn {
  position: absolute;
  top: 2px;
  right: 2px;
  min-width: 44px;
  min-height: 44px;
  padding: 0;
  border: none;
  background: transparent;
  display: grid;
  place-items: center;
  cursor: pointer;
  z-index: 5;
  border-radius: 50%;
  transition: transform 0.14s ease;
}

.postit-close-btn:active {
  transform: scale(0.9);
}

.postit-close-btn:focus-visible {
  outline: 2px solid #1e40af;
  outline-offset: -4px;
}

.postit-close-svg {
  width: 22px;
  height: 22px;
  stroke: #1e40af;
  stroke-width: 2.8;
  stroke-linecap: round;
}

.postit-body {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  text-align: center;
}

.postit-diagram {
  flex-shrink: 0;
}

.postit-level-hint {
  margin: 0;
  font-family: var(--font-handwritten);
  font-size: clamp(1.32rem, 5vw, 1.56rem);
  font-weight: 700;
  color: #1e40af;
  line-height: 1.18;
  letter-spacing: 0.01em;
}

.postit-level-hint.is-text-only {
  font-size: clamp(1.48rem, 5.6vw, 1.8rem);
  line-height: 1.24;
  padding: 0 6px;
}

/* Aba adesiva / marcador de página colorido na borda inferior esquerda */
.postit-replay-tab {
  position: absolute;
  left: 16px;
  bottom: -36px;
  z-index: 1;
  min-height: 44px;
  padding: 12px 16px 8px;
  border: none;
  border-radius: 0 0 10px 10px;
  background: #f97316;
  color: #fffbeb;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-main);
  font-size: 0.84rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  cursor: pointer;
  box-shadow:
    0 6px 14px rgba(0, 0, 0, 0.32),
    inset 0 6px 8px rgba(0, 0, 0, 0.14);
  transition:
    transform 0.15s ease,
    background-color 0.15s ease;
}

.postit-replay-tab:hover {
  background: #ea580c;
  transform: translateY(2px);
}

.postit-replay-tab:active {
  transform: translateY(4px);
}

.postit-replay-tab:focus-visible {
  outline: 2px solid #ffffff;
  outline-offset: 2px;
}

.replay-tab-icon {
  font-size: 1rem;
  line-height: 1;
}

@media (prefers-reduced-motion: reduce) {
  .postit-stage {
    animation: none;
    transform: rotate(-1deg);
  }
  .postit-close-btn,
  .postit-replay-tab {
    transition: none;
  }
}
</style>
