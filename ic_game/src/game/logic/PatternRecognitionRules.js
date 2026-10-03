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
