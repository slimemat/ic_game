import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { STORY_STAGES } from "../game/data/progressionConfig";
import { calculateStarRating } from "../game/logic/performanceRating";
import { useProgressionStore } from "./progression";

/**
 * Checkpoints for the Story Mode flow.
 * App.vue uses the current checkpoint to determine which screen/modal to render.
 */
export const STORY_CHECKPOINTS = Object.freeze({
  /** Opening story cutscene (Vue – StoryMode, scene "intro") */
  INTRO_CUTSCENE: "intro-cutscene",
  /** Mission control / Ticket dashboard */
  DASHBOARD: "dashboard",
  /** Pre-task briefing cutscene (Vue – StoryMode, scene "pre-<task>") */
  TASK_INTRO_CUTSCENE: "task-intro-cutscene",
  /** Gameplay canvas (Phaser) */
  MINIGAME: "minigame",
  /** Post-stage narrative cutscene */
  POST_STAGE_CUTSCENE: "post-stage-cutscene",
  /** Promotion celebration screen/modal */
  PROMOTION: "promotion",
});

const STORAGE_KEY = "ic_game:story-progress";
const SAVE_VERSION = 2;
const VALID_CHECKPOINTS = Object.values(STORY_CHECKPOINTS);

/**
 * Story Mode Store.
 *
 * Responsibilities:
 *   - Orchestrate story narrative checkpoints and active stages
 *   - Manage active task and granular in-game challenge count
 *   - Global pause state (Vue ⇄ Phaser bridge)
 *   - Coordinate with useProgressionStore for XP gains and promotions
 *   - LocalStorage persistence with backward-compatible migrations
 */
