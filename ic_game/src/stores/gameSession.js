import { defineStore } from "pinia";
import { ref } from "vue";

/**
 * Central game-session store.
 *
 * Owns all state that must be shared across Vue components:
 *   - Who is playing  (playerName)
 *   - Where they are  (currentLevel)
 *   - What mode is active (activeMode)
 *
 * The store follows the Composition-API style of defineStore so it
 * stays consistent with the rest of the Vue 3 codebase.
 */
export const useGameSessionStore = defineStore("gameSession", () => {
  // ── State ───────────────────────────────────────────────────────────────

  /** Display name entered by the player. Empty until the player sets it. */
  const playerName = ref("");

  /**
   * Current level index (1-based).
   * Updated by individual mini-games when the player advances.
   */
  const currentLevel = ref(1);

  /**
   * Which high-level mode the player has selected from the Main Menu.
   *
   * Possible values:
   *   'menu'         – initial / no selection yet
   *   'story'        – Story Mode selected
   *   'level-select' – Level Select selected
   */
  const activeMode = ref("menu");

  // ── Actions ─────────────────────────────────────────────────────────────

  /** Set the player's display name. */
  function setPlayerName(name) {
    playerName.value = String(name).trim();
  }

  /**
   * Set the active navigation mode.
   * @param {'menu'|'story'|'level-select'} mode
   */
  function setActiveMode(mode) {
    activeMode.value = mode;
  }

  /** Advance to a specific level number (must be positive). */
  function setCurrentLevel(level) {
    if (level > 0) {
      currentLevel.value = level;
    }
  }

  /** Increment the current level by one. */
  function advanceLevel() {
    currentLevel.value += 1;
  }

  /** Reset session back to defaults (e.g. on logout / new game). */
  function resetSession() {
    playerName.value = "";
    currentLevel.value = 1;
    activeMode.value = "menu";
  }

  return {
    // state
    playerName,
    currentLevel,
    activeMode,
    // actions
    setPlayerName,
    setActiveMode,
    setCurrentLevel,
    advanceLevel,
    resetSession,
  };
});
