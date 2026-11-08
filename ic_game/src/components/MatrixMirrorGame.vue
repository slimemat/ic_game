<script setup>
import {
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  computed,
  watch,
} from "vue";
import { storeToRefs } from "pinia";
import Phaser from "phaser";
import MatrixMirrorScene from "../game/scenes/MatrixMirrorScene";
import { LEVELS } from "../game/data/MatrixMirrorLevels";
import { useStoryStore } from "../stores/story";
import { useStagePerformance } from "../composables/useStagePerformance";
import PauseModal from "./ui/PauseModal.vue";
import PauseButton from "./ui/PauseButton.vue";
import VictoryModal from "./ui/VictoryModal.vue";
import WarningCard from "./ui/WarningCard.vue";

const props = defineProps({
  storyMode: { type: Boolean, default: false },
});

const emit = defineEmits(["back", "quit"]);

const story = useStoryStore();
const {
  isPaused: isStoryPaused,
  currentPatternCount,
  targetPatternCount,
} = storeToRefs(story);

// --- VUE STATE ---
const gameRoot = ref(null);
const game = shallowRef(null);
const gameScene = shallowRef(null);

const hasWon = ref(false);
const localPaused = ref(false);
const showWarning = ref(false);
const warningMessage = ref("");
const warningType = ref("info");
let warningTimer = null;

const isPaused = computed(() =>
  props.storyMode ? isStoryPaused.value : localPaused.value,
);

const currentLevel = ref(1);
const correctBlocks = ref(0);
const totalBlocks = ref(0);

const performance = useStagePerformance({
  storyMode: () => props.storyMode,
  totalChallenges: () =>
    props.storyMode ? targetPatternCount.value : LEVELS.length,
});

const currentLevelData = computed(() => {
  const idx = Math.min(currentLevel.value - 1, LEVELS.length - 1);
  return LEVELS[idx];
});

// Sincroniza pause do Vue/StoryStore com a cena Phaser
watch(isPaused, (paused) => {
  if (paused) {
    gameScene.value?.scene.pause();
  } else {
    gameScene.value?.scene.resume();
  }
});

// --- PHASER INITIALIZATION ---
onMounted(() => {
  if (props.storyMode) {
    story.setPaused(false);
    currentLevel.value = Math.min(currentPatternCount.value + 1, LEVELS.length);
  }

  const handleMatchUpdate = (correct, total) => {
    correctBlocks.value = correct;
    totalBlocks.value = total;
  };

  const handleWin = () => {
    if (props.storyMode) {
      story.registerCorrectPattern();
    }
    hasWon.value = true;
  };

  const handleError = (msg, { isMistake = true } = {}) => {
    if (isMistake) performance.recordMistake();
    triggerWarning(msg, "error");
  };

  const scene = new MatrixMirrorScene(
    handleMatchUpdate,
    handleWin,
    handleError,
  );
  gameScene.value = scene;

  game.value = new Phaser.Game({
    type: Phaser.AUTO,
    parent: gameRoot.value,
    backgroundColor: "#87ceeb", // a Scene sobrescreve ao carregar a fase
    scale: {
      mode: Phaser.Scale.RESIZE,
      width: "100%",
      height: "100%",
    },
    scene,
  });

  syncRegistry();
});

onBeforeUnmount(() => {
  clearTimeout(warningTimer);
  game.value?.destroy(true);
  game.value = null;
  gameScene.value = null;
});

// --- CONTROLS ---
const resetLevel = () => {
  performance.resetPerformance();
  gameScene.value?.resetLevel();
  hasWon.value = false;
  resumeGame();
};

const nextLevel = () => {
  hasWon.value = false;

  // Se atingiu a meta no Modo História, conclui a tarefa e retorna ao fluxo de cutscene/dashboard
  if (props.storyMode && story.isGoalReached) {
    story.completeTask();
    return;
  }

  performance.resetPerformance();
  if (props.storyMode) {
    currentLevel.value = Math.min(currentPatternCount.value + 1, LEVELS.length);
  } else {
    if (currentLevel.value >= LEVELS.length) {
      emit("back");
      return;
    }
    currentLevel.value++;
  }

  game.value?.registry.set("level", currentLevel.value);
  gameScene.value?.resetLevel();
};

const pauseGame = () => {
  if (props.storyMode) {
    story.setPaused(true);
  } else {
    localPaused.value = true;
  }
};

const resumeGame = () => {
  if (props.storyMode) {
    story.setPaused(false);
  } else {
    localPaused.value = false;
  }
};

const triggerWarning = (msg, type = "info") => {
  warningMessage.value = msg;
  warningType.value = type;
  showWarning.value = true;
  clearTimeout(warningTimer);
  warningTimer = setTimeout(() => (showWarning.value = false), 3000);
};
</script>

<template>
  <main class="game-screen">
    <WarningCard
      :isVisible="showWarning"
      :message="warningMessage"
      :type="warningType"
    />

    <!-- Floating UI pause button -->
    <div class="floating-ui">
      <PauseButton @click="pauseGame" />
    </div>

    <!-- Phaser Visualizer -->
    <div
      ref="gameRoot"
      class="game-root"
      aria-label="Matrix Mirror Game Visuals"
    ></div>

    <!-- Modals Compartilhados -->
    <PauseModal
      :isOpen="isPaused"
      :description="`${$t('matrix.level_title')
        .replace('{num}', currentLevel)
        .replace('{title}', currentLevelData?.title || '')}`"
      @resume="resumeGame"
      @restart="resetLevel"
      @quit="$emit('quit')"
    />

    <VictoryModal
      :isOpen="hasWon"
      :stars="performance.stars.value"
      :maxStars="performance.maxStars.value"
      @next="nextLevel"
      @menu="$emit('back')"
    >
      <template #stats>
        <div>
          <p>{{ $t("matrix.stats_level", { num: currentLevel }) }}</p>
          <p>{{ $t("matrix.stats_blocks", { total: totalBlocks }) }}</p>
          <p>
            {{
              $t("global.modals.stats_mistakes", {
                count: performance.mistakes.value,
              })
            }}
          </p>
        </div>
      </template>
    </VictoryModal>
  </main>
</template>
