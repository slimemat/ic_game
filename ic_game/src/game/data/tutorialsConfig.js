/**
 * Configuração declarativa dos tutoriais interativos Just-in-Time e da Cola Visual do Rardi.
 *
 * Princípios SOLID e DRY:
 * - Fonte única da verdade para os conceitos espaciais (usada tanto pelo Modal de Tutorial
 *   quanto pelo Post-it de Dica in-game).
 * - Divisão Just-in-Time alinhada à progressão real das fases:
 *   1) `spatial_orientation` (Fase 1 - Etapa 1): Foco exclusivo em Rotação (Horário e Anti-horário)
 *      usando projeção mental + escolha entre alternativas (sem dissonância mecânica).
 *   2) `spatial_reflection` (Fase 11/16 - Etapa 2): Foco em Espelhamento (Horizontal e Vertical)
 *      vs. Rotação, exatamente quando as fases de transformação estreiam.
 */

const baseClockImg = new URL(
  "../../assets/images/base_clock.png",
  import.meta.url,
).href;
const oneQuarterClockImg = new URL(
  "../../assets/images/one_quarter_clock.png",
  import.meta.url,
).href;
const arrowQuarterClockImg = new URL(
  "../../assets/images/arrow_quarter_clock.png",
  import.meta.url,
).href;
const oneQuarterAnticlockImg = new URL(
  "../../assets/images/one_quarter_anticlock.png",
  import.meta.url,
).href;
const arrowQuarterAnticlockImg = new URL(
  "../../assets/images/arrow_quarter_anticlock.png",
  import.meta.url,
).href;

const CLOCK_SKETCH_CW = Object.freeze([
  { src: baseClockImg, label: "12h–3h", tilt: "-2.5deg" },
  { src: oneQuarterClockImg, label: "1/4 (90°)", tilt: "1.5deg" },
  { src: arrowQuarterClockImg, label: "Horário ↷", tilt: "-1.5deg" },
]);

const CLOCK_SKETCH_CCW = Object.freeze([
  { src: baseClockImg, label: "12h–9h", tilt: "2deg" },
  { src: oneQuarterAnticlockImg, label: "1/4 (90°)", tilt: "-1.8deg" },
  { src: arrowQuarterAnticlockImg, label: "Anti ↶", tilt: "1.5deg" },
]);

export const VISUAL_CONCEPT_CARDS = Object.freeze({
  rotate_cw: {
    concept: "rotate_cw",
    color: "#fef08a",
    titleKey: "tutorials.rardi_notes.note_1_title",
    goldenRuleKey: "tutorials.rardi_notes.note_1_golden_rule",
    sketchImages: CLOCK_SKETCH_CW,
    tutorialId: "spatial_orientation",
  },
  rotate_ccw: {
    concept: "rotate_ccw",
    color: "#bfdbfe",
    titleKey: "tutorials.rardi_notes.note_2_title",
    goldenRuleKey: "tutorials.rardi_notes.note_2_golden_rule",
    sketchImages: CLOCK_SKETCH_CCW,
    tutorialId: "spatial_orientation",
  },
  rotate_180: {
    concept: "rotate_180",
    color: "#fef08a",
    titleKey: "tutorials.rardi_notes.note_180_title",
    goldenRuleKey: "tutorials.rardi_notes.note_180_golden_rule",
    tutorialId: "spatial_orientation",
  },
  rotate_45: {
    concept: "rotate_45",
    color: "#fef08a",
    titleKey: "tutorials.rardi_notes.note_45_title",
    goldenRuleKey: "tutorials.rardi_notes.note_45_golden_rule",
    tutorialId: "spatial_orientation",
  },
  flip_h: {
    concept: "flip_h",
    color: "#fbcfe8",
    titleKey: "tutorials.rardi_notes.note_3_title",
    goldenRuleKey: "tutorials.rardi_notes.note_3_golden_rule",
    tutorialId: "spatial_reflection",
  },
  flip_v: {
    concept: "flip_v",
    color: "#bbf7d0",
    titleKey: "tutorials.rardi_notes.note_4_title",
    goldenRuleKey: "tutorials.rardi_notes.note_4_golden_rule",
    tutorialId: "spatial_reflection",
  },
});

