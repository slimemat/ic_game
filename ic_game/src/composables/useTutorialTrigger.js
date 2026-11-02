import { ref, computed } from "vue";
import { useProgressionStore } from "../stores/progression";
import {
  TUTORIALS_CONFIG,
  getTutorialForLevel,
} from "../game/data/tutorialsConfig";

/**
 * Composable que gerencia a detecção Just-in-Time e exibição de tutoriais interativos.
 *
 * @param {{ gameId: string, currentLevel: import('vue').Ref<number> }} params
 */
export function useTutorialTrigger({ gameId, currentLevel }) {
  const progression = useProgressionStore();
  const manualTutorial = ref(null);

  /**
   * Tutorial ativo no momento (seja acionado automaticamente por nível pendente ou manualmente).
   */
  const activeTutorial = computed(() => {
    if (manualTutorial.value) return manualTutorial.value;

    return getTutorialForLevel(
      gameId,
      currentLevel.value,
      progression.isTutorialCompleted,
    );
  });

  /**
   * Marca o tutorial ativo como concluído e fecha o modal.
   * Se o tutorial possuir tutoriais agregados (bundledTutorialIds), marca-os também.
   */
  function completeActiveTutorial() {
    const current = activeTutorial.value;
    if (current?.id) {
      progression.markTutorialCompleted(current.id);
      if (Array.isArray(current.bundledTutorialIds)) {
        for (const bundledId of current.bundledTutorialIds) {
          progression.markTutorialCompleted(bundledId);
        }
      }
    }
    manualTutorial.value = null;
  }

  /**
   * Pula o tutorial ativo marcando como concluído para não incomodar novamente.
   */
  function skipActiveTutorial() {
    completeActiveTutorial();
  }

  /**
   * Abre um tutorial manualmente pelo ID (usado em botões de "Ajuda / Rever Tutorial").
   * @param {string} tutorialId
   */
  function replayTutorial(tutorialId) {
    const tut = TUTORIALS_CONFIG[tutorialId];
    if (tut) {
      manualTutorial.value = tut;
    }
  }

  function closeManualTutorial() {
    manualTutorial.value = null;
  }

  return {
    activeTutorial,
    completeActiveTutorial,
    skipActiveTutorial,
    replayTutorial,
    closeManualTutorial,
  };
}
