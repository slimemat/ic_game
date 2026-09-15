<script setup>
import { onBeforeUnmount, onMounted, ref, shallowRef } from "vue";
import Phaser from "phaser";
import PlatformerScene from "../game/scenes/PlatformerScene";
import PauseModal from "./ui/PauseModal.vue";
import VictoryModal from "./ui/VictoryModal.vue";

const emit = defineEmits(["back"]);

const gameRoot = ref(null);
const game = shallowRef(null);
const gameScene = shallowRef(null);

const score = ref(0);
const isGameOver = ref(false);
const isPaused = ref(false);

onMounted(() => {
  const handleScore = (newScore) => {
    score.value = newScore;
  };

  const handleGameOver = () => {
    isGameOver.value = true;
  };

  const scene = new PlatformerScene(handleScore, handleGameOver);
  gameScene.value = scene;

  game.value = new Phaser.Game({
    type: Phaser.AUTO,
    parent: gameRoot.value,
    width: 800,
    height: 600,
    physics: {
      default: "arcade",
      arcade: { gravity: { y: 300 }, debug: false },
    },
    scene,
  });
});

onBeforeUnmount(() => {
  game.value?.destroy(true);
  game.value = null;
  gameScene.value = null;
});

// Controls
const pauseGame = () => {
  isPaused.value = true;
  gameScene.value?.scene.pause();
};

const resumeGame = () => {
  isPaused.value = false;
  gameScene.value?.scene.resume();
};

const restartGame = () => {
  isGameOver.value = false;
  isPaused.value = false;
  score.value = 0;
  resumeGame();
  gameScene.value?.scene.restart();
};

// Touch Controls Handlers
const handleTouchStart = (action) => {
  if (gameScene.value) gameScene.value.touchState[action] = true;
};
const handleTouchEnd = (action) => {
  if (gameScene.value) gameScene.value.touchState[action] = false;
};
</script>

<template>
  <main class="game-screen">
    <div class="ui-header">
      <button class="action-button secondary" @click="$emit('back')">
        {{ $t("global.buttons.back") }}
      </button>
      <div class="score-display">{{ $t("test_game.score", { score }) }}</div>
      <button class="action-button warning" @click="pauseGame">
        {{ $t("global.buttons.pause") }}
      </button>
    </div>

    <!-- Phaser container -->
    <div ref="gameRoot" class="game-root" aria-label="Platformer Game"></div>

    <!-- Controles Mobile (Visual) -->
    <div class="mobile-controls">
      <div class="d-pad">
        <button
          class="control-btn"
          @mousedown="handleTouchStart('left')"
          @mouseup="handleTouchEnd('left')"
          @mouseleave="handleTouchEnd('left')"
          @touchstart.prevent="handleTouchStart('left')"
          @touchend.prevent="handleTouchEnd('left')"
        >
          ←
        </button>
        <button
          class="control-btn"
          @mousedown="handleTouchStart('right')"
          @mouseup="handleTouchEnd('right')"
          @mouseleave="handleTouchEnd('right')"
          @touchstart.prevent="handleTouchStart('right')"
          @touchend.prevent="handleTouchEnd('right')"
        >
          →
        </button>
      </div>
      <button
        class="control-btn jump-btn"
        @mousedown="handleTouchStart('jump')"
        @mouseup="handleTouchEnd('jump')"
        @mouseleave="handleTouchEnd('jump')"
        @touchstart.prevent="handleTouchStart('jump')"
        @touchend.prevent="handleTouchEnd('jump')"
      >
        {{ $t("test_game.jump") }}
      </button>
    </div>

    <PauseModal
      :isOpen="isPaused"
      @resume="resumeGame"
      @restart="restartGame"
      @quit="$emit('back')"
    />

    <VictoryModal
      :isOpen="isGameOver"
      @next="restartGame"
      @menu="$emit('back')"
    >
      <template #stats>
        <div>
          <p>{{ $t("test_game.score", { score }) }}</p>
        </div>
      </template>
      <template #actions>
        <button @click="restartGame" class="btn btn-primary">
          {{ $t("global.buttons.restart_level") }}
        </button>
        <button @click="$emit('back')" class="btn btn-secondary">
          {{ $t("global.buttons.quit") }}
        </button>
      </template>
    </VictoryModal>
  </main>
</template>

<style scoped>
.score-display {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--color-warning);
}

/* Touch Controls */
.mobile-controls {
  display: flex;
  justify-content: space-between;
  padding: 1.5rem;
  background: var(--bg-header);
  border-top: 2px solid var(--bg-panel-hover);
}

.d-pad {
  display: flex;
  gap: 1rem;
}

.control-btn {
  width: 70px;
  height: 70px;
  background-color: var(--bg-panel-hover);
  border: 2px solid #718096;
  border-radius: 50%;
  color: #fff;
  font-size: 2rem;
  display: flex;
  justify-content: center;
  align-items: center;
  user-select: none;
}

.control-btn:active {
  background-color: #2d3748;
  transform: scale(0.95);
}

.jump-btn {
  width: auto;
  border-radius: 12px;
  padding: 0 1.5rem;
  font-size: 1.2rem;
  font-weight: bold;
}

@media (min-width: 768px) {
  .mobile-controls {
    display: none;
  }
}
</style>
