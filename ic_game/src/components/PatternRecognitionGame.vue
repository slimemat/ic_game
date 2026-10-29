<script setup>
import {
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  computed,
  watch,
} from "vue";
import { useI18n } from "vue-i18n";
import { storeToRefs } from "pinia";
import Phaser from "phaser";
import PatternRecognitionScene from "../game/scenes/PatternRecognitionScene";
import { LEVEL_CONFIGS } from "../game/data/PatternRecognitionLevels";
import { getThemeIdForLevel } from "../game/utils/patternTheme";
import { useStoryStore } from "../stores/story";
import { useStagePerformance } from "../composables/useStagePerformance";
import AudioManager from "../game/managers/AudioManager";
import PauseModal from "./ui/PauseModal.vue";
import PauseButton from "./ui/PauseButton.vue";
import VictoryModal from "./ui/VictoryModal.vue";
import WarningCard from "./ui/WarningCard.vue";

const INACTIVITY_HINT_DELAY_MS = 8000;

const props = defineProps({
  /** true quando aberto pelo Modo História (progresso vem da story store). */
  storyMode: { type: Boolean, default: false },
});
const emit = defineEmits(["back"]);

const story = useStoryStore();
const { isPaused, currentPatternCount, targetPatternCount } =
  storeToRefs(story);

const performance = useStagePerformance({
  storyMode: () => props.storyMode,
  totalChallenges: () => (props.storyMode ? targetPatternCount.value : 10),
});

// --- VUE STATE ---
const gameRoot = ref(null);
const game = shallowRef(null);
const gameScene = shallowRef(null);

const hasWon = ref(false);
const showWarning = ref(false);
const warningMessage = ref("");
const warningType = ref("info");

// Estado de UX: Dica contextual e Microcopy mecânico de arrastar
const isHintOpen = ref(false);
const shouldPulseHint = ref(false);
const isSlotFilled = ref(false);
const isDraggingPiece = ref(false);
const showInactivityHint = ref(false);
let inactivityTimer = null;
let warningTimer = null;

const stageStartLevel = computed(() => {
  return props.storyMode ? story.currentStage?.levelStartIndex || 1 : 1;
});

/** Nível inicial: no Modo História retoma do checkpoint da etapa atual. */
function getStartLevel() {
  if (props.storyMode) {
    const offset = Math.min(
      currentPatternCount.value,
      Math.max(0, targetPatternCount.value - 1),
    );
    return stageStartLevel.value + offset;
  }
  return 1;
}

const { t } = useI18n();

const currentLevel = ref(getStartLevel());

const totalLevels = computed(() =>
  props.storyMode ? targetPatternCount.value : 10,
);

const stageLevel = computed(() =>
  props.storyMode
    ? currentPatternCount.value + 1
    : ((currentLevel.value - 1) % totalLevels.value) + 1,
);

const progressPercent = computed(() =>
  Math.min(100, Math.round((stageLevel.value / totalLevels.value) * 100)),
);

const currentLevelConfig = computed(() => {
  const idx = (currentLevel.value - 1) % LEVEL_CONFIGS.length;
  return LEVEL_CONFIGS[idx];
});

const currentPromptText = computed(() => {
  const key =
    currentLevelConfig.value?.promptKey || "pattern.prompts.rotation_sequence";
  return t(key);
});

const currentHintText = computed(() => {
  const key = currentLevelConfig.value?.hintKey;
  return key ? t(key) : "";
});

const currentTypeName = computed(() => {
  const type = currentLevelConfig.value?.type;
  if (type === "rotation") return t("pattern.type_rotation");
  if (type === "transformation") return t("pattern.type_transformation");
  return t("pattern.type_color");
});

const currentTheme = computed(() => getThemeIdForLevel(currentLevel.value));

/**
 * O microcopy mecânico ("Arraste uma peça até o espaço '?'") aparece:
 * - Automaticamente apenas na Fase 1 (onboarding) enquanto o slot estiver vazio;
 * - Nas demais fases apenas após inatividade (8s) ou quando a dica (?) está aberta.
 */
const showDragMicrocopy = computed(
  () =>
    !isSlotFilled.value &&
    !isDraggingPiece.value &&
    !hasWon.value &&
    (currentLevel.value === 1 || showInactivityHint.value || isHintOpen.value),
);

function clearInactivityTimer() {
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
    inactivityTimer = null;
  }
}

