<script setup>
import { computed } from "vue";
import spritepaintImg from "../../assets/images/spritepaint.png";

/**
 * VisualConceptDiagram: Diagrama visual animado (estilo rabisco/cola do Rardi)
 * que demonstra a diferença física entre Rotação (relógio) e Espelhamento (reflexão).
 *
 * Princípios SOLID (SRP & OCP):
 * - Responsabilidade única: traduzir um `concept` geométrico em demonstração visual contínua.
 * - Aberto para extensão: aceita `customDoodleUrl` para quando rabiscos desenhados à mão
 *   forem adicionados futuramente, sem alterar os consumidores (Modal de Tutorial ou Post-it de Dica).
 */
const props = defineProps({
  /** Identificador do conceito: 'rotate_cw' | 'rotate_ccw' | 'rotate_180' | 'rotate_45' | 'flip_h' | 'flip_v' */
  concept: {
    type: String,
    required: true,
  },
  /** Tamanho do diagrama: 'sm' (para dica in-game) | 'md' (para post-it de tutorial) */
  size: {
    type: String,
    default: "md",
  },
  /** TODO: URL opcional de rabisco/sprite desenhado à mão pelo autor para substituir a animação CSS */
  customDoodleUrl: {
    type: String,
    default: null,
  },
});

const isMirrorConcept = computed(
  () => props.concept === "flip_h" || props.concept === "flip_v",
);

const badgeText = computed(() => {
  switch (props.concept) {
    case "rotate_cw":
      return "12h ↷ 3h";
    case "rotate_ccw":
      return "12h ↶ 9h";
    case "rotate_180":
      return "12h ↻ 6h";
    case "rotate_45":
      return "+45° ↷";
    case "flip_h":
      return "Esq ⇄ Dir";
    case "flip_v":
      return "Topo ⇅ Base";
    default:
      return "";
  }
});

const keyVisualCue = computed(() => {
  switch (props.concept) {
    case "rotate_cw":
      return "Topo ⬆ cai p/ Direita ➡";
    case "rotate_ccw":
      return "Topo ⬆ cai p/ Esquerda ⬅";
    case "rotate_180":
      return "Meia-volta (Ponta-cabeça)";
    case "rotate_45":
      return "Passo curto diagonal (45°)";
    case "flip_h":
      return "Topo FIXO ⬆ • Lados trocam";
    case "flip_v":
      return "Lados FIXOS • Vira p/ baixo";
    default:
      return "";
  }
});
</script>

<template>
  <div
    class="visual-concept-diagram"
    :class="[`size-${size}`, `concept-${concept}`]"
    aria-hidden="true"
  >
    <!-- Suporte futuro para rabisco desenhado à mão -->
    <img
      v-if="customDoodleUrl"
      :src="customDoodleUrl"
      alt=""
      class="custom-doodle-img"
    />

    <template v-else>
      <!-- Etiqueta de referência rápida (Relógio ou Espelho) -->
      <div class="diagram-top-tag" :class="{ 'is-mirror': isMirrorConcept }">
        <span>{{ badgeText }}</span>
      </div>

      <!-- Palco de comparação Antes -> Movimento Animado -->
      <div class="diagram-stage">
        <!-- Eixos de espelho tracejados quando for reflexão -->
        <div
          v-if="concept === 'flip_h'"
          class="doodle-mirror-axis vertical"
        ></div>
        <div
          v-if="concept === 'flip_v'"
          class="doodle-mirror-axis horizontal"
        ></div>

        <!-- Arco tracejado de relógio quando for rotação -->
        <svg
          v-if="!isMirrorConcept"
          class="doodle-clock-arc"
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r="38"
            fill="none"
            stroke="rgba(2, 132, 199, 0.28)"
            stroke-width="2.5"
            stroke-dasharray="5 4"
          />
        </svg>

        <!-- Silhueta Fantasma (Posição Inicial 0° de referência) -->
        <div class="sprite-ghost-origin">
          <span class="top-hat-dot" title="Topo">▲</span>
          <img :src="spritepaintImg" alt="" class="diagram-sprite" />
        </div>

        <!-- Peça Animada que executa o movimento em loop contínuo -->
        <div class="sprite-animated-actor" :class="`anim-${concept}`">
          <span class="top-hat-dot active-hat" title="Topo">▲</span>
          <img :src="spritepaintImg" alt="" class="diagram-sprite" />
        </div>
      </div>

      <!-- Legenda visual curta de 3 palavras -->
      <div class="diagram-bottom-cue">
        {{ keyVisualCue }}
      </div>
    </template>
  </div>
</template>

<style scoped>
.visual-concept-diagram {
  position: relative;
  aspect-ratio: 1 / 1;
  background-color: rgba(255, 255, 255, 0.88);
  background-image:
    linear-gradient(rgba(14, 165, 233, 0.09) 1px, transparent 1px),
    linear-gradient(90deg, rgba(14, 165, 233, 0.09) 1px, transparent 1px);
  background-size: 10px 10px;
  border: 1.5px solid rgba(15, 23, 42, 0.18);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 5px;
  overflow: hidden;
  box-shadow: inset 0 1px 4px rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
}

