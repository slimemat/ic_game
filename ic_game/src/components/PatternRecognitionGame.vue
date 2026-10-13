<script setup>
import {
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  computed,
  watch,
} from "vue";
import { storeToRefs } from "pinia";
import Phaser from "phaser";
import PatternRecognitionScene from "../game/scenes/PatternRecognitionScene";
import { LEVEL_CONFIGS } from "../game/data/PatternRecognitionLevels";
import { getThemeIdForLevel } from "../game/utils/patternTheme";
import { useStoryStore } from "../stores/story";
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

// --- VUE STATE ---
const gameRoot = ref(null);
const game = shallowRef(null);
const gameScene = shallowRef(null);

const hasWon = ref(false);
const showWarning = ref(false);
const warningMessage = ref("");
const warningType = ref("info");

/** Nível inicial: no Modo História retoma do checkpoint (acertos + 1). */
function getStartLevel() {
  return props.storyMode
    ? Math.min(currentPatternCount.value + 1, targetPatternCount.value)
    : 1;
}

const currentLevel = ref(getStartLevel());

const currentDifficulty = computed(() => {
  const idx = (currentLevel.value - 1) % LEVEL_CONFIGS.length;
  return LEVEL_CONFIGS[idx].difficulty;
});

const currentTheme = computed(() => getThemeIdForLevel(currentLevel.value));

/** Passa para a cena Phaser os dados que ela precisa (via registry). */
function syncRegistry() {
  game.value?.registry.set("level", currentLevel.value);
  game.value?.registry.set(
    "totalLevels",
    props.storyMode ? targetPatternCount.value : 10,
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

  const handleWin = () => {
    if (props.storyMode) {
      // Persiste o acerto antes de abrir o modal (sobrevive a um "sair")
      story.registerCorrectPattern();
    }
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
    backgroundColor: "#101820", // a Scene sobrescreve com a cor do tema
    scale: {
      mode: Phaser.Scale.RESIZE,
      width: "100%",
      height: "100%",
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

/** Reinicia o jogo inteiro: volta ao nível 1 (e zera o progresso salvo na história). */
const resetGame = () => {
  if (props.storyMode) {
    story.setPatternProgress(0);
  }
  currentLevel.value = 1;
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

  currentLevel.value = props.storyMode
    ? currentPatternCount.value + 1
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
      :description="`${$t('pattern.level', { num: currentLevel })} - ${$t('pattern.diff', { diff: currentDifficulty === 1 ? $t('pattern.diff_1') : $t('pattern.diff_2') })}`"
      :restartLabel="$t('pattern.restart_game')"
      @resume="resumeGame"
      @restart="resetGame"
      @quit="$emit('back')"
    />

    <VictoryModal
      :isOpen="hasWon"
      :theme="currentTheme"
      @next="nextLevel"
      @menu="$emit('back')"
    >
      <template #stats>
        <div>
          <p>{{ $t("pattern.stats_level", { num: currentLevel }) }}</p>
          <p>
            {{ $t("pattern.stats_diff", { diff: "" }) }}
            {{
              currentDifficulty === 1
                ? $t("pattern.diff_1")
                : $t("pattern.diff_2")
            }}
          </p>
        </div>
      </template>
    </VictoryModal>
  </main>
</template>
