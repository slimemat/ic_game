/**
 * Primitivas SVG e configuração declarativa dos diagramas espaciais do Post-it.
 *
 * Princípios SOLID (SRP & OCP):
 * - Separa dados geométricos e primitivas vetoriais reutilizáveis da camada de apresentação Vue.
 * - Novos ângulos ou conceitos podem ser adicionados na tabela `SPATIAL_DIAGRAMS`
 *   sem duplicar condicionais nos templates.
 */

export const CLOCK_CONFIG = Object.freeze({
  cx: 70,
  cy: 65,
  r: 44,
  handLength: 32,
  originHand: Object.freeze({ x1: 70, y1: 65, x2: 70, y2: 31 }),
  ticks: Object.freeze([
    { x1: 70, y1: 21, x2: 70, y2: 27 },
    { x1: 114, y1: 65, x2: 108, y2: 65 },
    { x1: 70, y1: 109, x2: 70, y2: 103 },
    { x1: 26, y1: 65, x2: 32, y2: 65 },
  ]),
  topLabel: Object.freeze({ x: 70, y: 15, text: "12h" }),
});

const HOUR_LABELS = Object.freeze({
  "3h": Object.freeze({ x: 122, y: 69, anchor: "start", text: "3h" }),
  "6h": Object.freeze({ x: 70, y: 124, anchor: "middle", text: "6h" }),
  "9h": Object.freeze({ x: 18, y: 69, anchor: "end", text: "9h" }),
});

export const ARROW_SHAPES = Object.freeze({
  cw: Object.freeze({
    arc: "M 148 40 C 175 38, 192 58, 186 84",
    head: "M 180 76 L 186 86 L 195 79",
    labelX: 172,
    labelY: 106,
  }),
  ccw: Object.freeze({
    arc: "M 190 40 C 163 38, 146 58, 152 84",
    head: "M 143 79 L 152 86 L 158 76",
    labelX: 170,
    labelY: 106,
  }),
  half: Object.freeze({
    arc: "M 152 34 C 194 40, 194 90, 152 96",
    head: "M 160 88 L 150 96 L 160 103",
    labelX: 172,
    labelY: 70,
  }),
});

/**
 * Formas geométricas reutilizáveis para diagramas de espelhamento.
 * Uma única bandeira + triângulo âncora é espelhada via `transform` SVG.
 */
export const MIRROR_SHAPES = Object.freeze({
  flagPath: "M 0 34 L 0 -20 L 28 -8 L 0 4",
  anchorPoints: "0,-34 -5,-25 5,-25",
  flipArrow: Object.freeze({
    shaft: "M -18 0 L 18 0",
    headStart: "M -12 -5 L -19 0 L -12 5",
    headEnd: "M 12 -5 L 19 0 L 12 5",
  }),
});

/**
 * Calcula o `d` SVG do setor circular de marca-texto partindo de 12h (-90°).
 * @param {number} angleDeg Ângulo em graus (positivo = horário, negativo = anti-horário)
 * @returns {string}
 */
export function buildClockSectorPath(angleDeg) {
  const { cx, cy, r } = CLOCK_CONFIG;
  const startX = cx;
  const startY = cy - r;
  const endRad = ((-90 + angleDeg) * Math.PI) / 180;
  const endX = Math.round(cx + r * Math.cos(endRad));
  const endY = Math.round(cy + r * Math.sin(endRad));
  const sweep = angleDeg >= 0 ? 1 : 0;
  const largeArc = Math.abs(angleDeg) > 180 ? 1 : 0;

  if (Math.abs(angleDeg) === 180) {
    return `M ${startX} ${startY} A ${r} ${r} 0 0 ${sweep} ${endX} ${endY} Z`;
  }
  return `M ${cx} ${cy} L ${startX} ${startY} A ${r} ${r} 0 ${largeArc} ${sweep} ${endX} ${endY} Z`;
}

/**
 * Calcula o ponto final do ponteiro do relógio para um ângulo partindo de 12h.
 * @param {number} angleDeg
 * @returns {{ x: number, y: number }}
 */
export function buildClockHandPoint(angleDeg) {
  const { cx, cy, handLength } = CLOCK_CONFIG;
  const rad = ((-90 + angleDeg) * Math.PI) / 180;
  return {
    x: Math.round(cx + handLength * Math.cos(rad)),
    y: Math.round(cy + handLength * Math.sin(rad)),
  };
}

function createClockDiagram(angleDeg, arrowKey, angleLabel, extraHours = []) {
  return Object.freeze({
    kind: "clock",
    angleDeg,
    sectorPath: buildClockSectorPath(angleDeg),
    handEnd: Object.freeze(buildClockHandPoint(angleDeg)),
    arrow: ARROW_SHAPES[arrowKey],
    angleLabel,
    labels: Object.freeze(
      extraHours.map((h) => HOUR_LABELS[h]).filter(Boolean),
    ),
  });
}

function createMirrorDiagram(axis, shapeTransforms, arrowTransform) {
  return Object.freeze({
    kind: "mirror",
    axis: Object.freeze(axis),
    shapeTransforms: Object.freeze(shapeTransforms),
    arrowTransform,
  });
}

export const SPATIAL_DIAGRAMS = Object.freeze({
  rotate_cw: createClockDiagram(90, "cw", "90°", ["3h"]),
  rotate_ccw: createClockDiagram(-90, "ccw", "90°", ["9h"]),
  rotate_180: createClockDiagram(180, "half", "180°", ["3h", "6h"]),
  rotate_45: createClockDiagram(45, "cw", "+45°"),
  rotate_ccw_45: createClockDiagram(-45, "ccw", "-45°"),
  flip_h: createMirrorDiagram(
    { x1: 110, y1: 16, x2: 110, y2: 114 },
    ["translate(54, 58)", "translate(166, 58) scale(-1, 1)"],
    "translate(110, 104)",
  ),
  flip_v: createMirrorDiagram(
    { x1: 34, y1: 65, x2: 186, y2: 65 },
    ["translate(86, 36) scale(0.75)", "translate(86, 94) scale(0.75, -0.75)"],
    "translate(148, 65) rotate(90) scale(1.35, 1)",
  ),
});

/**
 * Retorna o descritor do diagrama espacial para o conceito informado.
 * @param {string} concept
 * @returns {object|null}
 */
export function getSketchDiagram(concept) {
  return SPATIAL_DIAGRAMS[concept] || null;
}
