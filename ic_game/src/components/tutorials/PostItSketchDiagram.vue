<script setup>
import { computed } from "vue";

/**
 * PostItSketchDiagram: Diagrama rabiscado em estilo caneta esferográfica azul
 * para a cola visual do Rardi, com apenas 1 cor de marca-texto sutil no setor de 90°.
 *
 * Princípios SOLID (SRP & OCP):
 * - Responsabilidade única: renderizar o esquema vetorial manuscrito de um conceito espacial.
 * - Aberto para extensão: novos conceitos podem ser adicionados via tabela/template sem alterar o modal pai.
 */
const props = defineProps({
  /** Conceito espacial: 'rotate_cw' | 'rotate_ccw' | 'rotate_180' | 'rotate_45' | 'rotate_ccw_45' | 'flip_h' | 'flip_v' */
  concept: {
    type: String,
    required: true,
  },
});

const isMirror = computed(
  () => props.concept === "flip_h" || props.concept === "flip_v",
);

const isClockConcept = computed(
  () =>
    props.concept === "rotate_cw" ||
    props.concept === "rotate_ccw" ||
    props.concept === "rotate_180" ||
    props.concept === "rotate_45" ||
    props.concept === "rotate_ccw_45",
);
</script>

<template>
  <div class="sketch-diagram" aria-hidden="true">
    <!-- Diagramas de Relógio (Caneta Azul + 1 marca-texto laranja sutil no setor de 90°) -->
    <svg
      v-if="isClockConcept"
      viewBox="0 0 220 130"
      class="sketch-svg"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <!-- Setor de marca-texto sutil (exclusivo para o quadrante de 90°) -->
      <path
        v-if="concept === 'rotate_cw'"
        d="M 70 65 L 70 21 A 44 44 0 0 1 114 65 Z"
        class="highlighter-sector"
      />
      <path
        v-else-if="concept === 'rotate_ccw'"
        d="M 70 65 L 26 65 A 44 44 0 0 1 70 21 Z"
        class="highlighter-sector"
      />
      <path
        v-else-if="concept === 'rotate_45'"
        d="M 70 65 L 70 21 A 44 44 0 0 1 101 34 Z"
        class="highlighter-sector"
      />
      <path
        v-else-if="concept === 'rotate_ccw_45'"
        d="M 70 65 L 39 34 A 44 44 0 0 1 70 21 Z"
        class="highlighter-sector"
      />
      <path
        v-else-if="concept === 'rotate_180'"
        d="M 70 21 A 44 44 0 0 1 70 109 Z"
        class="highlighter-sector"
      />

      <!-- Mostrador do relógio desenhado à mão em caneta azul -->
      <circle cx="70" cy="65" r="44" class="pen-stroke pen-thick" />
      <circle cx="70" cy="65" r="3" class="pen-fill" />

      <!-- Marcações de horas (12h, 3h, 6h, 9h) -->
      <line x1="70" y1="21" x2="70" y2="27" class="pen-stroke" />
      <line x1="114" y1="65" x2="108" y2="65" class="pen-stroke" />
      <line x1="70" y1="109" x2="70" y2="103" class="pen-stroke" />
      <line x1="26" y1="65" x2="32" y2="65" class="pen-stroke" />

      <!-- Rótulos das horas -->
      <text x="70" y="15" text-anchor="middle" class="pen-label">12h</text>
      <text
        v-if="concept === 'rotate_cw' || concept === 'rotate_180'"
        x="122"
        y="69"
        text-anchor="start"
        class="pen-label"
      >
        3h
      </text>
      <text
        v-if="concept === 'rotate_ccw'"
        x="18"
        y="69"
        text-anchor="end"
        class="pen-label"
      >
        9h
      </text>
      <text
        v-if="concept === 'rotate_180'"
        x="70"
        y="124"
        text-anchor="middle"
        class="pen-label"
      >
        6h
      </text>

      <!-- Ponteiro inicial (12h) -->
      <line x1="70" y1="65" x2="70" y2="31" class="pen-stroke pen-dashed" />

      <!-- Ponteiro final conforme o ângulo -->
      <line
        v-if="concept === 'rotate_cw'"
        x1="70"
        y1="65"
        x2="102"
        y2="65"
        class="pen-stroke pen-thick"
      />
      <line
        v-else-if="concept === 'rotate_ccw'"
        x1="70"
        y1="65"
        x2="38"
        y2="65"
        class="pen-stroke pen-thick"
      />
      <line
        v-else-if="concept === 'rotate_180'"
        x1="70"
        y1="65"
        x2="70"
        y2="97"
        class="pen-stroke pen-thick"
      />
      <line
        v-else-if="concept === 'rotate_45'"
        x1="70"
        y1="65"
        x2="93"
        y2="42"
        class="pen-stroke pen-thick"
      />
      <line
        v-else-if="concept === 'rotate_ccw_45'"
        x1="70"
        y1="65"
        x2="47"
        y2="42"
        class="pen-stroke pen-thick"
      />

      <!-- Seta curva de direção à direita do relógio -->
      <g v-if="concept === 'rotate_cw' || concept === 'rotate_45'">
        <path
          d="M 148 40 C 175 38, 192 58, 186 84"
          class="pen-stroke pen-thick"
        />
        <path d="M 180 76 L 186 86 L 195 79" class="pen-stroke pen-thick" />
        <text x="172" y="106" text-anchor="middle" class="pen-label-lg">
          {{ concept === "rotate_45" ? "+45°" : "90°" }}
        </text>
      </g>

      <g v-else-if="concept === 'rotate_ccw' || concept === 'rotate_ccw_45'">
        <path
          d="M 190 40 C 163 38, 146 58, 152 84"
          class="pen-stroke pen-thick"
        />
        <path d="M 143 79 L 152 86 L 158 76" class="pen-stroke pen-thick" />
        <text x="170" y="106" text-anchor="middle" class="pen-label-lg">
          {{ concept === "rotate_ccw_45" ? "-45°" : "90°" }}
        </text>
      </g>

      <g v-else-if="concept === 'rotate_180'">
        <path
          d="M 152 34 C 194 40, 194 90, 152 96"
          class="pen-stroke pen-thick"
        />
        <path d="M 160 88 L 150 96 L 160 103" class="pen-stroke pen-thick" />
        <text x="172" y="70" text-anchor="middle" class="pen-label-lg">
          180°
        </text>
      </g>
    </svg>

    <!-- Diagramas de Espelhamento (Caneta Azul) -->
    <svg
      v-else-if="isMirror"
      viewBox="0 0 220 130"
      class="sketch-svg"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <!-- Espelho Horizontal: eixo vertical central + troca esquerda/direita -->
      <template v-if="concept === 'flip_h'">
        <line
          x1="110"
          y1="16"
          x2="110"
          y2="114"
          class="pen-stroke pen-dashed"
        />
        <!-- Bandeira esquerda -->
        <path
          d="M 54 92 L 54 38 L 82 50 L 54 62"
          class="pen-stroke pen-thick"
        />
        <polygon points="54,24 49,33 59,33" class="pen-fill" />
        <!-- Bandeira direita (espelhada) -->
        <path
          d="M 166 92 L 166 38 L 138 50 L 166 62"
          class="pen-stroke pen-thick"
        />
        <polygon points="166,24 161,33 171,33" class="pen-fill" />
        <!-- Setas ⇄ -->
        <path d="M 92 104 L 128 104" class="pen-stroke pen-thick" />
        <path d="M 98 99 L 91 104 L 98 109" class="pen-stroke" />
        <path d="M 122 99 L 129 104 L 122 109" class="pen-stroke" />
      </template>

      <!-- Espelho Vertical: eixo horizontal central + inverte topo/base -->
      <template v-else>
        <line x1="34" y1="65" x2="186" y2="65" class="pen-stroke pen-dashed" />
        <!-- Seta acima -->
        <path
          d="M 86 52 L 86 24 L 106 34 L 86 44"
          class="pen-stroke pen-thick"
        />
        <polygon points="86,14 81,22 91,22" class="pen-fill" />
        <!-- Seta abaixo (invertida) -->
        <path
          d="M 86 78 L 86 106 L 106 96 L 86 86"
          class="pen-stroke pen-thick"
        />
        <polygon points="86,116 81,108 91,108" class="pen-fill" />
        <!-- Setas ⇅ -->
        <path d="M 148 40 L 148 90" class="pen-stroke pen-thick" />
        <path d="M 143 46 L 148 39 L 153 46" class="pen-stroke" />
        <path d="M 143 84 L 148 91 L 153 84" class="pen-stroke" />
      </template>
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
