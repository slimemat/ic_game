import { defineStore } from "pinia";
import { computed, ref } from "vue";
import {
  DEFAULT_HAND_SKIN_ID,
  HAND_SKINS,
  listHandSkins,
} from "../game/data/handSkins";
import { evaluateUnlockCondition } from "../game/logic/unlockConditions";
import { useProgressionStore } from "./progression";

const CUSTOMIZATION_STORAGE_KEY = "ic_game:customization-state";
const CUSTOMIZATION_SAVE_VERSION = 1;

/**
 * Player Customization Store (Single Responsibility Principle).
 *
 * Owns cosmetic selections (currently equipped hand/arm skin) and resolves
 * passive unlocks against `useProgressionStore` without ever deducting XP.
 */
export const useCustomizationStore = defineStore("customization", () => {
  const progression = useProgressionStore();

  // ── State (persisted) ───────────────────────────────────────────────────
  const equippedHandSkinId = ref(DEFAULT_HAND_SKIN_ID);

  // ── Context & Getters ───────────────────────────────────────────────────
  const unlockContext = computed(() => ({
    totalXp: progression.totalXp,
    completedStageIds: progression.completedStageIds,
  }));

  const isSkinUnlocked = (skin) =>
    evaluateUnlockCondition(skin.unlockCondition, unlockContext.value).unlocked;

  const resolvedEquippedHandSkinId = computed(() => {
    const candidate = HAND_SKINS[equippedHandSkinId.value];
    if (candidate && isSkinUnlocked(candidate)) {
      return candidate.id;
    }
    return DEFAULT_HAND_SKIN_ID;
  });

  const handSkins = computed(() =>
    listHandSkins().map((skin) => {
      const unlock = evaluateUnlockCondition(
        skin.unlockCondition,
        unlockContext.value,
      );
      return {
        ...skin,
        unlock,
        isUnlocked: unlock.unlocked,
        isEquipped: skin.id === resolvedEquippedHandSkinId.value,
      };
    }),
  );

  // ── Persistence ────────────────────────────────────────────────────────
  function save() {
    try {
      localStorage.setItem(
        CUSTOMIZATION_STORAGE_KEY,
        JSON.stringify({
          version: CUSTOMIZATION_SAVE_VERSION,
          equippedHandSkinId: equippedHandSkinId.value,
        }),
      );
    } catch (error) {
      console.warn("[customizationStore] Could not save customization.", error);
    }
  }

  function load() {
    try {
      const raw = localStorage.getItem(CUSTOMIZATION_STORAGE_KEY);
      if (!raw) return false;

      const data = JSON.parse(raw);
      if (data?.version !== CUSTOMIZATION_SAVE_VERSION) return false;

      if (data.equippedHandSkinId && HAND_SKINS[data.equippedHandSkinId]) {
        equippedHandSkinId.value = data.equippedHandSkinId;
      } else {
        equippedHandSkinId.value = DEFAULT_HAND_SKIN_ID;
      }
      return true;
    } catch (error) {
      console.warn(
        "[customizationStore] Invalid customization save data.",
        error,
      );
      return false;
    }
  }

  // ── Actions ─────────────────────────────────────────────────────────────
  /**
   * Equips an unlocked hand skin and persists selection (never deducts XP).
   * @param {string} skinId
   * @returns {boolean}
   */
  function equipHandSkin(skinId) {
    const skin = HAND_SKINS[skinId];
    if (!skin) return false;

    const unlock = evaluateUnlockCondition(
      skin.unlockCondition,
      unlockContext.value,
    );
    if (!unlock.unlocked) return false;

    equippedHandSkinId.value = skin.id;
    save();
    return true;
  }

  function resetCustomization() {
    equippedHandSkinId.value = DEFAULT_HAND_SKIN_ID;
    try {
      localStorage.removeItem(CUSTOMIZATION_STORAGE_KEY);
    } catch (error) {
      console.warn(
        "[customizationStore] Could not reset customization.",
        error,
      );
    }
  }

  load();

  return {
    equippedHandSkinId,
    resolvedEquippedHandSkinId,
    handSkins,
    equipHandSkin,
    resetCustomization,
    save,
    load,
  };
});
