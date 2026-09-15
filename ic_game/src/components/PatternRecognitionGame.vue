<script setup>
import { onBeforeUnmount, onMounted, ref, shallowRef, computed } from "vue";
import Phaser from "phaser";
import PatternRecognitionScene from "../game/scenes/PatternRecognitionScene";
import { LEVEL_CONFIGS } from "../game/data/PatternRecognitionLevels";
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

const currentDifficulty = computed(() => {
  const idx = (currentLevel.value - 1) % LEVEL_CONFIGS.length;
  return LEVEL_CONFIGS[idx].difficulty;
});

// --- PHASER INITIALIZATION ---
onMounted(() => {
  const handleWin = () => {
    hasWon.value = true;
  };

  const handleError = (msg) => {
    triggerWarning(msg, "error");
  };

  const scene = new PatternRecognitionScene(handleWin, handleError);
  gameScene.value = scene;

  game.value = new Phaser.Game({
    type: Phaser.AUTO,
    parent: gameRoot.value,
    backgroundColor: "#1a202c",
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 600,
      height: 800,
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
const checkAnswer = () => {
  if (!isPaused.value && !hasWon.value) {
    gameScene.value?.checkAnswer();
  }
};

const resetGame = () => {
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
    <!-- Aviso DinÃ¢mico -->
    <WarningCard
      :isVisible="showWarning"
      :message="warningMessage"
      :type="warningType"
    />

    <!-- Phaser container -->
    <div
      ref="gameRoot"
      class="game-root"
      aria-label="Pattern Recognition Game"
    ></div>

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

    <!-- Modals Compartilhados -->
    <PauseModal
      :isOpen="isPaused"
      :description="`${$t('pattern.level', { num: currentLevel })} - ${$t('pattern.diff', { diff: currentDifficulty === 1 ? $t('pattern.diff_1') : $t('pattern.diff_2') })}`"
      @resume="resumeGame"
      @restart="resetGame"
      @quit="$emit('back')"
    />

    <VictoryModal :isOpen="hasWon" @next="nextLevel" @menu="$emit('back')">
      <template #stats>
        <div>
          <p>{{ $t("pattern.stats_level", { num: currentLevel }) }}</p>
          <p>
            {{ $t("pattern.stats_diff", { diff: "" }) }}
            {{
              currentDifficulty === 1
                ? $t("pattern.diff_1")
                : $t("pattern.diff_2")
            }}
          </p>
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