function scheduleInactivityTimer() {
  clearInactivityTimer();
  if (isSlotFilled.value || isPaused.value || hasWon.value) return;

  inactivityTimer = setTimeout(() => {
    if (!isSlotFilled.value && !isPaused.value && !hasWon.value) {
      showInactivityHint.value = true;
    }
  }, INACTIVITY_HINT_DELAY_MS);
}

function resetLevelUxState() {
  isHintOpen.value = false;
  shouldPulseHint.value = false;
  isSlotFilled.value = false;
  isDraggingPiece.value = false;
  showInactivityHint.value = false;
  scheduleInactivityTimer();
}

function toggleHint() {
  isHintOpen.value = !isHintOpen.value;
  if (isHintOpen.value) {
    shouldPulseHint.value = false;
  }
  AudioManager.play("reply_sfx", { volume: 0.45 });
}

/** Passa para a cena Phaser os dados que ela precisa (via registry). */
function syncRegistry() {
  game.value?.registry.set("level", currentLevel.value);
  game.value?.registry.set("stageLevel", stageLevel.value);
  game.value?.registry.set("totalLevels", totalLevels.value);
  game.value?.registry.set(
    "stage2TimeOfDay",
    props.storyMode
      ? story.storyDecisions?.stage2TimeOfDay || "night"
      : "night",
  );
}

watch(currentLevel, () => {
  resetLevelUxState();
});

// --- PAUSE: store (Vue) -> Phaser ---
watch(isPaused, (paused) => {
  if (paused) {
    clearInactivityTimer();
    gameScene.value?.scene.pause();
  } else {
    scheduleInactivityTimer();
    gameScene.value?.scene.resume();
  }
});

// --- PHASER INITIALIZATION ---
onMounted(() => {
  story.setPaused(false);
  scheduleInactivityTimer();

  const handleWin = ({ isGroupComplete = false } = {}) => {
    clearInactivityTimer();
    let reachedGoal = false;
    if (props.storyMode) {
      // Registra o acerto e XP na store
      reachedGoal = story.registerCorrectPattern();
    } else {
      const maxLevels = game.value?.registry.get("totalLevels") ?? 10;
      reachedGoal = isGroupComplete || currentLevel.value >= maxLevels;
    }

    if (reachedGoal || isGroupComplete) {
      // Concluiu o grupo de tarefas da etapa! Exibe o componente de vitória
      hasWon.value = true;
    } else {
      // Tarefa intermediária: atualiza o nível da etapa e transiciona
      currentLevel.value = props.storyMode
        ? stageStartLevel.value + currentPatternCount.value
        : currentLevel.value + 1;
      syncRegistry();
      gameScene.value?.resetLevel({ animateIn: true });
    }
  };

  const handleError = (msg, { isMistake = true } = {}) => {
    if (isMistake) {
      performance.recordMistake();
      if (!isHintOpen.value) {
        shouldPulseHint.value = true;
      }
    }
    triggerWarning(msg, "error");
  };

  const handleSlotChange = ({
    isSlotFilled: filled = false,
    isInteracting = false,
  } = {}) => {
    isSlotFilled.value = Boolean(filled);
    isDraggingPiece.value = Boolean(isInteracting);
    if (filled || isInteracting) {
      showInactivityHint.value = false;
      clearInactivityTimer();
    } else {
      scheduleInactivityTimer();
    }
  };

  const scene = new PatternRecognitionScene(
    handleWin,
    handleError,
    handleSlotChange,
  );
  gameScene.value = scene;

  game.value = new Phaser.Game({
    type: Phaser.AUTO,
    parent: gameRoot.value,
    backgroundColor: "#101820", // a Scene sobrescreve com a cor do tema
    scale: {
      mode: Phaser.Scale.RESIZE,
      width: "100%",
      height: "100%",
    },
    callbacks: {
      preBoot: (gameInstance) => {
        gameInstance.registry.set("level", currentLevel.value);
        gameInstance.registry.set("stageLevel", stageLevel.value);
        gameInstance.registry.set("totalLevels", totalLevels.value);
        gameInstance.registry.set(
          "stage2TimeOfDay",
          props.storyMode
            ? story.storyDecisions?.stage2TimeOfDay || "night"
            : "night",
        );
      },
    },
    scene,
  });

  syncRegistry();
});

