export const PROLOGUE_CHAPTER_ID = "prologue";

/**
 * Determines whether the player has progressed past the initial state.
 * Shared across Home and Story tabs so progress detection stays DRY.
 * @param {{
 *   checkpoint: string,
 *   totalXp?: number,
 *   completedStageIds?: string[],
 *   introCheckpoint: string,
 * }} params
 * @returns {boolean}
 */
export function hasStoryProgress({
  checkpoint,
  totalXp = 0,
  completedStageIds = [],
  introCheckpoint,
}) {
  return Boolean(
    checkpoint !== introCheckpoint ||
    totalXp > 0 ||
    (completedStageIds?.length || 0) > 0,
  );
}

/**
 * Resolves a coherent narrative day when jumping to a story stage.
 * @param {number} stageNumber
 * @param {{ stage2TimeOfDay?: string }} [storyDecisions]
 * @param {number} [currentDay]
 * @returns {number}
 */
export function resolveChapterDay(
  stageNumber,
  storyDecisions = {},
  currentDay = 1,
) {
  if (stageNumber <= 1) return 1;
  if (stageNumber === 2) {
    return storyDecisions?.stage2TimeOfDay === "day" ? 2 : 1;
  }
  return Math.max(Number(currentDay) || 1, 2);
}

/**
 * Builds the player-facing list of story chapters (Prologue + Stages).
 * @param {{
 *   stages: Array<{ id: string, stageNumber: number, titleKey: string, targetChallengesCount: number }>,
 *   currentStageId: string,
 *   checkpoint: string,
 *   completedStageIds?: string[],
 *   introCheckpoint: string,
 * }} params
 */
export function buildStoryChapters({
  stages,
  currentStageId,
  checkpoint,
  completedStageIds = [],
  introCheckpoint,
}) {
  const isAtIntro = checkpoint === introCheckpoint;

  const prologue = {
    id: PROLOGUE_CHAPTER_ID,
    kind: "prologue",
    stageNumber: 0,
    status: isAtIntro ? "current" : "done",
  };

  const stageItems = (stages || []).map((stage) => {
    const isCurrent = !isAtIntro && currentStageId === stage.id;
    const isDone = !isCurrent && completedStageIds.includes(stage.id);
    const status = isCurrent ? "current" : isDone ? "done" : "available";

    return {
      id: stage.id,
      kind: "stage",
      stageNumber: stage.stageNumber,
      titleKey: stage.titleKey,
      targetChallengesCount: stage.targetChallengesCount,
      status,
    };
  });

  return [prologue, ...stageItems];
}

/**
 * Summarizes the player's latest completed milestone and upcoming stage for the Story Recap card.
 * @param {{
 *   stages: Array<{ id: string, stageNumber: number, titleKey: string, descriptionKey?: string }>,
 *   currentStageId: string,
 *   checkpoint: string,
 *   completedStageIds?: string[],
 *   totalXp?: number,
 *   introCheckpoint: string,
 * }} params
 */
export function buildStoryRecap({
  stages = [],
  currentStageId,
  checkpoint,
  completedStageIds = [],
  totalXp = 0,
  introCheckpoint,
}) {
  const progressed = hasStoryProgress({
    checkpoint,
    totalXp,
    completedStageIds,
    introCheckpoint,
  });

  const completedStages = stages.filter((s) =>
    completedStageIds.includes(s.id),
  );
  const lastCompletedStage =
    completedStages.length > 0
      ? completedStages.reduce((latest, candidate) =>
          candidate.stageNumber > latest.stageNumber ? candidate : latest,
        )
      : null;

  const isAtIntro = checkpoint === introCheckpoint;
  const activeStage = stages.find((s) => s.id === currentStageId) || null;
  const firstPendingStage =
    stages.find((s) => !completedStageIds.includes(s.id)) || null;

  const nextStage = isAtIntro
    ? stages[0] || null
    : activeStage && !completedStageIds.includes(activeStage.id)
      ? activeStage
      : firstPendingStage;

  const allCompleted =
    stages.length > 0 && completedStages.length >= stages.length;

  return {
    isNewJourney: !progressed,
    hasCompletedIntro:
      checkpoint !== introCheckpoint || completedStages.length > 0,
    lastCompletedStage,
    nextStage,
    allCompleted,
  };
}
