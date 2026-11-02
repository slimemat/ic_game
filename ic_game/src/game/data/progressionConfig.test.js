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
