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
    sceneInstance.loadLevel(currentCharade.value.library);
  });
  gameScene.value = scene;

  game.value = new Phaser.Game({
    type: Phaser.AUTO,
    parent: gameRoot.value,
    backgroundColor: "#f0f4f8",
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 600,
      height: 800,
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
      "Parece que esse nÃ£o Ã© o culpado. Revise as pistas!",
      "error",
    );
  }
};

const nextLevel = () => {
  hasWon.value = false;
  if (currentLevel.value < CHARADES_LEVELS.length - 1) {
    currentLevel.value++;
    if (gameScene.value) {
      gameScene.value.loadLevel(currentCharade.value.library);
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
    gameScene.value.loadLevel(currentCharade.value.library);
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

    <div class="ui-header">
      <button class="action-button secondary" @click="$emit('back')">
        â† Voltar
      </button>
      <button class="action-button warning" @click="pauseGame">Pausar</button>
      <h2>{{ currentCharade.title }}</h2>
    </div>

    <div class="game-content">
      <!-- Phaser container -->
      <div class="canvas-container">
        <div ref="gameRoot" class="game-root" aria-label="Charade Game"></div>
      </div>

      <!-- Problem description and answers -->
      <div class="problem-panel">
        <div class="clue-box">
          <h3>Enunciado:</h3>
          <p class="clue-text" style="margin-bottom: 1rem">
            {{ currentCharade.statement }}
          </p>

          <h3>Pista:</h3>
          <p class="clue-text">{{ currentCharade.clue }}</p>
          <p v-if="currentCharade.rule" class="rule-text">
            <strong>Regra:</strong> {{ currentCharade.rule }}
          </p>
        </div>

        <div class="answer-box">
          <h3>Quem Ã© o culpado?</h3>
          <div class="suspects-buttons">
            <button
              v-for="suspect in currentCharade.suspects"
              :key="suspect"
              class="suspect-btn"
              @click="checkAnswer(suspect)"
            >
              {{ suspect }}
            </button>
          </div>
        </div>

        <div class="instructions">
          <p>
            <strong>Dica:</strong> Arraste os itens da biblioteca para o canvas
            para ajudar a pensar!
          </p>
          <p>
            Para apagar, arraste para a lixeira no canto inferior direito do
            canvas.
          </p>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <PauseModal
      :isOpen="isPaused"
      title="DeduÃ§Ã£o em Pausa"
      description="Revise mentalmente as pistas coletadas."
      @resume="resumeGame"
      @restart="restartGame"
      @quit="$emit('back')"
    />

    <VictoryModal
      :isOpen="hasWon"
      title="Caso Encerrado!"
      description="VocÃª desvendou o mistÃ©rio."
      @next="nextLevel"
      @menu="$emit('back')"
    >
      <template #actions>
        <button @click="nextLevel" class="btn btn-primary">
          {{
            currentLevel < CHARADES_LEVELS.length - 1
              ? "PrÃ³ximo MistÃ©rio"
              : "Finalizar (Voltar)"
          }}
        </button>
      </template>
    </VictoryModal>
  </main>
</template>

<style scoped>
.game-content {
  display: flex;
  flex: 1;
  min-height: 0;
}

.canvas-container {
  flex: 1;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  border-right: 2px solid #cbd5e1;
  background-color: #e2e8f0;
}

.problem-panel {
  width: 350px;
  background-color: #ffffff;
  padding: 1.5rem;
  overflow-y: auto;
  box-shadow: -2px 0 5px rgba(0, 0, 0, 0.05);
}

.clue-box {
  background-color: #f1f5f9;
  padding: 1.25rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  border: 1px solid #e2e8f0;
}

.clue-box h3 {
  margin-top: 0;
  margin-bottom: 0.5rem;
  color: #0f172a;
}

.clue-text {
  margin: 0;
  line-height: 1.5;
}

.rule-text {
  margin-top: 1rem;
  color: #b91c1c;
  background-color: #fef2f2;
  padding: 0.5rem;
  border-radius: 4px;
}

.answer-box {
  background-color: #f8fafc;
  padding: 1.25rem;
  border-radius: 8px;
  border: 1px dashed #cbd5e1;
  margin-bottom: 2rem;
}

.suspects-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
}

.suspect-btn {
  padding: 0.75rem;
  border: 2px solid #3b82f6;
  background-color: #eff6ff;
  color: #1e3a8a;
  border-radius: 8px;
  font-weight: bold;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.suspect-btn:hover {
  background-color: #3b82f6;
  color: white;
}

.instructions {
  font-size: 0.9rem;
  color: #64748b;
  text-align: center;
}
</style>

