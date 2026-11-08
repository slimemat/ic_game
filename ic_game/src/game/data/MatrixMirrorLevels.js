/**
 * Paleta do Matrix Mirror (valores numéricos para uso direto no Phaser).
 * Cada post-it "ligado" usa uma paleta: ciano = original, amarelo = jogador.
 */
export const COLORS = {
  ORIGINAL: { bg: 0x67e8f9, tape: 0x22d3ee, border: 0x0891b2 }, // ciano
  PLAYER: { bg: 0xfde047, tape: 0xfacc15, border: 0xca8a04 }, // amarelo
  PANEL: 0x0f172a,
  PANEL_ALPHA: 0.45,
  SLOT_ALPHA: 0.22,
  TEXT_OFF: "#cbd5e1",
  TEXT_ON: "#0f172a",
};

/**
 * Normaliza uma matriz 1D ([1,0,0]) ou 2D ([[1,0],[0,1]]) para sempre ser 2D.
 * Assim a Scene não precisa de `if (is2D)` espalhado pelo código.
 */
export const toGrid = (matrix) =>
  Array.isArray(matrix[0]) ? matrix : [matrix];

/**
 * `i18nKey` aponta para `matrix.levels.<id>` no pt-BR.json,
 * que contém `title` e `description`.
 */
export const LEVELS = [
  {
    // Fase 1: 1D Espelhamento
    i18nKey: "matrix.levels.line",
    input: [1, 0, 0],
    expected: [0, 0, 1],
    dimensions: { rows: 1, cols: 3 },
  },
  {
    // Fase 2: 2x2
    i18nKey: "matrix.levels.block2",
    input: [
      [1, 0],
      [0, 1],
    ],
    expected: [
      [0, 1],
      [1, 0],
    ],
    dimensions: { rows: 2, cols: 2 },
  },
  {
    // Fase 3: 3x3 Desafio
    i18nKey: "matrix.levels.lock3",
    input: [
      [0, 1, 1],
      [1, 0, 0],
      [0, 1, 1],
    ],
    expected: [
      [1, 1, 0],
      [0, 0, 1],
      [1, 1, 0],
    ],
    dimensions: { rows: 3, cols: 3 },
  },
];
