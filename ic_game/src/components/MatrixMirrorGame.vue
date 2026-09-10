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
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 800,
      height: 500,
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
  setTimeout(() => showWarning.value = false, 3000);
};
</script>

<template>
  <main class="game-screen">
    <WarningCard 
      :isVisible="showWarning" 
      :message="warningMessage" 
      :type="warningType" 
    />

    <div class="level-header">
      <h2>Fase {{ currentLevel }}: {{ currentLevelData.title }}</h2>
      <p class="description">{{ currentLevelData.description }}</p>
    </div>

    <div class="status-bar" :class="{ 'all-correct': correctBlocks === totalBlocks && totalBlocks > 0 }">
      <div class="progress-text">
        Sincronização: <strong>{{ correctBlocks }}</strong> / <strong>{{ totalBlocks }}</strong>
      </div>
      <div class="progress-bar-container">
        <div class="progress-bar-fill" :style="{ width: (totalBlocks > 0 ? (correctBlocks / totalBlocks) * 100 : 0) + '%' }"></div>
      </div>
    </div>

    <!-- Phaser Visualizer -->
    <div ref="gameRoot" class="game-root" aria-label="Matrix Mirror Game Visuals"></div>

    <div class="controls-area">
      <button class="action-button" @click="resetLevel">Limpar Matriz</button>
      <button class="action-button warning" @click="pauseGame">Pausar</button>
      <button class="action-button secondary" @click="$emit('back')">Voltar ao Menu</button>
    </div>

    <!-- Modals Compartilhados -->
    <PauseModal 
      :isOpen="isPaused" 
      title="Matrix Pausada"
      description="Faça uma pausa e analise o padrão."
      @resume="resumeGame" 
      @restart="resetLevel" 
      @quit="$emit('back')" 
    />

    <VictoryModal 
      :isOpen="hasWon"
      title="Espelhamento Perfeito!"
      description="A prova real confirmou: os índices se encaixam exatamente."
      @next="nextLevel"
      @menu="$emit('back')"
    >
      <template #stats>
        <div>
          <p>Fase Concluída: {{ currentLevel }}</p>
          <p>Blocos Sincronizados: {{ totalBlocks }}</p>
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
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
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
  color: #f6e05e;
}

.description {
  margin: 0;
  font-size: 1.1rem;
  color: #a0aec0;
}

.status-bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background-color: #1a202c;
  border-bottom: 2px solid #2d3748;
}

.progress-text {
  color: #e2e8f0;
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
}

.progress-bar-container {
  width: 300px;
  height: 12px;
  background-color: #2d3748;
  border-radius: 6px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background-color: #f6e05e;
  transition: width 0.3s ease;
}

.status-bar.all-correct .progress-text {
  color: #f6e05e;
  font-weight: bold;
}

.game-root {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  padding: 1rem;
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

.action-button.primary {
  background-color: #f6e05e;
}

.action-button.primary:hover {
  background-color: #ecc94b;
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

