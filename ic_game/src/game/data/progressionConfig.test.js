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

test("RANKS: junior_analyst requires 350 XP (grinding requirement)", () => {
  const junior = RANKS.find((r) => r.id === "junior_analyst");
  assert.ok(junior);
  assert.equal(junior.requiredTotalXp, 350);

  // Player at 349 XP is still intern
  assert.equal(getRankForXp(349).id, "intern");
  // Player at 350 XP promotes to junior_analyst
  assert.equal(getRankForXp(350).id, "junior_analyst");
  // Player at 899 XP is still junior_analyst
  assert.equal(getRankForXp(899).id, "junior_analyst");
  // Player at 900 XP promotes to pleno_analyst
  assert.equal(getRankForXp(900).id, "pleno_analyst");
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
  assert.equal(stage1.xpRewardPerChallenge, 25);
  assert.equal(stage1.completionBonusXp, 100);

  // 10 * 25 = 250; 250 + 100 = 350 XP
  const payout = calculateStageTotalPayout(stage1);
  assert.equal(payout, 350);

  // Verifies that completing all 10 Stage 1 tasks awards Junior Analyst promotion
  assert.equal(getRankForXp(payout).id, "junior_analyst");
});

test("STORY_STAGES: Stage 1 + Stage 2 yields enough XP for advancement towards Pleno", () => {
  const stage1Payout = calculateStageTotalPayout(STORY_STAGES[0]);
  const stage2Payout = calculateStageTotalPayout(STORY_STAGES[1]);
  const total = stage1Payout + stage2Payout;

  // 350 + 240 = 590 XP (advancing towards Pleno Analyst at 900 XP)
  assert.equal(total, 590);
  assert.equal(getRankForXp(total).id, "junior_analyst");
});
