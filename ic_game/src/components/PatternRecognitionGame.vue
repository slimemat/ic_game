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
import PauseModal from "./ui/PauseModal.vue";
import PauseButton from "./ui/PauseButton.vue";
import VictoryModal from "./ui/VictoryModal.vue";
import WarningCard from "./ui/WarningCard.vue";

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

const currentLevelConfig = computed(() => {
  const idx = (currentLevel.value - 1) % LEVEL_CONFIGS.length;
  return LEVEL_CONFIGS[idx];
});

const currentTypeName = computed(() => {
  const type = currentLevelConfig.value?.type;
  if (type === "rotation") return t("pattern.type_rotation");
  if (type === "transformation") return t("pattern.type_transformation");
  return t("pattern.type_color");
});

const currentTheme = computed(() => getThemeIdForLevel(currentLevel.value));

/** Passa para a cena Phaser os dados que ela precisa (via registry). */
function syncRegistry() {
  game.value?.registry.set("level", currentLevel.value);
  game.value?.registry.set(
    "stageLevel",
    props.storyMode ? currentPatternCount.value + 1 : currentLevel.value,
  );
  game.value?.registry.set(
    "totalLevels",
    props.storyMode ? targetPatternCount.value : 10,
  );
  game.value?.registry.set(
    "stage2TimeOfDay",
    props.storyMode
      ? story.storyDecisions?.stage2TimeOfDay || "night"
      : "night",
  );
}

// --- PAUSE: store (Vue) -> Phaser ---
watch(isPaused, (paused) => {
  if (paused) {
    gameScene.value?.scene.pause();
  } else {
    gameScene.value?.scene.resume();
  }
});

// --- PHASER INITIALIZATION ---
onMounted(() => {
  story.setPaused(false);

  const handleWin = ({ isGroupComplete = false } = {}) => {
    let reachedGoal = false;
    if (props.storyMode) {
      // Registra o acerto e XP na store
      reachedGoal = story.registerCorrectPattern();
    } else {
      const totalLevels = game.value?.registry.get("totalLevels") ?? 10;
      reachedGoal = isGroupComplete || currentLevel.value >= totalLevels;
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
    }
    triggerWarning(msg, "error");
  };

  const scene = new PatternRecognitionScene(handleWin, handleError);
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
        gameInstance.registry.set(
          "stageLevel",
          props.storyMode ? currentPatternCount.value + 1 : currentLevel.value,
        );
        gameInstance.registry.set(
          "totalLevels",
          props.storyMode ? targetPatternCount.value : 10,
        );
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
  story.setPaused(false);
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

/** Reinicia o jogo inteiro: volta ao nível 1 da etapa atual (e zera o progresso salvo na história). */
const resetGame = () => {
  performance.resetPerformance();
  currentLevel.value = props.storyMode ? stageStartLevel.value : 1;
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
  syncRegistry();
  gameScene.value?.resetLevel();
};

const pauseGame = () => story.setPaused(true);
const resumeGame = () => story.setPaused(false);

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

    <!-- Floating UI pause button -->
    <div class="floating-ui">
      <PauseButton @click="pauseGame" />
    </div>

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
