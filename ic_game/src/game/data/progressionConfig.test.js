import test from "node:test";
import assert from "node:assert/strict";
import {
  RANKS,
  TASK_TAGS,
  STORY_STAGES,
  calculateStageTotalPayout,
  getRankForXp,
  getNextRank,
} from "./progressionConfig.js";

test("RANKS: initial rank is intern with 0 required XP", () => {
  assert.equal(RANKS[0].id, "intern");
  assert.equal(RANKS[0].requiredTotalXp, 0);
  assert.equal(getRankForXp(0).id, "intern");
  assert.equal(getRankForXp(100).id, "intern");
});

test("RANKS: junior_analyst requires 2000 XP (grinding requirement)", () => {
  const junior = RANKS.find((r) => r.id === "junior_analyst");
  assert.ok(junior);
  assert.equal(junior.requiredTotalXp, 2000);

  // Player at 1999 XP is still intern
  assert.equal(getRankForXp(1999).id, "intern");
  // Player at 2000 XP promotes to junior_analyst
  assert.equal(getRankForXp(2000).id, "junior_analyst");
  // Player at 4999 XP is still junior_analyst
  assert.equal(getRankForXp(4999).id, "junior_analyst");
  // Player at 5000 XP promotes to pleno_analyst
  assert.equal(getRankForXp(5000).id, "pleno_analyst");
  // Player at 9999 XP is still pleno_analyst
  assert.equal(getRankForXp(9999).id, "pleno_analyst");
  // Player at 10000 XP promotes to senior_analyst
  assert.equal(getRankForXp(10000).id, "senior_analyst");
});

test("getNextRank: correctly identifies subsequent rank or null at ceiling", () => {
  assert.equal(getNextRank("intern")?.id, "junior_analyst");
  assert.equal(getNextRank("junior_analyst")?.id, "pleno_analyst");
  assert.equal(getNextRank("pleno_analyst")?.id, "senior_analyst");
  assert.equal(getNextRank("senior_analyst"), null);
});

test("TASK_TAGS: special and urgent tags provide bonus XP payouts", () => {
  assert.ok(TASK_TAGS.special);
  assert.ok(TASK_TAGS.urgent);
  assert.ok(TASK_TAGS.special.bonusXp > 0);
  assert.ok(TASK_TAGS.urgent.bonusXp > 0);
});

test("STORY_STAGES: stage payout calculates base challenge rewards plus completion bonus", () => {
  const stage1 = STORY_STAGES[0];
  assert.ok(stage1);
  assert.equal(stage1.targetChallengesCount, 10);
  assert.equal(stage1.xpRewardPerChallenge, 15);
  assert.equal(stage1.completionBonusXp, 50);

  // 10 * 15 = 150; 150 + 50 = 200 XP
  const payout = calculateStageTotalPayout(stage1);
  assert.equal(payout, 200);

  // Verifies that completing Stage 1 keeps player as intern (200 XP < 2000 XP)
  assert.equal(getRankForXp(payout).id, "intern");
});

test("STORY_STAGES: Stage 1 + Stage 2 yields cumulative XP while keeping intern status", () => {
  const stage1Payout = calculateStageTotalPayout(STORY_STAGES[0]);
  const stage2Payout = calculateStageTotalPayout(STORY_STAGES[1]);
  const total = stage1Payout + stage2Payout;

  // 200 + 200 = 400 XP (progressing towards Junior Analyst at 2000 XP)
  assert.equal(total, 400);
  assert.equal(getRankForXp(total).id, "intern");
});

test("STORY_STAGES: Stage 3 focuses exclusively on 5 pure color challenges and points to Stage 4", () => {
  const stage3 = STORY_STAGES.find((s) => s.id === "stage-3-advanced-system");
  assert.ok(stage3);
  assert.equal(stage3.targetChallengesCount, 5);
  assert.deepEqual(stage3.patternConfig.allowedTypes, ["color"]);
  assert.equal(stage3.postStageCutsceneId, "post-pattern-recognition-3");
  assert.equal(stage3.nextStageId, "stage-4-matrix-manipulation");
});

test("STORY_STAGES: Stage 4 integrates Matrix Mirror with 3 levels and keeps player as intern", () => {
  const stage4 = STORY_STAGES.find(
    (s) => s.id === "stage-4-matrix-manipulation",
  );
  assert.ok(stage4);
  assert.equal(stage4.gameId, "matrix-mirror");
  assert.equal(stage4.targetChallengesCount, 3);

  // Cumulative payout across all 4 stages
  const totalBaseAndCompletion = STORY_STAGES.reduce(
    (acc, s) => acc + calculateStageTotalPayout(s),
    0,
  );
  // Stage 1 (200) + Stage 2 (200) + Stage 3 (275) + Stage 4 (300) = 975 XP
  assert.equal(totalBaseAndCompletion, 975);

  const totalWithPerfectStars = STORY_STAGES.reduce(
    (acc, s) => acc + calculateStageTotalPayout(s) + (s.perfectBonusXp || 0),
    0,
  );
  // 975 + 25 + 30 + 40 + 50 = 1120 XP
  assert.equal(totalWithPerfectStars, 1120);

  // Player remains as intern through the entire current storyline!
  assert.equal(getRankForXp(totalWithPerfectStars).id, "intern");
});
