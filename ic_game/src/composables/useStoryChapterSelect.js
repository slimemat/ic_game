import { computed, onBeforeUnmount, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useStoryStore, STORY_CHECKPOINTS } from "../stores/story";
import { useProgressionStore } from "../stores/progression";
import { STORY_STAGES } from "../game/data/progressionConfig";
import {
  PROLOGUE_CHAPTER_ID,
  buildStoryChapters,
  resolveChapterDay,
} from "../game/logic/storyChapters";

const FEEDBACK_MS = 3500;

/**
 * Player-facing Story Mode chapter selector and safe progress reset.
 * Consumes existing Pinia stores without duplicating progression rules.
 */
export function useStoryChapterSelect() {
  const { t } = useI18n();
  const story = useStoryStore();
  const progression = useProgressionStore();

  const feedbackMessage = ref("");
  let feedbackTimer = null;

  onBeforeUnmount(() => clearTimeout(feedbackTimer));

  const companyName = computed(() => t("story.variables.companyName"));

  const hasProgress = computed(
    () =>
      story.checkpoint !== STORY_CHECKPOINTS.INTRO_CUTSCENE ||
      progression.totalXp > 0 ||
      progression.completedStageIds.length > 0,
  );

  const currentStageNumber = computed(() => story.currentStage.stageNumber);
  const currentDay = computed(() => story.currentDay || 1);

  const chapters = computed(() =>
    buildStoryChapters({
      stages: STORY_STAGES,
      currentStageId: story.currentStageId,
      checkpoint: story.checkpoint,
      completedStageIds: progression.completedStageIds,
      introCheckpoint: STORY_CHECKPOINTS.INTRO_CUTSCENE,
    }).map((item) => {
      if (item.kind === "prologue") {
        return {
          ...item,
          eyebrow: t("hub.story.prologue_eyebrow"),
          title: t("hub.story.prologue_title", {
            companyName: companyName.value,
          }),
          meta: t("hub.story.prologue_meta"),
          statusLabel: t(`hub.story.status_${item.status}`),
        };
      }

      return {
        ...item,
        eyebrow: t("story.dashboard.ticket_eyebrow", {
          num: item.stageNumber,
        }),
        title: t(item.titleKey),
        meta: t("story.dashboard.task_goal", {
          count: item.targetChallengesCount,
        }),
        statusLabel: t(`hub.story.status_${item.status}`),
      };
    }),
  );

  /**
   * Positions the Story Mode on the chosen chapter without wiping earned XP.
   * @param {string} chapterId
   * @returns {boolean}
   */
  function selectChapter(chapterId) {
    story.setPaused(false);
    progression.pendingPromotion = null;

    if (chapterId === PROLOGUE_CHAPTER_ID) {
      story.currentStageId = STORY_STAGES[0].id;
      story.activeTaskId = null;
      story.activeCutsceneId = "intro";
      story.setCurrentDay(1);
      story.setPatternProgress(0);
      story.advanceCheckpoint(STORY_CHECKPOINTS.INTRO_CUTSCENE);
      return true;
    }

    const stage = STORY_STAGES.find((s) => s.id === chapterId);
    if (!stage) return false;

    story.currentStageId = stage.id;
    story.activeTaskId = null;
    story.setPatternProgress(0);
    story.setCurrentDay(
      resolveChapterDay(
        stage.stageNumber,
        story.storyDecisions,
        story.currentDay,
      ),
    );
    story.advanceCheckpoint(STORY_CHECKPOINTS.DASHBOARD);
    return true;
  }

  function resetStoryProgress() {
    story.resetProgress();
    clearTimeout(feedbackTimer);
    feedbackMessage.value = t("hub.story.reset_done");
    feedbackTimer = setTimeout(() => {
      feedbackMessage.value = "";
    }, FEEDBACK_MS);
  }

  return {
    companyName,
    hasProgress,
    currentStageNumber,
    currentDay,
    chapters,
    feedbackMessage,
    selectChapter,
    resetStoryProgress,
  };
}
