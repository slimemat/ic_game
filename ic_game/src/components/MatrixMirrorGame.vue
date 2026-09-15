<script setup>
import { onBeforeUnmount, onMounted, ref, shallowRef, computed } from "vue";
import Phaser from "phaser";
import MatrixMirrorScene from "../game/scenes/MatrixMirrorScene";
import { LEVELS } from "../game/data/MatrixMirrorLevels";
import PauseModal from "./ui/PauseModal.vue";
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

const currentLevel = ref(1);
const correctBlocks = ref(0);
const totalBlocks = ref(0);

const currentLevelData = computed(() => {
  const idx = (currentLevel.value - 1) % LEVELS.length;
  return LEVELS[idx];
});

// --- PHASER INITIALIZATION ---
onMounted(() => {
  const handleMatchUpdate = (correct, total) => {
    correctBlocks.value = correct;
    totalBlocks.value = total;
  };

  const handleWin = () => {
    hasWon.value = true;
  };

  const scene = new MatrixMirrorScene(handleMatchUpdate, handleWin);
  gameScene.value = scene;

  game.value = new Phaser.Game({
    type: Phaser.AUTO,
    parent: gameRoot.value,
    backgroundColor: "#1a202c",
    scale: {
      mode: Phaser.Scale.RESIZE,
      width: "100%",
      height: "100%",
    },
    scene,
  });

  game.value.registry.set("level", currentLevel.value);
});

onBeforeUnmount(() => {
  game.value?.destroy(true);
  game.value = null;
  gameScene.value = null;
});

// --- CONTROLS ---
const resetLevel = () => {
  gameScene.value?.resetLevel();
  hasWon.value = false;
  isPaused.value = false;
  resumeGame();
};

const nextLevel = () => {
  hasWon.value = false;
  currentLevel.value++;
  game.value.registry.set("level", currentLevel.value);
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
  setTimeout(() => (showWarning.value = false), 3000);
};
</script>

<template>
  <main class="game-screen">
    <WarningCard
      :isVisible="showWarning"
      :message="warningMessage"
      :type="warningType"
    />

    <!-- Floating UI -->
    <div class="floating-ui">
      <button
        class="menu-button"
        type="button"
        @click="pauseGame"
        aria-label="Pause Menu"
      >
        &#9776;
      </button>
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
      :description="`${$t('matrix.level_title').replace('{num}', currentLevel).replace('{title}', currentLevelData.title)}`"
      @resume="resumeGame"
      @restart="resetLevel"
      @quit="$emit('back')"
    />

    <VictoryModal :isOpen="hasWon" @next="nextLevel" @menu="$emit('back')">
      <template #stats>
        <div>
          <p>{{ $t("matrix.stats_level").replace("{num}", currentLevel) }}</p>
          <p>{{ $t("matrix.stats_blocks").replace("{total}", totalBlocks) }}</p>
        </div>
      </template>
    </VictoryModal>
  </main>
</template>

<style scoped>
.game-root {
  padding: 0 !important;
}

.floating-ui {
  position: absolute;
  top: 10px;
  left: 0;
  width: 100%;
  padding: 0 15px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  pointer-events: none;
  z-index: 50;
}

.menu-button {
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid #4a5568;
  color: white;
  font-size: 1.5rem;
  padding: 4px 12px;
  border-radius: 8px;
  cursor: pointer;
  pointer-events: auto;
}

.menu-button:hover {
  background: rgba(0, 0, 0, 0.8);
}
</style>
