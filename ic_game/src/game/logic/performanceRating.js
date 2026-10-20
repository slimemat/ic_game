/**
 * Regras puras de avaliação de desempenho e cálculo de estrelas (sem Phaser ou Vue).
 * Determinístico, aderente a SOLID (Single Responsibility / Open-Closed) e 100% testável.
 */

export const MAX_STARS = 3;
export const MIN_STARS = 1;

export const RatingTier = Object.freeze({
  PERFECT: "perfect",
  GOOD: "good",
  COMPLETED: "completed",
});

/**
 * Calcula a quantidade de estrelas conquistadas (1 a 3) e a classificação
 * com base na quantidade de erros cometidos durante o grupo de fases.
 *
 * Regras:
 * - 0 erros: 3 estrelas (Perfeito)
 * - 1 a 2 erros: 2 estrelas (Bom)
 * - 3 ou mais erros: 1 estrela (Concluído)
 *
 * @param {{ mistakes?: number }} [params]
 * @returns {{
 *   stars: number,
 *   maxStars: number,
 *   mistakes: number,
 *   isPerfect: boolean,
 *   tier: string,
 *   labelKey: string
 * }}
 */
export function calculateStarRating({ mistakes = 0 } = {}) {
  const validMistakes = Math.max(0, Math.trunc(Number(mistakes) || 0));

  if (validMistakes === 0) {
    return {
      stars: 3,
      maxStars: MAX_STARS,
      mistakes: 0,
      isPerfect: true,
      tier: RatingTier.PERFECT,
      labelKey: "global.modals.rating_perfect",
    };
  }

  if (validMistakes <= 2) {
    return {
      stars: 2,
      maxStars: MAX_STARS,
      mistakes: validMistakes,
      isPerfect: false,
      tier: RatingTier.GOOD,
      labelKey: "global.modals.rating_good",
    };
  }

  return {
    stars: MIN_STARS,
    maxStars: MAX_STARS,
    mistakes: validMistakes,
    isPerfect: false,
    tier: RatingTier.COMPLETED,
    labelKey: "global.modals.rating_completed",
  };
}

/**
 * Calcula o percentual de precisão da partida ou etapa.
 * @param {{ totalChallenges?: number, mistakes?: number }} [params]
 * @returns {number} Valor inteiro entre 0 e 100.
 */
export function calculateAccuracyPercent({
  totalChallenges = 1,
  mistakes = 0,
} = {}) {
  const validTotal = Math.max(1, Math.trunc(Number(totalChallenges) || 1));
  const validMistakes = Math.max(0, Math.trunc(Number(mistakes) || 0));
  const attempts = validTotal + validMistakes;
  return Math.min(100, Math.max(0, Math.round((validTotal / attempts) * 100)));
}
