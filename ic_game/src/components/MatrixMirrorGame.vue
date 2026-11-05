<script setup>
import { onBeforeUnmount, onMounted, ref, shallowRef, computed } from "vue";
import Phaser from "phaser";
import MatrixMirrorScene from "../game/scenes/MatrixMirrorScene";
import { LEVELS } from "../game/data/MatrixMirrorLevels";
import { useStagePerformance } from "../composables/useStagePerformance";
import PauseModal from "./ui/PauseModal.vue";
import PauseButton from "./ui/PauseButton.vue";
import VictoryModal from "./ui/VictoryModal.vue";
import WarningCard from "./ui/WarningCard.vue";

const emit = defineEmits(["back"]);

// --- VUE STATE ---
const gameRoot = ref(null);
const game = shallowRef(null);
const gameScene = shallowRef(null);

const hasWon = ref(false);
const isPaused = ref(false);
const showWarning = ref(false);
const warningMessage = ref("");
const warningType = ref("info");
let warningTimer = null;

const currentLevel = ref(1);
const correctBlocks = ref(0);
const totalBlocks = ref(0);
const performance = useStagePerformance({
  storyMode: false,
  totalChallenges: 1,
});

const currentLevelData = computed(() => {
  const idx = (currentLevel.value - 1) % LEVELS.length;
  return LEVELS[idx];
});

/** Passa para a cena Phaser os dados que ela precisa (via registry). */
function syncRegistry() {
  game.value?.registry.set("level", currentLevel.value);
}

// --- PHASER INITIALIZATION ---
onMounted(() => {
  const handleMatchUpdate = (correct, total) => {
    correctBlocks.value = correct;
    totalBlocks.value = total;
  };

  const handleWin = () => {
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
  performance.resetPerformance();
  currentLevel.value++;
  syncRegistry();
  gameScene.value?.resetLevel();
};

const pauseGame = () => {
  isPaused.value = true;
  gameScene.value?.scene.pause();
};

const resumeGame = () => {
  isPaused.value = false;
  gameScene.value?.scene.resume();
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
      :description="
        $t('matrix.level_title', {
          num: currentLevel,
          title: $t(`${currentLevelData.i18nKey}.title`),
        })
      "
      @resume="resumeGame"
      @restart="resetLevel"
      @quit="$emit('back')"
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
