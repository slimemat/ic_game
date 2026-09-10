<script setup>
import { onBeforeUnmount, onMounted, ref, shallowRef } from "vue";
import Phaser from "phaser";
import LinePuzzleScene from "../game/scenes/LinePuzzleScene";
import PauseModal from "./ui/PauseModal.vue";
import VictoryModal from "./ui/VictoryModal.vue";
import WarningCard from "./ui/WarningCard.vue";

const emit = defineEmits(["back"]);

// Vue State
const gameRoot = ref(null);
const game = shallowRef(null);
const gameScene = shallowRef(null);

const hasWon = ref(false);
const isPaused = ref(false);
const showWarning = ref(false);
const warningMessage = ref("");

const currentLevel = ref(1);

// --- PHASER INITIALIZATION ---
onMounted(() => {
  const handleWin = () => {
    hasWon.value = true;
  };

  const handleError = (msg) => {
    triggerWarning(msg);
  };

  const scene = new LinePuzzleScene(handleWin, handleError);
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
  gameScene.value?.generateLevel(); // force fresh generation
};

const pauseGame = () => {
  isPaused.value = true;
  gameScene.value?.scene.pause();
};

const resumeGame = () => {
  isPaused.value = false;
  gameScene.value?.scene.resume();
};

const triggerWarning = (msg) => {
  warningMessage.value = msg;
  showWarning.value = true;
  setTimeout(() => (showWarning.value = false), 3000);
};
</script>

<template>
  <main class="game-screen">
    <WarningCard
      :isVisible="showWarning"
      :message="warningMessage"
      type="error"
    />

    <div class="level-header">
      <h2>Conexão Segura: Fase {{ currentLevel }}</h2>
      <p class="description">
        Conecte todos os pontos azuis sem cruzar nenhuma linha.
      </p>
    </div>

    <!-- Phaser container -->
    <div ref="gameRoot" class="game-root" aria-label="Line Puzzle Game"></div>

    <div class="controls-area">
      <button class="action-button" @click="resetLevel">Limpar Linhas</button>
      <button class="action-button warning" @click="pauseGame">Pausar</button>
      <button class="action-button secondary" @click="$emit('back')">
        Voltar ao Menu
      </button>
    </div>

    <!-- Modals Compartilhados -->
    <PauseModal
      :isOpen="isPaused"
      title="Jogo Pausado"
      description="Calcule bem o próximo nó."
      @resume="resumeGame"
      @restart="resetLevel"
      @quit="$emit('back')"
    />

    <VictoryModal
      :isOpen="hasWon"
      title="Conexão Estabelecida!"
      description="Você conectou todos os pontos com sucesso!"
      @next="nextLevel"
      @menu="$emit('back')"
    >
      <template #stats>
        <div>
          <p>Fase Concluída: {{ currentLevel }}</p>
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
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
}

.level-header {
  padding: 1.5rem;
  background-color: #2d3748;
  color: #e2e8f0;
  text-align: center;
  border-bottom: 4px solid #4a5568;
}

.level-header h2 {
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
  color: #63b3ed;
}

.description {
  margin: 0;
  font-size: 1.1rem;
  color: #a0aec0;
}

.game-root {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.controls-area {
  padding: 1rem;
  background-color: #2d3748;
  display: flex;
  justify-content: center;
  gap: 1rem;
  border-top: 4px solid #4a5568;
}

.action-button {
  padding: 0.8rem 1.5rem;
  font-size: 1.1rem;
  font-weight: bold;
  color: #1a202c;
  background-color: #e2e8f0;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-button:hover {
  background-color: #cbd5e0;
  transform: translateY(-2px);
}

.action-button.secondary {
  background-color: #4a5568;
  color: #e2e8f0;
}
.action-button.secondary:hover {
  background-color: #2d3748;
}

.action-button.warning {
  background-color: #ed8936;
  color: #fffaf0;
}
.action-button.warning:hover {
  background-color: #dd6b20;
}
</style>
