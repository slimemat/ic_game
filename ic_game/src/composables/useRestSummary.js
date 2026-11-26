import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useProgressionStore } from "../stores/progression";
import { useStoryStore, STORY_CHECKPOINTS } from "../stores/story";
import {
  STORY_STAGES,
  calculateStageTotalPayout,
} from "../game/data/progressionConfig";
import { hasStoryProgress } from "../game/logic/storyChapters";

/**
 * Resume cargo, XP, progresso da história e chamado ativo para o Lobby.
 * Só lê das stores existentes; não duplica regra de negócio.
 */
export function useRestSummary() {
  const { t } = useI18n();
  const progression = useProgressionStore();
  const story = useStoryStore();

  const summary = computed(() => {
    const rank = progression.currentRank;
    const next = progression.nextRank;

    // XP relativo ao cargo atual (combina com rankProgressPercent da store)
    const tierSpan = next ? next.requiredTotalXp - rank.requiredTotalXp : 0;
    const xpInTier = next ? progression.totalXp - rank.requiredTotalXp : 0;

    const completedIds = progression.completedStageIds;
    const currentDone = completedIds.includes(story.currentStageId);
    const stage = story.currentStage;

    const hasProgress = hasStoryProgress({
      checkpoint: story.checkpoint,
      totalXp: progression.totalXp,
      completedStageIds: completedIds,
      introCheckpoint: STORY_CHECKPOINTS.INTRO_CUTSCENE,
    });

    return {
      hasProgress,
      currentDay: story.currentDay || 1,
      chapterNumber: 1,
      rank: {
        title: t(rank.titleKey),
        badgeLabel: rank.badgeLabel,
        badgeColor: rank.badgeColor,
      },
      totalXp: progression.totalXp,
      xp: {
        percent: progression.rankProgressPercent,
        isMax: progression.isMaxRank,
        current: xpInTier,
        target: tierSpan,
        nextRankTitle: next ? t(next.titleKey) : null,
      },
      availableCount: currentDone ? 0 : 1,
      completedCount: STORY_STAGES.filter((s) => completedIds.includes(s.id))
        .length,
      totalCount: STORY_STAGES.length,
      mission: currentDone
        ? null
        : {
            number: stage.stageNumber,
            title: t(stage.titleKey),
            goal: stage.targetChallengesCount,
            reward: calculateStageTotalPayout(stage),
          },
    };
  });

  return { summary };
}
