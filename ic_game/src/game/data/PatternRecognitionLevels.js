export const COLORS = {
  // Gameplay Colors
  RED: 0xe53e3e,
  BLUE: 0x3182ce,
  GREEN: 0x38a169,
  YELLOW: 0xd69e2e,
  PURPLE: 0x805ad5,

  // UI and Shape Theme Colors
  SHAPE_DEFAULT: 0x63b3ed,
  SLOT_BG: 0x2d3748,
  SLOT_BORDER: 0xa0aec0,
  OPTION_BG: 0x1a202c,
  OPTION_BORDER: 0x4a5568,
  OPTION_BORDER_ACTIVE: 0x63b3ed,
};

/**
 * Cada objeto representa uma fase do jogo.
 *
 * Em todas as fases o jogador ARRASTA uma das `answerOptions` até o slot "?".
 * `difficulty` é apenas um rótulo de progressão (exibido nos modais) e define
 * qual texto de pergunta é usado; não altera mais a mecânica de interação.
 *
 * correctOptionIndex: índice (em answerOptions) da opção correta.
 */
export const LEVEL_CONFIGS = [
  // ── ETAPA 1: ROTAÇÃO GEOMÉTRICA (Fases 1 a 10) ───────────────────────────
  {
    difficulty: 1,
    type: "rotation",
    shape: "triangle",
    sequence: [0, 90, 180],
    answerOptions: [0, 90, 180, 270],
    correctOptionIndex: 3, // 270°
  },
  {
    difficulty: 1,
    type: "rotation",
    shape: "arrow",
    sequence: [0, 270, 180], // Sentido anti-horário (Cima, Esquerda, Baixo) -> Direita (90°)
    answerOptions: [0, 90, 180, 270],
    correctOptionIndex: 1, // 90°
  },
  {
    difficulty: 1,
    type: "rotation",
    shape: "t_shape",
    sequence: [0, 180, 0, 180], // Alternando 180° (Cima, Baixo, Cima, Baixo) -> Cima (0°)
    answerOptions: [0, 90, 180, 270],
    correctOptionIndex: 0, // 0°
  },
  {
    difficulty: 1,
    type: "rotation",
    shape: "l_shape",
    sequence: [90, 180, 270], // Sentido horário -> 0°
    answerOptions: [0, 90, 180, 270],
    correctOptionIndex: 0, // 0°
  },
  {
    difficulty: 1,
    type: "rotation",
    shape: "chevron",
    sequence: [0, 45, 90, 135], // Rotação de 45° -> 180°
    answerOptions: [0, 45, 90, 135, 180, 225, 270, 315],
    correctOptionIndex: 4, // 180°
  },
  {
    difficulty: 1,
    type: "rotation",
    shape: "semicircle",
    sequence: [180, 270, 0], // Baixo, Esquerda, Cima -> Direita (90°)
    answerOptions: [0, 90, 180, 270],
    correctOptionIndex: 1, // 90°
  },
  {
    difficulty: 1,
    type: "rotation",
    shape: "wedge",
    sequence: [0, 90, 180, 270], // Ciclo completo de 90° -> 0°
    answerOptions: [0, 90, 180, 270],
    correctOptionIndex: 0, // 0°
  },
  {
    difficulty: 1,
    type: "rotation",
    shape: "pointer",
    sequence: [45, 90, 135, 180], // Passos diagonais de 45° -> 225°
    answerOptions: [45, 90, 135, 180, 225, 270, 315],
    correctOptionIndex: 4, // 225°
  },
  {
    difficulty: 1,
    type: "rotation",
    shape: "l_shape",
    sequence: [0, 90, 0, 90, 0], // Alternância ping-pong -> 90°
    answerOptions: [0, 45, 90, 180, 270],
    correctOptionIndex: 2, // 90°
  },
  {
    difficulty: 1,
    type: "rotation",
    shape: "arrow",
    sequence: [0, 315, 270, 225], // Passos de -45° anti-horário -> 180°
    answerOptions: [45, 90, 135, 180, 225, 270, 315],
    correctOptionIndex: 3, // 180°
  },
  // ── ETAPA 2+: CORES E COMPLEXIDADE ESTENDIDA (Fases 11+) ─────────────────
  {
    difficulty: 2,
    type: "color",
    shape: "circle",
    sequence: [COLORS.RED, COLORS.BLUE, COLORS.RED, COLORS.BLUE],
    answerOptions: [COLORS.RED, COLORS.BLUE, COLORS.GREEN, COLORS.YELLOW],
    correctOptionIndex: 0, // Vermelho
  },
  {
    difficulty: 2,
    type: "color",
    shape: "circle",
    sequence: [COLORS.RED, COLORS.BLUE, COLORS.GREEN, COLORS.RED, COLORS.BLUE],
    answerOptions: [
      COLORS.RED,
      COLORS.BLUE,
      COLORS.GREEN,
      COLORS.YELLOW,
      COLORS.PURPLE,
    ],
    correctOptionIndex: 2, // Verde
  },
];

/**
 * Filter level configurations by difficulty tier or pattern type.
 * Prepared for dynamic level generator and stage balancing.
 * @param {{ difficultyTier?: number, type?: string }} [filters]
 * @returns {typeof LEVEL_CONFIGS}
 */
export function getLevelsForConfig(filters = {}) {
  return LEVEL_CONFIGS.filter((lvl) => {
    if (filters.difficultyTier && lvl.difficulty !== filters.difficultyTier) {
      return false;
    }
    if (filters.type && lvl.type !== filters.type) {
      return false;
    }
    return true;
  });
}