export const useStoryStore = defineStore("story", () => {
  const progression = useProgressionStore();

  // ── State (persisted) ───────────────────────────────────────────────────

  /** Current story checkpoint. See STORY_CHECKPOINTS. */
  const checkpoint = ref(STORY_CHECKPOINTS.INTRO_CUTSCENE);

  /** Currently active stage ID from STORY_STAGES. */
  const currentStageId = ref(STORY_STAGES[0].id);

  /** Active cutscene sceneId to render in StoryMode.vue. */
  const activeCutsceneId = ref("intro");

  /** Id of active minigame/task (e.g. "pattern-recognition") or null. */
  const activeTaskId = ref(null);

  /** Solved patterns/challenges in the current run. */
  const currentPatternCount = ref(0);

  /** Number of wrong attempts in the current stage run. */
  const currentStageMistakes = ref(0);

  /** Stars (1-3) obtained in the most recently completed stage. */
  const lastStageStars = ref(3);

  /** Player choices made in story cutscenes (e.g. { stage2TimeOfDay: 'day' | 'night' }). */
  const storyDecisions = ref({});

  /** Completed task/game IDs. */
  const completedTasks = ref([]);

  // ── State (non-persisted) ───────────────────────────────────────────────

  /** Global pause: PauseModal (Vue) and Scene (Phaser) react to this value. */
  const isPaused = ref(false);

  // ── Getters ─────────────────────────────────────────────────────────────

  /** Resolved active stage configuration. */
  const currentStage = computed(() => {
    return (
      STORY_STAGES.find((s) => s.id === currentStageId.value) || STORY_STAGES[0]
    );
  });

  /** Data-driven challenge target for the active stage (replaces hardcoded 10). */
  const targetPatternCount = computed(() => {
    return currentStage.value.targetChallengesCount || 3;
  });

  /** Whether the current run target has been reached. */
  const isGoalReached = computed(() => {
    return currentPatternCount.value >= targetPatternCount.value;
  });

  /** Star rating evaluation for the active stage run. */
  const currentStageRating = computed(() => {
    return calculateStarRating({ mistakes: currentStageMistakes.value });
  });

  /** Bonus XP awarded when completing the current stage with 3 stars (0 mistakes). */
  const currentStagePerfectBonusXp = computed(() => {
    if (!currentStageRating.value.isPerfect) return 0;
    return currentStage.value.perfectBonusXp || 50;
  });

  // ── Persistence ────────────────────────────────────────────────────────

  /** Persists story progress to localStorage. */
  function save() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          version: SAVE_VERSION,
          checkpoint: checkpoint.value,
          currentStageId: currentStageId.value,
          activeCutsceneId: activeCutsceneId.value,
          activeTaskId: activeTaskId.value,
          currentPatternCount: currentPatternCount.value,
          currentStageMistakes: currentStageMistakes.value,
          lastStageStars: lastStageStars.value,
          storyDecisions: storyDecisions.value,
          completedTasks: completedTasks.value,
        }),
      );
    } catch (error) {
      console.warn("[storyStore] Could not save progress.", error);
    }
  }

  /**
   * Loads saved progress with backward compatibility.
   * @returns {boolean}
   */
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;

      const data = JSON.parse(raw);
      if (!data) return false;

      // Migrate version 1 or validate version 2
      if (data.version === 1) {
        currentStageId.value = STORY_STAGES[0].id;
        activeCutsceneId.value = "intro";
        checkpoint.value = VALID_CHECKPOINTS.includes(data.checkpoint)
          ? data.checkpoint
          : STORY_CHECKPOINTS.INTRO_CUTSCENE;
      } else if (data.version === SAVE_VERSION) {
        checkpoint.value = VALID_CHECKPOINTS.includes(data.checkpoint)
          ? data.checkpoint
          : STORY_CHECKPOINTS.INTRO_CUTSCENE;
        currentStageId.value = STORY_STAGES.some(
          (s) => s.id === data.currentStageId,
        )
          ? data.currentStageId
          : STORY_STAGES[0].id;
        activeCutsceneId.value = data.activeCutsceneId || "intro";
      } else {
        return false;
      }

      activeTaskId.value = data.activeTaskId ?? null;
      currentPatternCount.value = Math.min(
        Math.max(Number(data.currentPatternCount) || 0, 0),
        targetPatternCount.value,
      );
      currentStageMistakes.value = Math.max(
        0,
        Math.trunc(Number(data.currentStageMistakes) || 0),
      );
      lastStageStars.value = [1, 2, 3].includes(data.lastStageStars)
        ? data.lastStageStars
        : 3;
      storyDecisions.value =
        data.storyDecisions && typeof data.storyDecisions === "object"
          ? data.storyDecisions
          : {};
      completedTasks.value = Array.isArray(data.completedTasks)
        ? data.completedTasks
        : [];
      return true;
    } catch (error) {
      console.warn("[storyStore] Invalid save data, ignoring.", error);
      return false;
    }
  }

  // ── Actions: Flow & Stage Transitions ───────────────────────────────────

  /**
   * Advance to a specific checkpoint and persist.
   * @param {string} step
   */
  function advanceCheckpoint(step) {
    if (!VALID_CHECKPOINTS.includes(step)) {
      console.warn(`[storyStore] Invalid checkpoint: "${step}".`);
      return;
    }
    checkpoint.value = step;
    save();
  }

  /**
   * Starts a task from the Dashboard.
   * Resets pattern count and loads task briefing cutscene if available.
   * @param {string} taskId
   * @param {{ withBriefing?: boolean }} [options]
   */
  function startTask(taskId, { withBriefing = true } = {}) {
    activeTaskId.value = taskId;
    currentPatternCount.value = 0;
    currentStageMistakes.value = 0;

    if (withBriefing && currentStage.value.introCutsceneId) {
      activeCutsceneId.value = currentStage.value.introCutsceneId;
      checkpoint.value = STORY_CHECKPOINTS.TASK_INTRO_CUTSCENE;
    } else {
      checkpoint.value = STORY_CHECKPOINTS.MINIGAME;
    }
    save();
  }

  /**
   * Registers an incorrect attempt during the active stage run.
   */
  function registerMistake() {
    currentStageMistakes.value += 1;
    save();
  }

  /**
   * Registers a correctly solved pattern during gameplay.
   * Awards XP per challenge and checks if stage target is met.
   * @returns {boolean} true if stage target has been met.
   */
  function registerCorrectPattern() {
    currentPatternCount.value = Math.min(
      currentPatternCount.value + 1,
      targetPatternCount.value,
    );

    // Award XP per challenge
    progression.addXp(
      currentStage.value.xpRewardPerChallenge || 35,
      "challenge_solved",
    );

    save();
    return isGoalReached.value;
  }

  /**
   * Concludes the current stage run:
   * - Awards completion bonus XP
   * - Marks stage completed
   * - Transitions to post-stage cutscene, promotion modal, or next stage
   */
  function completeTask() {
    if (
      activeTaskId.value &&
      !completedTasks.value.includes(activeTaskId.value)
    ) {
      completedTasks.value.push(activeTaskId.value);
    }

    // Award stage completion bonus XP
    let promoResult = progression.addXp(
      currentStage.value.completionBonusXp || 60,
      "stage_completion_bonus",
    );

    // Award extra perfect-run bonus XP if completed with 3 stars (0 mistakes)
    if (currentStageRating.value.isPerfect) {
      const perfectPromo = progression.addXp(
        currentStagePerfectBonusXp.value,
        "perfect_stage_bonus",
      );
      if (perfectPromo.promoted) {
        promoResult = perfectPromo;
      }
    }

    lastStageStars.value = currentStageRating.value.stars;

    progression.markStageCompleted(currentStageId.value);

    activeTaskId.value = null;
    currentPatternCount.value = 0;
    currentStageMistakes.value = 0;

    // Check for post-stage cutscene
    if (currentStage.value.postStageCutsceneId) {
      activeCutsceneId.value = currentStage.value.postStageCutsceneId;
      checkpoint.value = STORY_CHECKPOINTS.POST_STAGE_CUTSCENE;
    } else if (promoResult.promoted || progression.pendingPromotion) {
      checkpoint.value = STORY_CHECKPOINTS.PROMOTION;
    } else {
      advanceToNextStage();
      checkpoint.value = STORY_CHECKPOINTS.DASHBOARD;
    }

    save();
  }

  /**
   * Called when post-stage cutscene concludes.
   */
  function finishPostStageCutscene() {
    if (progression.pendingPromotion) {
      checkpoint.value = STORY_CHECKPOINTS.PROMOTION;
    } else {
      advanceToNextStage();
      checkpoint.value = STORY_CHECKPOINTS.DASHBOARD;
    }
    save();
  }

  /**
   * Called when promotion celebration screen is dismissed.
   */
  function finishPromotion() {
    progression.consumePendingPromotion();
    advanceToNextStage();
    checkpoint.value = STORY_CHECKPOINTS.DASHBOARD;
    save();
  }

  /**
   * Advances currentStageId to the next stage if defined in config.
   */
  function advanceToNextStage() {
    if (currentStage.value.nextStageId) {
      currentStageId.value = currentStage.value.nextStageId;
    }
  }

  /**
   * Sets manual pattern progress.
   * @param {number} count
   */
  function setPatternProgress(count) {
    currentPatternCount.value = Math.min(
      Math.max(Math.trunc(count) || 0, 0),
      targetPatternCount.value,
    );
    if (currentPatternCount.value === 0) {
      currentStageMistakes.value = 0;
    }
    save();
  }

  // ── Actions: Pause ──────────────────────────────────────────────────────

  function setPaused(paused) {
    isPaused.value = Boolean(paused);
  }

  function recordDecision(key, value) {
    storyDecisions.value[key] = value;
    save();
  }

  function togglePause() {
    isPaused.value = !isPaused.value;
  }

  // ── Actions: Reset ──────────────────────────────────────────────────────

  /**
   * Fully resets story and career progression (new game).
   */
  function resetProgress() {
    checkpoint.value = STORY_CHECKPOINTS.INTRO_CUTSCENE;
    currentStageId.value = STORY_STAGES[0].id;
    activeCutsceneId.value = "intro";
    activeTaskId.value = null;
    currentPatternCount.value = 0;
    currentStageMistakes.value = 0;
    lastStageStars.value = 3;
    storyDecisions.value = {};
    completedTasks.value = [];
    isPaused.value = false;

    progression.resetProgression();

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn("[storyStore] Could not clear save data.", error);
    }
  }

  // Restore saved state
  load();

  return {
    // state
    checkpoint,
    currentStageId,
    activeCutsceneId,
    activeTaskId,
    currentPatternCount,
    currentStageMistakes,
    lastStageStars,
    storyDecisions,
    completedTasks,
    isPaused,
    // getters
    currentStage,
    targetPatternCount,
    isGoalReached,
    currentStageRating,
    currentStagePerfectBonusXp,
    // actions
    advanceCheckpoint,
    startTask,
    registerMistake,
    registerCorrectPattern,
    completeTask,
    finishPostStageCutscene,
    finishPromotion,
    recordDecision,
    setPatternProgress,
    setPaused,
    togglePause,
    save,
    load,
    resetProgress,
  };
});
