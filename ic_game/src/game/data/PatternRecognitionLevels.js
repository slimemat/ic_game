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
 * difficulty 1: O jogador clica na forma resposta para alternar seu estado.
 * difficulty 2: O jogador escolhe a resposta a partir de opções estáticas na tela.
 */
export const LEVEL_CONFIGS = [
  // --- DIFICULDADE 1 (Rotação por clique) ---
  {
    difficulty: 1,
    type: "rotation",
    sequence: [0, 90, 180],
    answerOptions: [0, 90, 180, 270],
    correctOptionIndex: 3, // 270 graus
    initialOptionIndex: 0,
  },
  {
    difficulty: 1,
    type: "color",
    sequence: [COLORS.RED, COLORS.BLUE, COLORS.RED, COLORS.BLUE],
    answerOptions: [COLORS.RED, COLORS.BLUE, COLORS.GREEN, COLORS.YELLOW],
    correctOptionIndex: 0, // Vermelho
    initialOptionIndex: 1,
  },
  {
    difficulty: 1,
    type: "rotation",
    sequence: [0, 45, 90, 135],
    answerOptions: [0, 45, 90, 135, 180, 225, 270, 315],
    correctOptionIndex: 4, // 180 graus
    initialOptionIndex: 0,
  },
  // --- DIFICULDADE 2 (Seleção a partir de lista) ---
  {
    difficulty: 2,
    type: "color",
    sequence: [COLORS.RED, COLORS.BLUE, COLORS.GREEN, COLORS.RED, COLORS.BLUE],
    answerOptions: [
      COLORS.RED,
      COLORS.BLUE,
      COLORS.GREEN,
      COLORS.YELLOW,
      COLORS.PURPLE,
    ],
    correctOptionIndex: 2, // Verde
    initialOptionIndex: -1, // -1 indica nenhuma seleção
  },
  {
    difficulty: 2,
    type: "rotation",
    sequence: [0, 180, 0, 180, 0], // Cima, Baixo, Cima, Baixo, Cima, [Baixo]
    answerOptions: [0, 45, 90, 135, 180], // 5 opções possíveis
    correctOptionIndex: 4, // 180 graus (Baixo)
    initialOptionIndex: -1,
  },
];
