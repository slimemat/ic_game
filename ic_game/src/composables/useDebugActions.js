import { computed, onBeforeUnmount, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useStoryStore, STORY_CHECKPOINTS } from "../stores/story";
import { useProgressionStore } from "../stores/progression";
import { RANKS, STORY_STAGES } from "../game/data/progressionConfig";

const FEEDBACK_MS = 4000;
const [STAGE_1, STAGE_2, STAGE_3] = STORY_STAGES;
const STAGE_2_START_XP = RANKS[1].requiredTotalXp;
const STAGE_3_START_XP = RANKS[2].requiredTotalXp;

/**
 * Ações de desenvolvimento (switches de decisões, reset e atalhos para qualquer checkpoint).
 * Não navega sozinho: quem chama emite o evento para ativar o Modo História.
 */
export function useDebugActions() {
  const { t } = useI18n();
  const story = useStoryStore();
  const progression = useProgressionStore();

  const message = ref("");
  let timer = null;

  const selectedShift = computed(
    () => story.storyDecisions?.stage2TimeOfDay || "night",
  );

  const selectedStars = computed(() => story.lastStageStars || 3);
  const currentDay = computed(() => story.currentDay || 1);
  const currentCheckpoint = computed(() => story.checkpoint);

  function flash(text) {
    clearTimeout(timer);
    message.value = text;
    timer = setTimeout(() => {
      message.value = "";
    }, FEEDBACK_MS);
  }

  onBeforeUnmount(() => clearTimeout(timer));

  /**
   * Atualiza imediatamente no Pinia a decisão de turno/horário da Etapa 2.
   * @param {'night' | 'day'} shift
   * @param {{ silent?: boolean }} [options]
   */
  function setShiftDecision(shift, { silent = false } = {}) {
    const validShift = shift === "day" ? "day" : "night";
    story.recordDecision("stage2TimeOfDay", validShift);
    story.recordDecision("workedLateDay1", validShift === "night");
    story.setCurrentDay(validShift === "night" ? 1 : 2);

    if (!silent) {
      const label =
        validShift === "night"
          ? t("hub.debug.status_shift_night")
          : t("hub.debug.status_shift_day");
      flash(t("hub.debug.feedback_shift_changed", { shift: label }));
    }
  }

  /**
   * Atualiza imediatamente no Pinia a avaliação de estrelas da etapa.
   * @param {1 | 2 | 3} stars
   */
  function setStarsDecision(stars) {
    const validStars = [1, 2, 3].includes(Number(stars)) ? Number(stars) : 3;
    story.lastStageStars = validStars;
    story.save();
    flash(t("hub.debug.feedback_stars_changed", { stars: validStars }));
  }

  function ensureStage2State() {
    setShiftDecision(selectedShift.value, { silent: true });
    progression.totalXp = Math.max(progression.totalXp, STAGE_2_START_XP);
    progression.markStageCompleted(STAGE_1.id);
    progression.pendingPromotion = null;
    progression.save();

    story.currentStageId = STAGE_2.id;
    if (!story.completedTasks.includes(STAGE_1.gameId)) {
      story.completedTasks.push(STAGE_1.gameId);
    }
  }

  function resetProgress() {
    story.resetProgress();
    flash(t("hub.debug.reset_done"));
  }

  function prepareStage2() {
    jumpToPreset("game-stage-2");
  }

  /**
   * Configura o Pinia para pular diretamente para um checkpoint de cutscene, jogo ou painel.
   * @param {string} presetId
   */
  function jumpToPreset(presetId) {
    story.setPaused(false);
    progression.pendingPromotion = null;

    switch (presetId) {
      case "cutscene-intro": {
        story.currentStageId = STAGE_1.id;
        story.activeTaskId = null;
        story.activeCutsceneId = "intro";
        story.currentDay = 1;
        story.advanceCheckpoint(STORY_CHECKPOINTS.INTRO_CUTSCENE);
        flash(
          t("hub.debug.feedback_jumped", {
            target: t("hub.debug.presets.cutscene_intro"),
          }),
        );
        break;
      }

      case "cutscene-pre-1": {
        story.currentStageId = STAGE_1.id;
        story.activeTaskId = STAGE_1.gameId;
        story.currentPatternCount = 0;
        story.currentStageMistakes = 0;
        story.activeCutsceneId = "pre-pattern-recognition";
        story.advanceCheckpoint(STORY_CHECKPOINTS.TASK_INTRO_CUTSCENE);
        flash(
          t("hub.debug.feedback_jumped", {
            target: t("hub.debug.presets.cutscene_pre_1"),
          }),
        );
        break;
      }

      case "cutscene-post-1": {
        progression.totalXp = Math.max(progression.totalXp, STAGE_2_START_XP);
        progression.markStageCompleted(STAGE_1.id);
        progression.save();

        story.currentStageId = STAGE_1.id;
        story.activeTaskId = null;
        story.lastStageStars = selectedStars.value;
        story.activeCutsceneId = "post-pattern-recognition-1";
        story.advanceCheckpoint(STORY_CHECKPOINTS.POST_STAGE_CUTSCENE);
        flash(
          t("hub.debug.feedback_jumped", {
            target: t("hub.debug.presets.cutscene_post_1", {
              stars: selectedStars.value,
            }),
          }),
        );
        break;
      }

      case "cutscene-pre-2": {
        ensureStage2State();
        story.activeTaskId = STAGE_2.gameId;
        story.currentPatternCount = 0;
        story.currentStageMistakes = 0;
        story.activeCutsceneId = "pre-pattern-recognition-2";
        story.advanceCheckpoint(STORY_CHECKPOINTS.TASK_INTRO_CUTSCENE);
        flash(
          t("hub.debug.feedback_jumped", {
            target: t("hub.debug.presets.cutscene_pre_2"),
          }),
        );
        break;
      }

      case "cutscene-post-2": {
        ensureStage2State();
        progression.markStageCompleted(STAGE_2.id);
        progression.save();

        story.activeTaskId = null;
        story.lastStageStars = selectedStars.value;
        story.activeCutsceneId = "post-pattern-recognition-2";
        story.advanceCheckpoint(STORY_CHECKPOINTS.POST_STAGE_CUTSCENE);
        const labelKey =
          selectedShift.value === "night"
            ? "hub.debug.presets.cutscene_post_2_night"
            : "hub.debug.presets.cutscene_post_2_day";
        flash(
          t("hub.debug.feedback_jumped", {
            target: t(labelKey),
          }),
        );
        break;
      }

      case "screen-dashboard": {
        setShiftDecision(selectedShift.value, { silent: true });
        story.activeTaskId = null;
        story.advanceCheckpoint(STORY_CHECKPOINTS.DASHBOARD);
        flash(
          t("hub.debug.feedback_jumped", {
            target: t("hub.debug.presets.screen_dashboard"),
          }),
        );
        break;
      }

      case "game-stage-1": {
        story.currentStageId = STAGE_1.id;
        story.currentDay = 1;
        story.startTask(STAGE_1.gameId, { withBriefing: false });
        flash(
          t("hub.debug.feedback_jumped", {
            target: t("hub.debug.presets.game_stage_1"),
          }),
        );
        break;
      }

      case "game-stage-2": {
        ensureStage2State();
        story.startTask(STAGE_2.gameId, { withBriefing: false });
        const labelKey =
          selectedShift.value === "night"
            ? "hub.debug.presets.game_stage_2_night"
            : "hub.debug.presets.game_stage_2_day";
        flash(
          t("hub.debug.feedback_jumped", {
            target: t(labelKey),
          }),
        );
        break;
      }

      case "game-stage-2-multi": {
        ensureStage2State();
        story.startTask(STAGE_2.gameId, { withBriefing: false });
        // Posiciona na última fase da Etapa 2 (índice 4 -> Fase 15 ou Fase 20)
        story.setPatternProgress(
          Math.max(0, (STAGE_2.targetChallengesCount || 5) - 1),
        );
        flash(
          t("hub.debug.feedback_jumped", {
            target: t("hub.debug.presets.game_stage_2_multi"),
          }),
        );
        break;
      }

      case "game-stage-3": {
        setShiftDecision(selectedShift.value, { silent: true });
        progression.totalXp = Math.max(progression.totalXp, STAGE_3_START_XP);
        progression.markStageCompleted(STAGE_1.id);
        progression.markStageCompleted(STAGE_2.id);
        progression.save();

        story.currentStageId = STAGE_3.id;
        story.currentDay = 2;
        story.lobbyUnlocked = true;
        story.startTask(STAGE_3.gameId, { withBriefing: false });
        flash(
          t("hub.debug.feedback_jumped", {
            target: t("hub.debug.presets.game_stage_3"),
          }),
        );
        break;
      }

      case "screen-promotion": {
        progression.totalXp = Math.max(progression.totalXp, STAGE_2_START_XP);
        progression.pendingPromotion = {
          fromRank: RANKS[0],
          toRank: RANKS[1],
        };
        progression.save();

        story.currentStageId = STAGE_1.id;
        story.activeTaskId = null;
        story.advanceCheckpoint(STORY_CHECKPOINTS.PROMOTION);
        flash(
          t("hub.debug.feedback_jumped", {
            target: t("hub.debug.presets.screen_promotion"),
          }),
        );
        break;
      }
    }
  }

  return {
    message,
    selectedShift,
    selectedStars,
    currentDay,
    currentCheckpoint,
    setShiftDecision,
    setStarsDecision,
    jumpToPreset,
    resetProgress,
    prepareStage2,
  };
}
