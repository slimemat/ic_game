<script setup>
import { onBeforeUnmount, onMounted, ref, shallowRef, computed } from "vue";
import Phaser from "phaser";
import CharadeGameScene from "../game/scenes/CharadeScene";
import { CHARADES_LEVELS } from "../game/data/CharadeLevels";
import PauseModal from "./ui/PauseModal.vue";
import VictoryModal from "./ui/VictoryModal.vue";
import WarningCard from "./ui/WarningCard.vue";
import AudioManager from "../game/managers/AudioManager";

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

const currentLevel = ref(0);

const currentCharade = computed(() => CHARADES_LEVELS[currentLevel.value]);

// --- PHASER INITIALIZATION ---
onMounted(() => {
  const scene = new CharadeGameScene((sceneInstance) => {
    sceneInstance.loadLevel(currentCharade.value);
  }, checkAnswer);
  gameScene.value = scene;

  game.value = new Phaser.Game({
    type: Phaser.AUTO,
    parent: gameRoot.value,
    backgroundColor: "#f0f4f8",
    scale: {
      mode: Phaser.Scale.RESIZE,
      width: "100%",
      height: "100%",
    },
    scene,
  });
});

onBeforeUnmount(() => {
  game.value?.destroy(true);
  game.value = null;
  gameScene.value = null;
});

// --- CONTROLS ---
const checkAnswer = (suspect) => {
  if (suspect === currentCharade.value.answer) {
    AudioManager.play("win");
    hasWon.value = true;
  } else {
    AudioManager.play("error");
    triggerWarning(
      "Parece que esse não é o culpado. Revise as pistas!",
      "error",
    );
  }
};

const nextLevel = () => {
  hasWon.value = false;
  if (currentLevel.value < CHARADES_LEVELS.length - 1) {
    currentLevel.value++;
    if (gameScene.value) {
      gameScene.value.loadLevel(currentCharade.value);
    }
  } else {
    emit("back");
  }
};

const pauseGame = () => {
  isPaused.value = true;
  gameScene.value?.scene.pause();
};

const resumeGame = () => {
  isPaused.value = false;
  gameScene.value?.scene.resume();
};

const restartGame = () => {
  hasWon.value = false;
  isPaused.value = false;
  resumeGame();
  if (gameScene.value) {
    gameScene.value.loadLevel(currentCharade.value);
  }
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
    <!-- Aviso Dinamico (Toast) -->
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
    <div ref="gameRoot" class="game-root" aria-label="Charade Game"></div>

    <!-- Modals -->
    <PauseModal
      :isOpen="isPaused"
      :description="`${$t('charade.level_title', { num: currentLevel + 1, title: currentCharade.title })}`"
      @resume="resumeGame"
      @restart="restartGame"
      @quit="$emit('back')"
    />

    <VictoryModal :isOpen="hasWon" @next="nextLevel" @menu="$emit('back')">
      <template #stats>
        <div>
          <p>{{ $t("charade.stats_level", { num: currentLevel + 1 }) }}</p>
        </div>
      </template>
      <template #actions>
        <button @click="nextLevel" class="btn btn-primary">
          {{
            currentLevel < CHARADES_LEVELS.length - 1
              ? $t("global.buttons.next_level")
              : $t("global.buttons.back_to_menu")
          }}
        </button>
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
