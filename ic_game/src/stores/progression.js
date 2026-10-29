import { defineStore } from "pinia";
import { computed, ref } from "vue";
import {
  RANKS,
  getRankForXp,
  getNextRank,
} from "../game/data/progressionConfig";

const PROGRESSION_STORAGE_KEY = "ic_game:progression-state";
const PROGRESSION_SAVE_VERSION = 1;

/**
 * Progression and Career Store.
 *
 * Responsibilities (Single Responsibility Principle):
 *   - Total player XP accumulation
 *   - Rank and Career tier resolution
 *   - Promotion event triggers and celebration states
 *   - Completed stage records
 *   - Client-side persistence (ready for future backend sync)
 */
export const useProgressionStore = defineStore("progression", () => {
  // ── State (persisted) ───────────────────────────────────────────────────
  const totalXp = ref(0);
  const completedStageIds = ref([]);

  // ── State (session / transient) ─────────────────────────────────────────
  /** Holds promotion celebration details when rank advances: { fromRank, toRank } | null */
  const pendingPromotion = ref(null);

  /** Most recent XP gain for UI toast/popups: { amount: number, reason: string } | null */
  const recentXpGain = ref(null);

  // ── Getters ─────────────────────────────────────────────────────────────
  const currentRank = computed(() => getRankForXp(totalXp.value));

  const nextRank = computed(() => getNextRank(currentRank.value.id));

  const isMaxRank = computed(() => nextRank.value === null);

  const xpToNextRank = computed(() => {
    if (!nextRank.value) return 0;
    return Math.max(0, nextRank.value.requiredTotalXp - totalXp.value);
  });

  const rankProgressPercent = computed(() => {
    if (!nextRank.value) return 100;
    const currentBase = currentRank.value.requiredTotalXp;
    const target = nextRank.value.requiredTotalXp;
    const gainedInTier = totalXp.value - currentBase;
    const tierSpan = target - currentBase;
    if (tierSpan <= 0) return 100;
    return Math.min(
      100,
      Math.max(0, Math.round((gainedInTier / tierSpan) * 100)),
    );
  });

  // ── Persistence ────────────────────────────────────────────────────────
  function save() {
    try {
      localStorage.setItem(
        PROGRESSION_STORAGE_KEY,
        JSON.stringify({
          version: PROGRESSION_SAVE_VERSION,
          totalXp: totalXp.value,
          completedStageIds: completedStageIds.value,
        }),
      );
    } catch (error) {
      console.warn("[progressionStore] Could not save progression.", error);
    }
  }

  function load() {
    try {
      const raw = localStorage.getItem(PROGRESSION_STORAGE_KEY);
      if (!raw) return false;

      const data = JSON.parse(raw);
      if (data?.version !== PROGRESSION_SAVE_VERSION) return false;

      totalXp.value = Math.max(0, Number(data.totalXp) || 0);
      completedStageIds.value = Array.isArray(data.completedStageIds)
        ? data.completedStageIds
        : [];
      return true;
    } catch (error) {
      console.warn("[progressionStore] Invalid progression save data.", error);
      return false;
    }
  }

  // ── Actions ─────────────────────────────────────────────────────────────

  /**
   * Awards XP to the player, updating rank and flagging promotions if earned.
   * @param {number} amount
   * @param {string} [reason]
   * @returns {{ oldRank: any, newRank: any, promoted: boolean }}
   */
  function addXp(amount, reason = "") {
    const validAmount = Math.max(0, Math.trunc(amount) || 0);
    if (validAmount === 0) {
      return {
        oldRank: currentRank.value,
        newRank: currentRank.value,
        promoted: false,
      };
    }

    const oldRank = currentRank.value;
    totalXp.value += validAmount;

    recentXpGain.value = {
      amount: validAmount,
      reason,
      timestamp: Date.now(),
    };

    const newRank = getRankForXp(totalXp.value);
    const promoted =
      newRank.id !== oldRank.id &&
      newRank.requiredTotalXp > oldRank.requiredTotalXp;

    if (promoted) {
      pendingPromotion.value = {
        fromRank: oldRank,
        toRank: newRank,
      };
    }

    save();
    return { oldRank, newRank, promoted };
  }

  /**
   * Consumes and clears the pending promotion modal trigger.
   */
  function consumePendingPromotion() {
    const promo = pendingPromotion.value;
    pendingPromotion.value = null;
    return promo;
  }

  /**
   * Records a stage as completed.
   * @param {string} stageId
   */
  function markStageCompleted(stageId) {
    if (stageId && !completedStageIds.value.includes(stageId)) {
      completedStageIds.value.push(stageId);
      save();
    }
  }

  /**
   * Resets career progression back to intern with 0 XP.
   */
  function resetProgression() {
    totalXp.value = 0;
    completedStageIds.value = [];
    pendingPromotion.value = null;
    recentXpGain.value = null;
    try {
      localStorage.removeItem(PROGRESSION_STORAGE_KEY);
    } catch (error) {
      console.warn("[progressionStore] Could not reset progression.", error);
    }
  }

  // Restore saved state on store creation
  load();

  return {
    // state
    totalXp,
    completedStageIds,
    pendingPromotion,
    recentXpGain,
    // getters
    currentRank,
    nextRank,
    isMaxRank,
    xpToNextRank,
    rankProgressPercent,
    // actions
    addXp,
    consumePendingPromotion,
    markStageCompleted,
    save,
    load,
    resetProgression,
  };
});
