<script setup>
import { computed } from "vue";
import {
  CLOCK_CONFIG,
  MIRROR_SHAPES,
  getSketchDiagram,
} from "../../game/data/sketchDiagrams";

/**
 * PostItSketchDiagram: Renderizador declarativo fino para os diagramas espaciais
 * do Rardi em estilo caneta esferográfica azul.
 * Toda a geometria e configuração residem em `sketchDiagrams.js` (SRP / OCP / DRY).
 */
const props = defineProps({
  concept: {
    type: String,
    required: true,
  },
});

const diagram = computed(() => getSketchDiagram(props.concept));
</script>

<template>
  <div v-if="diagram" class="sketch-diagram" aria-hidden="true">
    <!-- Diagramas de Relógio -->
    <svg
      v-if="diagram.kind === 'clock'"
      viewBox="0 0 220 130"
      class="sketch-svg"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path :d="diagram.sectorPath" class="highlighter-sector" />

      <circle
        :cx="CLOCK_CONFIG.cx"
        :cy="CLOCK_CONFIG.cy"
        :r="CLOCK_CONFIG.r"
        class="pen-stroke pen-thick"
      />
      <circle
        :cx="CLOCK_CONFIG.cx"
        :cy="CLOCK_CONFIG.cy"
        r="3"
        class="pen-fill"
      />

      <line
        v-for="(tick, idx) in CLOCK_CONFIG.ticks"
        :key="idx"
        :x1="tick.x1"
        :y1="tick.y1"
        :x2="tick.x2"
        :y2="tick.y2"
        class="pen-stroke"
      />

      <text
        :x="CLOCK_CONFIG.topLabel.x"
        :y="CLOCK_CONFIG.topLabel.y"
        text-anchor="middle"
        class="pen-label"
      >
        {{ CLOCK_CONFIG.topLabel.text }}
      </text>
      <text
        v-for="label in diagram.labels"
        :key="label.text"
        :x="label.x"
        :y="label.y"
        :text-anchor="label.anchor"
        class="pen-label"
      >
        {{ label.text }}
      </text>

      <line
        :x1="CLOCK_CONFIG.originHand.x1"
        :y1="CLOCK_CONFIG.originHand.y1"
        :x2="CLOCK_CONFIG.originHand.x2"
        :y2="CLOCK_CONFIG.originHand.y2"
        class="pen-stroke pen-dashed"
      />
      <line
        :x1="CLOCK_CONFIG.cx"
        :y1="CLOCK_CONFIG.cy"
        :x2="diagram.handEnd.x"
        :y2="diagram.handEnd.y"
        class="pen-stroke pen-thick"
      />

      <path :d="diagram.arrow.arc" class="pen-stroke pen-thick" />
      <path :d="diagram.arrow.head" class="pen-stroke pen-thick" />
      <text
        :x="diagram.arrow.labelX"
        :y="diagram.arrow.labelY"
        text-anchor="middle"
        class="pen-label-lg"
      >
        {{ diagram.angleLabel }}
      </text>
    </svg>

    <!-- Diagramas de Espelhamento (reutilizando forma única via transform) -->
    <svg
      v-else-if="diagram.kind === 'mirror'"
      viewBox="0 0 220 130"
      class="sketch-svg"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <line
        :x1="diagram.axis.x1"
        :y1="diagram.axis.y1"
        :x2="diagram.axis.x2"
        :y2="diagram.axis.y2"
        class="pen-stroke pen-dashed"
      />

      <g
        v-for="(tf, idx) in diagram.shapeTransforms"
        :key="idx"
        :transform="tf"
      >
        <path :d="MIRROR_SHAPES.flagPath" class="pen-stroke pen-thick" />
        <polygon :points="MIRROR_SHAPES.anchorPoints" class="pen-fill" />
      </g>

      <g :transform="diagram.arrowTransform">
        <path :d="MIRROR_SHAPES.flipArrow.shaft" class="pen-stroke pen-thick" />
        <path :d="MIRROR_SHAPES.flipArrow.headStart" class="pen-stroke" />
        <path :d="MIRROR_SHAPES.flipArrow.headEnd" class="pen-stroke" />
      </g>
    </svg>
  </div>
</template>

<style scoped>
.sketch-diagram {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sketch-svg {
  width: min(100%, 220px);
  height: auto;
  overflow: visible;
}

.highlighter-sector {
  fill: rgba(251, 146, 60, 0.34);
}

.pen-stroke {
  stroke: #1e40af;
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.pen-thick {
  stroke-width: 2.8;
}

.pen-dashed {
  stroke-dasharray: 5 5;
  opacity: 0.72;
}

.pen-fill {
  fill: #1e40af;
}

.pen-label {
  fill: #1e40af;
  font-family: var(--font-handwritten);
  font-size: 16px;
  font-weight: 700;
}

.pen-label-lg {
  fill: #1e40af;
  font-family: var(--font-handwritten);
  font-size: 20px;
  font-weight: 700;
}
</style>
