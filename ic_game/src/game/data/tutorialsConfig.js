/**
 * Configuração declarativa dos tutoriais interativos Just-in-Time.
 *
 * Apresenta todos os conceitos lógicos espaciais (Rotação Horária, Anti-horária, 180°,
 * Espelhamento Horizontal e Vertical) em uma oficina unificada compacta no estilo papel,
 * com explicações dinâmicas a cada toque do jogador.
 */
export const TUTORIALS_CONFIG = Object.freeze({
  spatial_orientation: {
    id: "spatial_orientation",
    concept: "all",
    gameId: "pattern-recognition",
    triggerLevel: 1,
    interactionType: "all",
    bundledTutorialIds: ["rotation_cw", "rotation_ccw", "flip_h", "flip_v"],
    shape: "spritepaint",
    titleKey: "tutorials.unified.title",
    subtitleKey: "tutorials.unified.badge",
    instructionKey: "tutorials.unified.instruction",
    feedbackKey: "tutorials.degree_steps.deg_90",
    explanationKey: "tutorials.unified.tip_mental",
  },
  rotation_cw: {
    id: "rotation_cw",
    concept: "rotation",
    gameId: "pattern-recognition",
    triggerLevel: null,
    interactionType: "rotate_cw",
    shape: "spritepaint",
    titleKey: "tutorials.unified.title",
    subtitleKey: "tutorials.unified.badge",
    instructionKey: "tutorials.unified.instruction",
    feedbackKey: "tutorials.degree_steps.deg_90",
    explanationKey: "tutorials.unified.tip_mental",
  },
  rotation_ccw: {
    id: "rotation_ccw",
    concept: "rotation",
    gameId: "pattern-recognition",
    triggerLevel: null,
    interactionType: "rotate_ccw",
    shape: "spritepaint",
    titleKey: "tutorials.unified.title",
    subtitleKey: "tutorials.unified.badge",
    instructionKey: "tutorials.unified.instruction",
    feedbackKey: "tutorials.degree_steps.deg_ccw_90",
    explanationKey: "tutorials.unified.tip_mental",
  },
  flip_h: {
    id: "flip_h",
    concept: "flip",
    gameId: "pattern-recognition",
    triggerLevel: null,
    interactionType: "flip_h",
    axis: "vertical",
    shape: "spritepaint",
    titleKey: "tutorials.unified.title",
    subtitleKey: "tutorials.unified.badge",
    instructionKey: "tutorials.unified.instruction",
    feedbackKey: "tutorials.degree_steps.flip_h_done",
    explanationKey: "tutorials.unified.tip_mental",
  },
  flip_v: {
    id: "flip_v",
    concept: "flip",
    gameId: "pattern-recognition",
    triggerLevel: null,
    interactionType: "flip_v",
    axis: "horizontal",
    shape: "spritepaint",
    titleKey: "tutorials.unified.title",
    subtitleKey: "tutorials.unified.badge",
    instructionKey: "tutorials.unified.instruction",
    feedbackKey: "tutorials.degree_steps.flip_v_done",
    explanationKey: "tutorials.unified.tip_mental",
  },
});

/**
 * Busca um tutorial elegível para o nível atual do jogo.
 * @param {string} gameId
 * @param {number} level
 * @param {((tutorialId: string) => boolean)|null} [isCompletedFn]
 * @returns {typeof TUTORIALS_CONFIG[keyof typeof TUTORIALS_CONFIG]|null}
 */
export function getTutorialForLevel(gameId, level, isCompletedFn = null) {
  if (!gameId || !level) return null;

  for (const tutorial of Object.values(TUTORIALS_CONFIG)) {
    if (tutorial.gameId === gameId && tutorial.triggerLevel === level) {
      if (isCompletedFn && isCompletedFn(tutorial.id)) {
        continue;
      }
      return tutorial;
    }
  }

  return null;
}
