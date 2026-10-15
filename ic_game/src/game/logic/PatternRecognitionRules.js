/**
 * Regras puras do Pattern Recognition (sem Phaser).
 * Tudo aqui é determinístico e testável isoladamente.
 */

export const NO_ANSWER = -1;

export const AnswerStatus = Object.freeze({
  EMPTY: "empty",
  CORRECT: "correct",
  INCORRECT: "incorrect",
});

/**
 * Guarda qual opção (índice em answerOptions) ocupa o slot de resposta.
 */
export class AnswerSlot {
  constructor() {
    this.occupant = NO_ANSWER;
  }

  get isEmpty() {
    return this.occupant === NO_ANSWER;
  }

  /**
   * Coloca uma opção no slot.
   * @returns {number} índice da opção que foi deslocada (ou NO_ANSWER).
   */
  place(optionIndex) {
    const displaced = this.occupant;
    this.occupant = optionIndex;
    return displaced === optionIndex ? NO_ANSWER : displaced;
  }

  /** Remove a opção do slot, mas só se ela for a ocupante atual. */
  release(optionIndex) {
    if (this.occupant === optionIndex) this.occupant = NO_ANSWER;
  }

  clear() {
    this.occupant = NO_ANSWER;
  }
}

export function evaluateAnswer(occupantIndex, correctOptionIndex) {
  if (occupantIndex === NO_ANSWER) return AnswerStatus.EMPTY;
  return occupantIndex === correctOptionIndex
    ? AnswerStatus.CORRECT
    : AnswerStatus.INCORRECT;
}

/**
 * Verifica se o centro de uma peça está sobre o slot.
 * `tolerance` é uma fração do tamanho do slot (generosa de propósito, para toque).
 */
export function isOverSlot(px, py, slotX, slotY, slotSize, tolerance = 0.7) {
  const limit = slotSize * tolerance;
  return Math.abs(px - slotX) <= limit && Math.abs(py - slotY) <= limit;
}

/**
 * Clona a configuração de uma fase e embaralha as opções de resposta,
 * recalculando o correctOptionIndex para apontar para a nova posição da resposta correta.
 * @param {object} levelConfig
 * @param {() => number} [rng=Math.random]
 * @returns {object}
 */
export function shuffleLevelOptions(levelConfig, rng = Math.random) {
  if (!levelConfig || !Array.isArray(levelConfig.answerOptions)) {
    return levelConfig;
  }

  const { answerOptions, correctOptionIndex } = levelConfig;

  // Se correctOptionIndex não for válido, retorna o config original
  if (
    typeof correctOptionIndex !== "number" ||
    correctOptionIndex < 0 ||
    correctOptionIndex >= answerOptions.length
  ) {
    return levelConfig;
  }

  // Mapeia os itens preservando quem é a resposta correta
  const items = answerOptions.map((val, idx) => ({
    val,
    isCorrect: idx === correctOptionIndex,
  }));

  // Fisher-Yates shuffle
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const temp = items[i];
    items[i] = items[j];
    items[j] = temp;
  }

  const newOptions = items.map((item) => item.val);
  const newCorrectIndex = items.findIndex((item) => item.isCorrect);

  return {
    ...levelConfig,
    answerOptions: newOptions,
    correctOptionIndex:
      newCorrectIndex !== -1 ? newCorrectIndex : correctOptionIndex,
  };
}
