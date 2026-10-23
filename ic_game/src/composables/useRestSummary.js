import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useProgressionStore } from "../stores/progression";
import { useStoryStore } from "../stores/story";
import {
  STORY_STAGES,
  calculateStageTotalPayout,
} from "../game/data/progressionConfig";

/**
 * Resume cargo, XP e chamados para a Sala de Descanso.
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

    return {
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
