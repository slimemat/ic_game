/**
 * Extensible Unlock Condition Engine (Open/Closed Principle).
 *
 * New condition types (e.g. `{ type: "level_stars", levelId, minStars }`)
 * can be registered via `registerUnlockEvaluator` without modifying core logic
 * or UI components.
 */

const UNLOCK_EVALUATORS = new Map();

function buildResult({ unlocked, type, current, target }) {
  const safeTarget = Math.max(0, Number(target) || 0);
  const safeCurrent = Math.max(0, Number(current) || 0);
  const remaining = Math.max(0, safeTarget - safeCurrent);
  const progressPercent =
    safeTarget <= 0
      ? unlocked
        ? 100
        : 0
      : Math.min(100, Math.round((safeCurrent / safeTarget) * 100));

  return {
    unlocked: Boolean(unlocked),
    type,
    current: safeCurrent,
    target: safeTarget,
    remaining,
    progressPercent,
  };
}

/**
 * Registers or overrides an unlock condition evaluator by type.
 * @param {string} type
 * @param {(condition: Record<string, unknown>, context: Record<string, unknown>) => ReturnType<typeof buildResult>} evaluatorFn
 */
export function registerUnlockEvaluator(type, evaluatorFn) {
  if (!type || typeof evaluatorFn !== "function") {
    throw new TypeError(
      "registerUnlockEvaluator requires a valid type and function.",
    );
  }
  UNLOCK_EVALUATORS.set(type, evaluatorFn);
}

// Built-in: always unlocked
registerUnlockEvaluator("free", () =>
  buildResult({ unlocked: true, type: "free", current: 1, target: 1 }),
);

// Built-in: passive cumulative XP milestone (never deducts XP)
registerUnlockEvaluator("xp", (condition, context) => {
  const requiredXp = Math.max(0, Number(condition?.requiredXp) || 0);
  const totalXp = Math.max(0, Number(context?.totalXp) || 0);
  return buildResult({
    unlocked: totalXp >= requiredXp,
    type: "xp",
    current: totalXp,
    target: requiredXp,
  });
});

/**
 * Evaluates whether an item's unlock condition is met in the given player context.
 * @param {{ type?: string } | null | undefined} condition
 * @param {{ totalXp?: number, completedStageIds?: string[], levelStars?: Record<string, number> }} [context={}]
 */
export function evaluateUnlockCondition(condition, context = {}) {
  const type = condition?.type || "free";
  const evaluator = UNLOCK_EVALUATORS.get(type);
  if (!evaluator) {
    return buildResult({ unlocked: false, type, current: 0, target: 1 });
  }
  return evaluator(condition, context);
}
