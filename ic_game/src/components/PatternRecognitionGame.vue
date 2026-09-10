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
    <!-- Aviso Dinâmico -->
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

    <!-- External UI Shell -->
    <div class="ui-controls">
      <div class="level-indicator">
        Fase {{ currentLevel }}
        <span class="diff-badge">Dif: {{ currentDifficulty }}</span>
      </div>
      <div class="button-group">
        <button
          class="action-button highlight"
          type="button"
          @click="checkAnswer"
        >
          Confirmar
        </button>
        <button class="action-button warning" type="button" @click="pauseGame">
          Pausar
        </button>
        <button class="action-button" type="button" @click="resetGame">
          Reiniciar
        </button>
        <button
          class="action-button secondary"
          type="button"
          @click="$emit('back')"
        >
          Voltar
        </button>
      </div>
    </div>

    <!-- Modals Compartilhados -->
    <PauseModal
      :isOpen="isPaused"
      title="Padrão em Pausa"
      description="Pense bem na lógica da sequência."
      @resume="resumeGame"
      @restart="resetGame"
      @quit="$emit('back')"
    />

    <VictoryModal
      :isOpen="hasWon"
      title="Lógica Correta!"
      description="Você encontrou o padrão com perfeição."
      @next="nextLevel"
      @menu="$emit('back')"
    >
      <template #stats>
        <div>
          <p>Fase Concluída: {{ currentLevel }}</p>
          <p>
            Dificuldade:
            {{ currentDifficulty === 1 ? "Rotação/Cores" : "Múltipla Escolha" }}
          </p>
        </div>
      </template>
    </VictoryModal>
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
  display: flex;
  justify-content: center;
  align-items: center;
}

.ui-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: #2d3748;
  color: #e2e8f0;
  border-top: 4px solid #4a5568;
}

.level-indicator {
  font-weight: bold;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.diff-badge {
  font-size: 0.8rem;
  background-color: #4a5568;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  color: #e2e8f0;
}

.button-group {
  display: flex;
  gap: 0.5rem;
}

.action-button {
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  background-color: #4a5568;
  color: white;
  transition: all 0.2s ease;
}

.action-button:hover {
  background-color: #718096;
}

.action-button.highlight {
  background-color: #3182ce;
}
.action-button.highlight:hover {
  background-color: #2b6cb0;
}

.action-button.warning {
  background-color: #ed8936;
  color: #fffaf0;
}
.action-button.warning:hover {
  background-color: #dd6b20;
}

.action-button.secondary {
  background-color: transparent;
  border: 1px solid #4a5568;
}
.action-button.secondary:hover {
  background-color: #2d3748;
}
</style>