onBeforeUnmount(() => {
  clearInactivityTimer();
  clearTimeout(warningTimer);
  story.setPaused(false);
  game.value?.destroy(true);
  game.value = null;
  gameScene.value = null;
});

// --- CONTROLS ---
/** Reinicia o jogo inteiro: volta ao nível 1 da etapa atual (e zera o progresso salvo na história). */
const resetGame = () => {
  performance.resetPerformance();
  currentLevel.value = props.storyMode ? stageStartLevel.value : 1;
  resetLevelUxState();
  syncRegistry();
  gameScene.value?.resetLevel();
  hasWon.value = false;
  resumeGame();
};

const nextLevel = () => {
  hasWon.value = false;

  // Meta atingida: conclui a tarefa; o App.vue troca de tela pelo checkpoint
  if (props.storyMode && story.isGoalReached) {
    story.completeTask();
    return;
  }

  performance.resetPerformance();
  currentLevel.value = props.storyMode
    ? stageStartLevel.value + currentPatternCount.value
    : currentLevel.value + 1;
  resetLevelUxState();
  syncRegistry();
  gameScene.value?.resetLevel();
};

const pauseGame = () => story.setPaused(true);
const resumeGame = () => story.setPaused(false);

const triggerWarning = (msg, type = "info") => {
  clearTimeout(warningTimer);
  warningMessage.value = msg;
  warningType.value = type;
  showWarning.value = true;
  warningTimer = setTimeout(() => (showWarning.value = false), 3000);
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

    <!-- HUD Superior Responsivo (Progresso + Enunciado + Dica + Pausa) -->
    <header class="pattern-hud" aria-live="polite">
      <div class="pattern-top-bar">
        <div class="pattern-progress-pill">
          <span class="progress-label">
            {{ $t("pattern.level", { num: stageLevel }) }} / {{ totalLevels }}
          </span>
          <div class="progress-track" aria-hidden="true">
            <div
              class="progress-fill"
              :style="{ width: `${progressPercent}%` }"
            ></div>
          </div>
        </div>

        <div class="pattern-top-actions">
          <button
            v-if="currentHintText"
            type="button"
            class="hint-toggle-btn"
            :class="{
              'is-open': isHintOpen,
              'is-pulsing': shouldPulseHint && !isHintOpen,
            }"
            :aria-expanded="isHintOpen"
            :aria-label="$t('pattern.hint_button_aria')"
            @click="toggleHint"
          >
            <span class="hint-icon" aria-hidden="true">?</span>
            <span class="hint-btn-text">{{
              $t("pattern.hint_button_label")
            }}</span>
          </button>

          <PauseButton @click="pauseGame" />
        </div>
      </div>

      <div class="pattern-prompt-card">
        <h1 :key="currentLevel" class="pattern-prompt-title">
          {{ currentPromptText }}
        </h1>

        <transition name="hint-fade">
          <p v-if="isHintOpen && currentHintText" class="pattern-hint-text">
            <span class="hint-bulb" aria-hidden="true">💡</span>
            <span>{{ currentHintText }}</span>
          </p>
        </transition>
      </div>
    </header>

    <!-- Phaser container -->
    <div
      ref="gameRoot"
      class="game-root"
      aria-label="Pattern Recognition Game"
    ></div>

    <!-- Microcopy Mecânico Secundário (Onboarding na Fase 1 ou por inatividade/dica) -->
    <transition name="microcopy-fade">
      <div
        v-if="showDragMicrocopy"
        class="pattern-bottom-microcopy"
        aria-live="polite"
      >
        <span class="drag-microcopy-pill">
          <span aria-hidden="true">👆</span>
          {{ $t("pattern.mechanics.drag_to_slot") }}
        </span>
      </div>
    </transition>

    <!-- Modals Compartilhados -->
    <PauseModal
      :isOpen="isPaused"
      :theme="currentTheme"
      :description="`${$t('pattern.level', { num: currentLevel })}: ${currentTypeName}`"
      :restartLabel="$t('pattern.restart_game')"
      @resume="resumeGame"
      @restart="resetGame"
      @quit="$emit('back')"
    />

    <VictoryModal
      :isOpen="hasWon"
      :theme="currentTheme"
      :stars="performance.stars.value"
      :maxStars="performance.maxStars.value"
      @next="nextLevel"
      @menu="$emit('back')"
    >
      <template #stats>
        <div>
          <p>{{ $t("pattern.stats_level", { num: currentLevel }) }}</p>
          <p>{{ $t("pattern.stats_type", { type: currentTypeName }) }}</p>
          <p>
            {{
              $t("global.modals.stats_mistakes", {
                count: performance.mistakes.value,
              })
            }}
          </p>
          <p v-if="storyMode && performance.perfectBonusXp.value > 0">
            <strong>
              {{
                $t("global.modals.stats_perfect_bonus", {
                  xp: performance.perfectBonusXp.value,
                })
              }}
            </strong>
          </p>
        </div>
      </template>
    </VictoryModal>
  </main>
