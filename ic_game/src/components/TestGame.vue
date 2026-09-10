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
        ← Voltar
      </button>
      <div class="score-display">Pontos: {{ score }}</div>
      <button class="action-button warning" @click="pauseGame">Pausar</button>
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
        PULAR
      </button>
    </div>

    <PauseModal
      :isOpen="isPaused"
      title="Jogo Pausado"
      description="O tempo está parado."
      @resume="resumeGame"
      @restart="restartGame"
      @quit="$emit('back')"
    />

    <VictoryModal
      :isOpen="isGameOver"
      title="Fim de Jogo!"
      description="Você foi atingido por uma bomba."
      @next="restartGame"
      @menu="$emit('back')"
    >
      <template #stats>
        <div>
          <p>Pontuação Final: {{ score }}</p>
        </div>
      </template>
      <template #actions>
        <button @click="restartGame" class="btn btn-primary">
          Tentar Novamente
        </button>
        <button @click="$emit('back')" class="btn btn-secondary">Sair</button>
      </template>
    </VictoryModal>
  </main>
</template>

<style scoped>
.game-screen {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  background-color: #2d3748;
  font-family: sans-serif;
}

.ui-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: #1a202c;
  color: #e2e8f0;
}

.score-display {
  font-size: 1.5rem;
  font-weight: bold;
  color: #f6e05e;
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
.action-button.secondary {
  background-color: transparent;
  border: 1px solid #4a5568;
}
.action-button.warning {
  background-color: #ed8936;
}

.game-root {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  background-color: #000;
}

/* Touch Controls */
.mobile-controls {
  display: flex;
  justify-content: space-between;
  padding: 1.5rem;
  background: #1a202c;
  border-top: 2px solid #4a5568;
}

.d-pad {
  display: flex;
  gap: 1rem;
}

.control-btn {
  width: 70px;
  height: 70px;
  background-color: #4a5568;
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
