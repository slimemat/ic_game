<script setup>
import { onBeforeUnmount, onMounted, ref, shallowRef } from "vue";
import Phaser from "phaser";

const emit = defineEmits(["back"]);

// Vue State
const gameRoot = ref(null);
const game = shallowRef(null);
const gameScene = shallowRef(null);
const hasWon = ref(false);
const currentLevel = ref(1);

// --- PHASER SCENE ---
class GenericGameScene extends Phaser.Scene {
  constructor(onWinCallback) {
    super("GenericGameScene");
    this.onWinCallback = onWinCallback;
  }

  preload() {
    // Load assets here
  }

  create() {
    this.generateLevel();
  }

  generateLevel() {
    // TODO: Logic for setting up the game level
  }

  resetLevel() {
    // TODO: Reset the current level state
  }
}

// --- VUE SHELL MOUNTING ---
onMounted(() => {
  const handleWin = () => {
    hasWon.value = true;
  };

  const scene = new GenericGameScene(handleWin);
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

// Shell Actions
const resetGame = () => {
  gameScene.value?.resetLevel();
};

const nextLevel = () => {
  hasWon.value = false;
  currentLevel.value++;
  game.value.registry.set("level", currentLevel.value);
  gameScene.value?.generateLevel();
};
</script>

<template>
  <main class="game-screen">
    <!-- Phaser container -->
    <div ref="gameRoot" class="game-root" aria-label="Generic Game"></div>

    <!-- External UI Shell -->
    <div class="ui-controls">
      <div class="level-indicator">Level {{ currentLevel }}</div>
      <div class="button-group">
        <button class="action-button" type="button" @click="resetGame">
          Restart
        </button>
        <button
          class="action-button secondary"
          type="button"
          @click="$emit('back')"
        >
          Back
        </button>
      </div>
    </div>

    <!-- Win Overlay -->
    <div v-if="hasWon" class="win-overlay">
      <h2>Level Complete!</h2>
      <button class="action-button primary" @click="nextLevel">
        Next Level
      </button>
    </div>
  </main>
</template>

<style scoped>
.game-screen {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  background-color: #1a202c;
  font-family: sans-serif;
}

.game-root {
  flex: 1;
  min-height: 0;
}

.ui-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: #2d3748;
  color: #e2e8f0;
}

.level-indicator {
  font-weight: bold;
  font-size: 1.2rem;
}

.button-group {
  display: flex;
  gap: 0.5rem;
}

.action-button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  background-color: #4a5568;
  color: white;
}

.action-button.primary {
  background-color: #48bb78;
  font-size: 1.2rem;
  padding: 1rem 2rem;
}

.action-button.secondary {
  background-color: transparent;
  border: 1px solid #4a5568;
}

.win-overlay {
  position: absolute;
  inset: 0;
  background-color: rgba(26, 32, 44, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  z-index: 10;
}

.win-overlay h2 {
  font-size: 2.5rem;
  margin-bottom: 2rem;
  color: #48bb78;
}
</style>