</template>

<style scoped>
.pattern-hud {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  padding: 10px 14px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  pointer-events: none;
  z-index: 40;
}

.pattern-top-bar {
  width: 100%;
  max-width: 680px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.pattern-progress-pill {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.78);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(148, 163, 184, 0.28);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.22);
}

.progress-label {
  font-family: var(--font-main);
  font-size: clamp(0.8rem, 2.4vw, 0.92rem);
  font-weight: 700;
  color: #e2e8f0;
  white-space: nowrap;
}

.progress-track {
  width: clamp(68px, 22vw, 130px);
  height: 8px;
  border-radius: 999px;
  background: rgba(51, 65, 85, 0.85);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #38bdf8, #0ea5e9);
  transition: width 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.pattern-top-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  pointer-events: auto;
}

.hint-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 44px;
  padding: 0 13px;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  background: rgba(15, 23, 42, 0.78);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: #f8fafc;
  font-family: var(--font-main);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    background-color 0.18s ease;
}

.hint-toggle-btn:hover {
  border-color: #38bdf8;
  transform: translateY(-1px);
}

.hint-toggle-btn.is-open {
  background: rgba(14, 165, 233, 0.25);
  border-color: #38bdf8;
  color: #bae6fd;
}

.hint-toggle-btn.is-pulsing {
  border-color: #fbbf24;
  animation: hint-pulse 1.6s infinite ease-in-out;
}

.hint-icon {
  display: inline-grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(56, 189, 248, 0.22);
  color: #38bdf8;
  font-weight: 700;
  font-size: 0.85rem;
}

.hint-toggle-btn.is-pulsing .hint-icon {
  background: rgba(251, 191, 36, 0.25);
  color: #fbbf24;
}

.pattern-prompt-card {
  width: 100%;
  max-width: min(94vw, 520px);
  padding: 10px 16px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.84);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(148, 163, 184, 0.28);
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  pointer-events: auto;
}

.pattern-prompt-title {
  margin: 0;
  max-width: 34ch;
  font-family: var(--font-main);
  font-size: clamp(1.125rem, 3.5vw, 1.5rem);
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.01em;
  color: #f8fafc;
}

.pattern-hint-text {
  margin: 8px 0 0;
  padding-top: 8px;
  width: 100%;
  max-width: 40ch;
  border-top: 1px solid rgba(56, 189, 248, 0.25);
  font-family: var(--font-main);
  font-size: clamp(0.9rem, 2.8vw, 1.02rem);
  font-weight: 500;
  line-height: 1.35;
  color: #bae6fd;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.hint-bulb {
  flex-shrink: 0;
}

.pattern-bottom-microcopy {
  position: absolute;
  bottom: 17.5%;
  left: 50%;
  transform: translateX(-50%);
  width: 92%;
  max-width: 420px;
  display: flex;
  justify-content: center;
  pointer-events: none;
  z-index: 30;
}

.drag-microcopy-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.82);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  border: 1px dashed rgba(56, 189, 248, 0.45);
  color: #e2e8f0;
  font-family: var(--font-main);
  font-size: clamp(0.85rem, 2.6vw, 0.95rem);
  font-weight: 500;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}

@keyframes hint-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.45);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(251, 191, 36, 0);
  }
}

.hint-fade-enter-active,
.hint-fade-leave-active,
.microcopy-fade-enter-active,
.microcopy-fade-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
}

.hint-fade-enter-from,
.hint-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.microcopy-fade-enter-from,
.microcopy-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, 6px);
}

@media (max-width: 380px) {
  .hint-btn-text {
    display: none;
  }
  .hint-toggle-btn {
    padding: 0 10px;
  }
}
</style>
