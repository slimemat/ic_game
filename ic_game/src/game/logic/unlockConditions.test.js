import test from "node:test";
import assert from "node:assert/strict";
import {
  evaluateUnlockCondition,
  registerUnlockEvaluator,
} from "./unlockConditions.js";

test("evaluateUnlockCondition: free condition is always unlocked", () => {
  const result = evaluateUnlockCondition({ type: "free" }, { totalXp: 0 });
  assert.equal(result.unlocked, true);
  assert.equal(result.progressPercent, 100);
});

test("evaluateUnlockCondition: xp condition unlocks passively when totalXp >= requiredXp", () => {
  const locked = evaluateUnlockCondition(
    { type: "xp", requiredXp: 400 },
    { totalXp: 200 },
  );
  assert.equal(locked.unlocked, false);
  assert.equal(locked.current, 200);
  assert.equal(locked.target, 400);
  assert.equal(locked.remaining, 200);
  assert.equal(locked.progressPercent, 50);

  const unlocked = evaluateUnlockCondition(
    { type: "xp", requiredXp: 400 },
    { totalXp: 425 },
  );
  assert.equal(unlocked.unlocked, true);
  assert.equal(unlocked.remaining, 0);
  assert.equal(unlocked.progressPercent, 100);
});

test("evaluateUnlockCondition: unknown condition type stays safely locked", () => {
  const result = evaluateUnlockCondition(
    { type: "future_unknown_rule" },
    { totalXp: 9999 },
  );
  assert.equal(result.unlocked, false);
});

test("registerUnlockEvaluator: supports extending with new condition types (OCP)", () => {
  registerUnlockEvaluator("level_stars", (condition, context) => {
    const stars = context?.levelStars?.[condition.levelId] || 0;
    const minStars = condition.minStars || 1;
    return {
      unlocked: stars >= minStars,
      type: "level_stars",
      current: stars,
      target: minStars,
      remaining: Math.max(0, minStars - stars),
      progressPercent: Math.min(100, Math.round((stars / minStars) * 100)),
    };
  });

  const before = evaluateUnlockCondition(
    { type: "level_stars", levelId: "stage-1", minStars: 3 },
    { levelStars: { "stage-1": 2 } },
  );
  assert.equal(before.unlocked, false);
  assert.equal(before.remaining, 1);

  const after = evaluateUnlockCondition(
    { type: "level_stars", levelId: "stage-1", minStars: 3 },
    { levelStars: { "stage-1": 3 } },
  );
  assert.equal(after.unlocked, true);
});