.visual-concept-diagram.size-sm {
  width: 86px;
  height: 86px;
  padding: 3px;
}

.visual-concept-diagram.size-md {
  width: 112px;
  height: 112px;
  padding: 5px;
}

.custom-doodle-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.diagram-top-tag {
  font-size: 0.6rem;
  font-weight: 800;
  color: #0369a1;
  background: #e0f2fe;
  border: 1px solid #7dd3fc;
  border-radius: 6px;
  padding: 1px 6px;
  line-height: 1.1;
  z-index: 4;
  white-space: nowrap;
}

.diagram-top-tag.is-mirror {
  color: #be185d;
  background: #fce7f3;
  border-color: #f9a8d4;
}

.size-sm .diagram-top-tag {
  font-size: 0.52rem;
  padding: 1px 4px;
}

.diagram-stage {
  position: relative;
  flex: 1;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.doodle-clock-arc {
  position: absolute;
  width: 82%;
  height: 82%;
  pointer-events: none;
}

.doodle-mirror-axis {
  position: absolute;
  pointer-events: none;
  z-index: 3;
}

.doodle-mirror-axis.vertical {
  top: 4px;
  bottom: 4px;
  left: 50%;
  width: 2px;
  transform: translateX(-50%);
  background: repeating-linear-gradient(
    0deg,
    #db2777,
    #db2777 4px,
    transparent 4px,
    transparent 8px
  );
}

.doodle-mirror-axis.horizontal {
  left: 4px;
  right: 4px;
  top: 50%;
  height: 2px;
  transform: translateY(-50%);
  background: repeating-linear-gradient(
    90deg,
    #15803d,
    #15803d 4px,
    transparent 4px,
    transparent 8px
  );
}

.sprite-ghost-origin,
.sprite-animated-actor {
  position: absolute;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.size-sm .sprite-ghost-origin,
.size-sm .sprite-animated-actor {
  width: 36px;
  height: 36px;
}

.sprite-ghost-origin {
  opacity: 0.22;
  filter: grayscale(0.4);
}

.diagram-sprite {
  width: 100%;
  height: 100%;
  object-fit: contain;
  image-rendering: pixelated;
}

/* Marcador explícito de TOPO da figura para destravar leigos */
.top-hat-dot {
  position: absolute;
  top: -7px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.55rem;
  line-height: 1;
  color: #dc2626;
  font-weight: 900;
  text-shadow: 0 0 2px #ffffff;
  z-index: 5;
}

.size-sm .top-hat-dot {
  top: -5px;
  font-size: 0.45rem;
}

.diagram-bottom-cue {
  font-size: 0.54rem;
  font-weight: 800;
  color: #1e293b;
  background: rgba(254, 249, 195, 0.9);
  border-radius: 4px;
  padding: 1px 4px;
  text-align: center;
  line-height: 1.1;
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  z-index: 4;
}

.size-sm .diagram-bottom-cue {
  font-size: 0.46rem;
  padding: 1px 2px;
}

/* Keyframes de demonstração contínua em loop (2.4s) */
.anim-rotate_cw {
  animation: demoRotateCw 2.4s infinite cubic-bezier(0.34, 1.56, 0.64, 1);
}

.anim-rotate_ccw {
  animation: demoRotateCcw 2.4s infinite cubic-bezier(0.34, 1.56, 0.64, 1);
}

.anim-rotate_180 {
  animation: demoRotate180 2.6s infinite cubic-bezier(0.34, 1.56, 0.64, 1);
}

.anim-rotate_45 {
  animation: demoRotate45 2.4s infinite cubic-bezier(0.34, 1.56, 0.64, 1);
}

.anim-flip_h {
  animation: demoFlipH 2.4s infinite cubic-bezier(0.34, 1.56, 0.64, 1);
}

.anim-flip_v {
  animation: demoFlipV 2.4s infinite cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes demoRotateCw {
  0%,
  20% {
    transform: rotate(0deg);
  }
  50%,
  80% {
    transform: rotate(90deg);
  }
  100% {
    transform: rotate(0deg);
  }
}

@keyframes demoRotateCcw {
  0%,
  20% {
    transform: rotate(0deg);
  }
  50%,
  80% {
    transform: rotate(-90deg);
  }
  100% {
    transform: rotate(0deg);
  }
}

@keyframes demoRotate180 {
  0%,
  20% {
    transform: rotate(0deg);
  }
  50%,
  80% {
    transform: rotate(180deg);
  }
  100% {
    transform: rotate(0deg);
  }
}

@keyframes demoRotate45 {
  0%,
  20% {
    transform: rotate(0deg);
  }
  50%,
  80% {
    transform: rotate(45deg);
  }
  100% {
    transform: rotate(0deg);
  }
}

@keyframes demoFlipH {
  0%,
  20% {
    transform: scaleX(1);
  }
  50%,
  80% {
    transform: scaleX(-1);
  }
  100% {
    transform: scaleX(1);
  }
}

@keyframes demoFlipV {
  0%,
  20% {
    transform: scaleY(1);
  }
  50%,
  80% {
    transform: scaleY(-1);
  }
  100% {
    transform: scaleY(1);
  }
}
</style>
