/**
 * Career Ranks in the corporate ladder.
 * Each rank defines the required cumulative XP to unlock it.
 */
export const RANKS = Object.freeze([
  {
    id: "intern",
    titleKey: "story.ranks.intern", // "Estagiário"
    requiredTotalXp: 0,
    badgeColor: "#718096",
    badgeLabel: "INTERN",
  },
  {
    id: "junior_analyst",
    titleKey: "story.ranks.junior_analyst", // "Analista Júnior"
    requiredTotalXp: 350, // Requires grinding across multiple tasks/challenges
    badgeColor: "#319795",
    badgeLabel: "JR. ANALYST",
  },
  {
    id: "pleno_analyst",
    titleKey: "story.ranks.pleno_analyst", // "Analista Pleno"
    requiredTotalXp: 900,
    badgeColor: "#3182ce",
    badgeLabel: "PLENO",
  },
  {
    id: "senior_analyst",
    titleKey: "story.ranks.senior_analyst", // "Analista Sênior"
    requiredTotalXp: 1800,
    badgeColor: "#805ad5",
    badgeLabel: "SR. ANALYST",
  },
]);

/**
 * Task tags affecting presentation and XP payouts.
 */
export const TASK_TAGS = Object.freeze({
  easy: {
    id: "easy",
    labelKey: "story.tags.easy",
    bgClass: "tag-easy",
    color: "#319795",
    bonusXp: 0,
    multiplier: 1.0,
  },
  medium: {
    id: "medium",
    labelKey: "story.tags.medium",
    bgClass: "tag-medium",
    color: "#d69e2e",
    bonusXp: 15,
    multiplier: 1.0,
  },
  hard: {
    id: "hard",
    labelKey: "story.tags.hard",
    bgClass: "tag-hard",
    color: "#e53e3e",
    bonusXp: 30,
    multiplier: 1.0,
  },
  special: {
    id: "special",
    labelKey: "story.tags.special",
    bgClass: "tag-special",
    color: "#d69e2e",
    bonusXp: 50,
    multiplier: 1.25,
  },
  urgent: {
    id: "urgent",
    labelKey: "story.tags.urgent",
    bgClass: "tag-urgent",
    color: "#e53e3e",
    bonusXp: 40,
    multiplier: 1.2,
  },
});

/**
 * Data-driven Story Stages and Tasks.
 * Developers can easily balance challenge count, tags, and XP payouts here.
 */
export const STORY_STAGES = Object.freeze([
  {
    id: "stage-1-intern-onboarding",
    stageNumber: 1,
    levelStartIndex: 1, // Fases 1 a 10 (Rotações)
    titleKey: "story.stages.stage1.title",
    descriptionKey: "story.stages.stage1.description",
    gameId: "pattern-recognition",
    // 10 tasks for Stage 1 before next cutscene
    targetChallengesCount: 10,
    // Task tags: "easy" + "special" gives a generous starting payout!
    tags: ["easy", "special"],
    xpRewardPerChallenge: 25, // 10 * 25 = 250 XP
    completionBonusXp: 100, // 250 + 100 = 350 XP (earns promotion to Junior Analyst right upon completion!)
    perfectBonusXp: 50, // Bônus extra ao concluir com 3 estrelas (0 erros)
    // Future-proofing placeholder for dynamic/procedural level generator
    patternConfig: {
      difficultyTier: 1,
      minSequenceLength: 3,
      maxSequenceLength: 5,
      allowedTypes: ["rotation"],
    },
    introCutsceneId: "pre-pattern-recognition",
    postStageCutsceneId: "post-pattern-recognition-1",
    nextStageId: "stage-2-corrupted-archives",
  },
  {
    id: "stage-2-corrupted-archives",
    stageNumber: 2,
    levelStartIndex: 11, // Fases 11 a 15 (Transformações Espaciais com formas split)
    titleKey: "story.stages.stage2.title",
    descriptionKey: "story.stages.stage2.description",
    gameId: "pattern-recognition",
    targetChallengesCount: 5,
    tags: ["medium", "urgent"],
    xpRewardPerChallenge: 40, // 5 * 40 = 200 XP
    completionBonusXp: 80, // 200 + 80 = 280 XP
    perfectBonusXp: 40, // Bônus extra ao concluir com 3 estrelas (0 erros)
    patternConfig: {
      difficultyTier: 2,
      minSequenceLength: 4,
      maxSequenceLength: 6,
      allowedTypes: ["transformation", "color"],
    },
    // TODO(história): as Etapas 2 e 3 reaproveitam o briefing da Etapa 1, que
    // fica repetitivo ("vamos reler a mensagem dela", "o Rardi saiu..."). Vamos
    // remover o briefing destas etapas OU criar novas histórias de clientes
    // (ex.: "pre-pattern-recognition-2") narrando os novos desafios.
    introCutsceneId: "pre-pattern-recognition",
    postStageCutsceneId: "post-pattern-recognition-2",
    nextStageId: "stage-3-advanced-system",
  },
  {
    id: "stage-3-advanced-system",
    stageNumber: 3,
    levelStartIndex: 16,
    titleKey: "story.stages.stage3.title",
    descriptionKey: "story.stages.stage3.description",
    gameId: "pattern-recognition",
    targetChallengesCount: 5,
    tags: ["hard", "special"],
    xpRewardPerChallenge: 50,
    completionBonusXp: 120,
    perfectBonusXp: 60, // Bônus extra ao concluir com 3 estrelas (0 erros)
    patternConfig: {
      difficultyTier: 3,
      minSequenceLength: 5,
      maxSequenceLength: 7,
      allowedTypes: ["rotation", "color"],
    },
    // TODO(história): mesmo caso da Etapa 2 (briefing compartilhado/repetitivo).
    introCutsceneId: "pre-pattern-recognition",
    postStageCutsceneId: "post-pattern-recognition-3",
    nextStageId: null, // End of available stages in this build
  },
]);

/**
 * Calculates the total expected XP payout for a given stage/task.
 * @param {typeof STORY_STAGES[0]} stage
 * @returns {number}
 */
export function calculateStageTotalPayout(stage) {
  if (!stage) return 0;
  const base =
    (stage.targetChallengesCount || 0) * (stage.xpRewardPerChallenge || 0);
  const bonus = stage.completionBonusXp || 0;
  return base + bonus;
}

/**
 * Resolves the rank corresponding to an amount of XP.
 * @param {number} totalXp
 * @returns {typeof RANKS[0]}
 */
export function getRankForXp(totalXp) {
  const xp = Math.max(0, Number(totalXp) || 0);
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (xp >= RANKS[i].requiredTotalXp) {
      return RANKS[i];
    }
  }
  return RANKS[0];
}

/**
 * Resolves the next rank in progression, or null if maximum rank is reached.
 * @param {string} currentRankId
 * @returns {typeof RANKS[0] | null}
 */
export function getNextRank(currentRankId) {
  const currentIndex = RANKS.findIndex((r) => r.id === currentRankId);
  if (currentIndex === -1 || currentIndex >= RANKS.length - 1) {
    return null;
  }
  return RANKS[currentIndex + 1];
}
