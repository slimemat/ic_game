export const PROLOGUE_CHAPTER_ID = "prologue";

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
