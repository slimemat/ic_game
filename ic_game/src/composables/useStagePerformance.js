import { computed, ref } from "vue";
import {
  calculateStarRating,
  calculateAccuracyPercent,
} from "../game/logic/performanceRating";
import { useStoryStore } from "../stores/story";

/**
 * Composable reutilizável (SOLID / DRY) para rastrear erros e calcular estrelas
 * em qualquer mini-jogo, tanto no Modo História (persistido na storyStore)
 * quanto no Modo Livre / Seleção de Fases (estado reativo local por partida).
 *
 * @param {{
 *   storyMode?: () => boolean | boolean,
 *   totalChallenges?: () => number | number
 * }} [options]
 */
export function useStagePerformance(options = {}) {
  const story = useStoryStore();
  const localMistakes = ref(0);

  const isStoryMode = computed(() => {
    if (typeof options.storyMode === "function") return options.storyMode();
    return Boolean(options.storyMode);
  });

  const resolvedTotalChallenges = computed(() => {
    if (typeof options.totalChallenges === "function") {
      return options.totalChallenges();
    }
    if (typeof options.totalChallenges === "number") {
      return options.totalChallenges;
    }
    return isStoryMode.value ? story.targetPatternCount : 1;
  });

  const mistakes = computed(() => {
    return isStoryMode.value ? story.currentStageMistakes : localMistakes.value;
  });

  const rating = computed(() => {
    return calculateStarRating({ mistakes: mistakes.value });
  });

  const stars = computed(() => rating.value.stars);
  const maxStars = computed(() => rating.value.maxStars);
  const isPerfect = computed(() => rating.value.isPerfect);
  const tier = computed(() => rating.value.tier);
  const labelKey = computed(() => rating.value.labelKey);

  const accuracyPercent = computed(() => {
    return calculateAccuracyPercent({
      totalChallenges: resolvedTotalChallenges.value,
      mistakes: mistakes.value,
    });
  });

  const perfectBonusXp = computed(() => {
    if (!isStoryMode.value) return 0;
    return story.currentStagePerfectBonusXp;
  });

  /**
   * Registra um erro cometido pelo jogador durante a fase/grupo de fases.
   */
  function recordMistake() {
    if (isStoryMode.value) {
      story.registerMistake();
    } else {
      localMistakes.value += 1;
    }
  }

  /**
   * Reinicia o contador de erros da partida/etapa atual.
   */
  function resetPerformance() {
    localMistakes.value = 0;
    if (isStoryMode.value) {
      story.setPatternProgress(0);
    }
  }

  return {
    mistakes,
    stars,
    maxStars,
    isPerfect,
    tier,
    labelKey,
    accuracyPercent,
    perfectBonusXp,
    recordMistake,
    resetPerformance,
  };
}