export const TUTORIALS_CONFIG = Object.freeze({
  // ── ETAPA 1 (Fase 1): ROTAÇÃO MENTAL (Horário e Anti-Horário) ────────────
  spatial_orientation: {
    id: "spatial_orientation",
    concept: "rotation",
    gameId: "pattern-recognition",
    triggerLevel: 1,
    interactionType: "choice",
    bundledTutorialIds: ["rotation_cw", "rotation_ccw"],
    shape: "spritepaint",
    titleKey: "tutorials.desk.desk_title",
    subtitleKey: "tutorials.desk.desk_badge",
    instructionKey: "tutorials.unified.instruction",
    feedbackKey: "tutorials.degree_steps.deg_90",
    explanationKey: "tutorials.unified.tip_mental",
    rardiNotes: [
      {
        id: "note_1",
        actionKey: "rotate_cw",
        color: "#fef08a",
        tilt: "-1.5deg",
        icon: "↷",
        titleKey: "tutorials.rardi_notes.note_1_title",
        shortTagKey: "tutorials.rardi_notes.note_1_tag_clean",
        sketchImages: CLOCK_SKETCH_CW,
        textKey: "tutorials.rardi_notes.note_1_text",
        promptKey: "tutorials.desk.step_prompt_cw",
        options: [
          {
            id: "cw_opt_270",
            angle: 270,
            flipX: false,
            flipY: false,
            isCorrect: false,
            errorTipKey: "tutorials.desk.wrong_cw_picked_ccw",
          },
          {
            id: "cw_opt_90",
            angle: 90,
            flipX: false,
            flipY: false,
            isCorrect: true,
          },
          {
            id: "cw_opt_180",
            angle: 180,
            flipX: false,
            flipY: false,
            isCorrect: false,
            errorTipKey: "tutorials.desk.wrong_cw_picked_180",
          },
        ],
      },
      {
        id: "note_2",
        actionKey: "rotate_ccw",
        color: "#bfdbfe",
        tilt: "1.5deg",
        icon: "↶",
        titleKey: "tutorials.rardi_notes.note_2_title",
        shortTagKey: "tutorials.rardi_notes.note_2_tag_clean",
        sketchImages: CLOCK_SKETCH_CCW,
        textKey: "tutorials.rardi_notes.note_2_text",
        promptKey: "tutorials.desk.step_prompt_ccw",
        options: [
          {
            id: "ccw_opt_270",
            angle: 270,
            flipX: false,
            flipY: false,
            isCorrect: true,
          },
          {
            id: "ccw_opt_90",
            angle: 90,
            flipX: false,
            flipY: false,
            isCorrect: false,
            errorTipKey: "tutorials.desk.wrong_ccw_picked_cw",
          },
          {
            id: "ccw_opt_180",
            angle: 180,
            flipX: false,
            flipY: false,
            isCorrect: false,
            errorTipKey: "tutorials.desk.wrong_ccw_picked_180",
          },
        ],
      },
    ],
  },

  // ── ETAPA 2 (Fase 11 Diurno / Fase 16 Noturno): ESPELHO VS. GIRO ─────────
  spatial_reflection: {
    id: "spatial_reflection",
    concept: "flip",
    gameId: "pattern-recognition",
    triggerLevel: 11,
    alternateTriggerLevels: [16],
    interactionType: "choice",
    bundledTutorialIds: ["flip_h", "flip_v"],
    shape: "spritepaint",
    titleKey: "tutorials.desk.reflection_title",
    subtitleKey: "tutorials.desk.reflection_badge",
    instructionKey: "tutorials.unified.instruction",
    feedbackKey: "tutorials.degree_steps.flip_h_done",
    explanationKey: "tutorials.unified.tip_mental",
    rardiNotes: [
      {
        id: "note_3",
        actionKey: "flip_h",
        color: "#fbcfe8",
        tilt: "-1.5deg",
        icon: "⇄",
        titleKey: "tutorials.rardi_notes.note_3_title",
        shortTagKey: "tutorials.rardi_notes.note_3_tag_clean",
        goldenRuleKey: "tutorials.rardi_notes.note_3_golden_rule",
        textKey: "tutorials.rardi_notes.note_3_text",
        promptKey: "tutorials.desk.step_prompt_flip_h",
        options: [
          {
            id: "fliph_opt_rot90",
            angle: 90,
            flipX: false,
            flipY: false,
            isCorrect: false,
            errorTipKey: "tutorials.desk.wrong_fliph_picked_rot90",
          },
          {
            id: "fliph_opt_correct",
            angle: 0,
            flipX: true,
            flipY: false,
            isCorrect: true,
          },
          {
            id: "fliph_opt_rot180",
            angle: 180,
            flipX: false,
            flipY: false,
            isCorrect: false,
            errorTipKey: "tutorials.desk.wrong_fliph_picked_rot180",
          },
        ],
      },
      {
        id: "note_4",
        actionKey: "flip_v",
        color: "#bbf7d0",
        tilt: "1.5deg",
        icon: "⇅",
        titleKey: "tutorials.rardi_notes.note_4_title",
        shortTagKey: "tutorials.rardi_notes.note_4_tag_clean",
        goldenRuleKey: "tutorials.rardi_notes.note_4_golden_rule",
        textKey: "tutorials.rardi_notes.note_4_text",
        promptKey: "tutorials.desk.step_prompt_flip_v",
        options: [
          {
            id: "flipv_opt_fliph",
            angle: 0,
            flipX: true,
            flipY: false,
            isCorrect: false,
            errorTipKey: "tutorials.desk.wrong_flipv_picked_fliph",
          },
          {
            id: "flipv_opt_rot90",
            angle: 90,
            flipX: false,
            flipY: false,
            isCorrect: false,
            errorTipKey: "tutorials.desk.wrong_flipv_picked_rot90",
          },
          {
            id: "flipv_opt_correct",
            angle: 0,
            flipX: false,
            flipY: true,
            isCorrect: true,
          },
        ],
      },
    ],
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
    if (tutorial.gameId !== gameId) continue;

    const matchesPrimary = tutorial.triggerLevel === level;
    const matchesAlternate =
      Array.isArray(tutorial.alternateTriggerLevels) &&
      tutorial.alternateTriggerLevels.includes(level);

    if (matchesPrimary || matchesAlternate) {
      if (isCompletedFn && isCompletedFn(tutorial.id)) {
        continue;
      }
      return tutorial;
    }
  }

  return null;
}

/**
 * Resolve os metadados da "Cola Visual do Rardi" para uma fase (ou sub-etapa) do jogo.
 * Retorna `null` para fases não-espaciais (ex.: padrões de cores ou outros jogos),
 * mantendo o desacoplamento (OCP / DIP).
 *
 * @param {Object|null} levelConfig Configuração da fase atual
 * @param {number} [activeStepIndex=0] Índice da sub-etapa ativa (em fases de 2 passos)
 * @returns {typeof VISUAL_CONCEPT_CARDS[keyof typeof VISUAL_CONCEPT_CARDS]|null}
 */
export function resolveVisualHintForLevel(levelConfig, activeStepIndex = 0) {
  if (!levelConfig || levelConfig.type === "color") return null;

  let activeHintKey = levelConfig.hintKey || "";
  if (Array.isArray(levelConfig.steps) && levelConfig.steps.length > 0) {
    const safeIdx = Math.min(activeStepIndex, levelConfig.steps.length - 1);
    activeHintKey = levelConfig.steps[safeIdx]?.hintKey || activeHintKey;
  }

  if (!activeHintKey) return null;

  if (activeHintKey.includes("flip_h")) {
    return VISUAL_CONCEPT_CARDS.flip_h;
  }
  if (activeHintKey.includes("flip_v")) {
    return VISUAL_CONCEPT_CARDS.flip_v;
  }
  if (activeHintKey.includes("180")) {
    return VISUAL_CONCEPT_CARDS.rotate_180;
  }
  if (activeHintKey.includes("45")) {
    return VISUAL_CONCEPT_CARDS.rotate_45;
  }
  if (activeHintKey.includes("ccw")) {
    return VISUAL_CONCEPT_CARDS.rotate_ccw;
  }
  if (
    activeHintKey.includes("cw") ||
    activeHintKey.includes("pingpong") ||
    levelConfig.type === "rotation"
  ) {
    return VISUAL_CONCEPT_CARDS.rotate_cw;
  }

  return null;
}
