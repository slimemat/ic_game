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
 * `promptKey` define o enunciado curto exibido no topo da tela.
 * `hintKey` define a orientação da regra exibida no botão de dica ("?").
 *
 * correctOptionIndex: índice (em answerOptions) da opção correta.
 */
export const LEVEL_CONFIGS = [
  // ── ETAPA 1: ROTAÇÃO GEOMÉTRICA (Fases 1 a 10) ───────────────────────────
  {
    difficulty: 1,
    type: "rotation",
    shape: "triangle",
    promptKey: "pattern.prompts.rotation_sequence",
    hintKey: "pattern.hints.rotate_cw_90",
    sequence: [0, 90, 180],
    answerOptions: [0, 90, 180, 270],
    correctOptionIndex: 3, // 270°
  },
  {
    difficulty: 1,
    type: "rotation",
    shape: "arrow",
    promptKey: "pattern.prompts.rotation_sequence",
    hintKey: "pattern.hints.rotate_ccw_90",
    sequence: [0, 270, 180], // Sentido anti-horário (Cima, Esquerda, Baixo) -> Direita (90°)
    answerOptions: [0, 90, 180, 270],
    correctOptionIndex: 1, // 90°
  },
  {
    difficulty: 1,
    type: "rotation",
    shape: "t_shape",
    promptKey: "pattern.prompts.rotation_cycle",
    hintKey: "pattern.hints.alternate_180",
    sequence: [0, 180, 0, 180], // Alternando 180° (Cima, Baixo, Cima, Baixo) -> Cima (0°)
    answerOptions: [0, 90, 180, 270],
    correctOptionIndex: 0, // 0°
  },
  {
    difficulty: 1,
    type: "rotation",
    shape: "l_shape",
    promptKey: "pattern.prompts.rotation_sequence",
    hintKey: "pattern.hints.rotate_cw_90",
    sequence: [90, 180, 270], // Sentido horário -> 0°
    answerOptions: [0, 90, 180, 270],
    correctOptionIndex: 0, // 0°
  },
  {
    difficulty: 1,
    type: "rotation",
    shape: "chevron",
    promptKey: "pattern.prompts.rotation_sequence",
    hintKey: "pattern.hints.rotate_cw_45",
    sequence: [0, 45, 90, 135], // Rotação de 45° -> 180°
    answerOptions: [0, 45, 90, 135, 180, 225, 270, 315],
    correctOptionIndex: 4, // 180°
  },
  {
    difficulty: 1,
    type: "rotation",
    shape: "semicircle",
    promptKey: "pattern.prompts.rotation_sequence",
    hintKey: "pattern.hints.rotate_cw_90",
    sequence: [180, 270, 0], // Baixo, Esquerda, Cima -> Direita (90°)
    answerOptions: [0, 90, 180, 270],
    correctOptionIndex: 1, // 90°
  },
  {
    difficulty: 1,
    type: "rotation",
    shape: "wedge",
    promptKey: "pattern.prompts.rotation_cycle",
    hintKey: "pattern.hints.cycle_cw_90",
    sequence: [0, 90, 180, 270], // Ciclo completo de 90° -> 0°
    answerOptions: [0, 90, 180, 270],
    correctOptionIndex: 0, // 0°
  },
  {
    difficulty: 1,
    type: "rotation",
    shape: "pointer",
    preserveColors: true,
    promptKey: "pattern.prompts.rotation_sequence",
    hintKey: "pattern.hints.rotate_cw_45",
    sequence: [45, 90, 135, 180], // Passos diagonais de 45° -> 225°
    answerOptions: [45, 90, 135, 180, 225, 270, 315],
    correctOptionIndex: 4, // 225°
  },
  {
    difficulty: 1,
    type: "rotation",
    shape: "l_shape",
    promptKey: "pattern.prompts.rotation_cycle",
    hintKey: "pattern.hints.alternate_pingpong",
    sequence: [0, 90, 0, 90, 0], // Alternância ping-pong -> 90°
    answerOptions: [0, 45, 90, 180, 270],
    correctOptionIndex: 2, // 90°
  },
  {
    difficulty: 1,
    type: "rotation",
    shape: "arrow",
    promptKey: "pattern.prompts.rotation_sequence",
    hintKey: "pattern.hints.rotate_ccw_45",
    sequence: [0, 315, 270, 225], // Passos de -45° anti-horário -> 180°
    answerOptions: [45, 90, 135, 180, 225, 270, 315],
    correctOptionIndex: 3, // 180°
  },
  // ── ETAPA 2: TRANSFORMAÇÃO ESPACIAL E DIRETIVAS (Fases 11 a 15) ──────────
  {
    difficulty: 2,
    type: "transformation",
    shape: "split_square",
    promptKey: "pattern.prompts.transform_rotate_90_cw",
    hintKey: "pattern.hints.transform_rotate_90_cw",
    baseShape: { angle: 0, flipX: false, flipY: false },
    answerOptions: [
      { angle: 0, flipX: false, flipY: false },
      { angle: 90, flipX: false, flipY: false },
      { angle: 180, flipX: false, flipY: false },
      { angle: 270, flipX: false, flipY: false },
    ],
    correctOptionIndex: 1, // 90° horário
  },
  {
    difficulty: 2,
    type: "transformation",
    shape: "split_triangle",
    promptKey: "pattern.prompts.transform_flip_h",
    hintKey: "pattern.hints.transform_flip_h",
    baseShape: { angle: 0, flipX: false, flipY: false },
    answerOptions: [
      { angle: 0, flipX: false, flipY: false },
      { angle: 0, flipX: true, flipY: false },
      { angle: 180, flipX: false, flipY: false },
      { angle: 90, flipX: false, flipY: false },
    ],
    correctOptionIndex: 1, // Espelhado horizontal
  },
  {
    difficulty: 2,
    type: "transformation",
    shape: "split_shield",
    promptKey: "pattern.prompts.transform_rotate_180",
    hintKey: "pattern.hints.transform_rotate_180",
    baseShape: { angle: 0, flipX: false, flipY: false },
    answerOptions: [
      { angle: 0, flipX: true, flipY: false },
      { angle: 90, flipX: false, flipY: false },
      { angle: 180, flipX: false, flipY: false },
      { angle: 270, flipX: false, flipY: false },
    ],
    correctOptionIndex: 2, // 180°
  },
  {
    difficulty: 2,
    type: "transformation",
    shape: "split_circle",
    promptKey: "pattern.prompts.transform_flip_v",
    hintKey: "pattern.hints.transform_flip_v",
    baseShape: { angle: 90, flipX: false, flipY: false },
    answerOptions: [
      { angle: 90, flipX: false, flipY: false },
      { angle: 270, flipX: false, flipY: false },
      { angle: 0, flipX: false, flipY: false },
      { angle: 180, flipX: false, flipY: false },
    ],
    correctOptionIndex: 1, // Invertido topo e base
  },
  {
    difficulty: 2,
    type: "transformation",
    shape: "split_diamond",
    promptKey: "pattern.prompts.transform_rotate_90_flip_h",
    hintKey: "pattern.hints.transform_rotate_90_flip_h",
    baseShape: { angle: 0, flipX: false, flipY: false },
    answerOptions: [
      { angle: 90, flipX: false, flipY: false },
      { angle: 0, flipX: true, flipY: false },
      { angle: 270, flipX: false, flipY: false },
      { angle: 90, flipX: true, flipY: false },
    ],
    correctOptionIndex: 3, // 90° horário + espelhado horizontal
  },
  // ── ETAPA 3+: CORES E COMPLEXIDADE ESTENDIDA (Fases 16+) ─────────────────
  {
    difficulty: 2,
    type: "color",
    shape: "circle",
    promptKey: "pattern.prompts.color_sequence",
    hintKey: "pattern.hints.color_alternate_2",
    sequence: [COLORS.RED, COLORS.BLUE, COLORS.RED, COLORS.BLUE],
    answerOptions: [COLORS.RED, COLORS.BLUE, COLORS.GREEN, COLORS.YELLOW],
    correctOptionIndex: 0, // Vermelho
  },
  {
    difficulty: 2,
    type: "color",
    shape: "circle",
    promptKey: "pattern.prompts.color_sequence",
    hintKey: "pattern.hints.color_cycle_3",
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
