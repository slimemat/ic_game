import { defineStore } from "pinia";
import { computed, ref } from "vue";

/**
 * Etapas (checkpoints) do fluxo do Modo História, em ordem de ocorrência.
 * O App.vue usa o checkpoint atual para decidir qual tela renderizar.
 */
export const STORY_CHECKPOINTS = Object.freeze({
  /** Cutscene inicial (Vue – StoryMode, cena "intro") */
  INTRO_CUTSCENE: "intro-cutscene",
  /** Painel de Chamados (escolha da tarefa) */
  DASHBOARD: "dashboard",
  /** Cutscene de introdução da tarefa (Vue – StoryMode, cena "pre-<tarefa>") */
  TASK_INTRO_CUTSCENE: "task-intro-cutscene",
  /** O jogo em si (Phaser) */
  MINIGAME: "minigame",
});

/** Quantidade padrão de padrões que o jogador precisa acertar por tarefa. */
export const DEFAULT_TARGET_PATTERN_COUNT = 10;

const STORAGE_KEY = "ic_game:story-progress";
const SAVE_VERSION = 1;
const VALID_CHECKPOINTS = Object.values(STORY_CHECKPOINTS);

/**
 * Store do Modo História.
 *
 * Responsabilidades:
 *   - Em que etapa o jogador está (checkpoint) e qual tarefa está ativa
 *   - Progresso granular do minigame (ex.: 5 de 10 padrões)
 *   - Estado global de pausa (ponte Vue ⇄ Phaser)
 *   - Persistência em localStorage (sem backend por enquanto)
 *
 * Persistência isolada em save()/load(): ao integrar com o backend,
 * apenas essas duas funções precisam mudar.
 */
export const useStoryStore = defineStore("story", () => {
  // ── State (persistido) ──────────────────────────────────────────────────

  /** Etapa atual do fluxo. Ver STORY_CHECKPOINTS. */
  const checkpoint = ref(STORY_CHECKPOINTS.INTRO_CUTSCENE);

  /** Id da tarefa/minigame em andamento (ex.: "pattern-recognition") ou null. */
  const activeTaskId = ref(null);

  /** Padrões acertados na tarefa atual. */
  const currentPatternCount = ref(0);

  /** Padrões necessários para concluir a tarefa atual (configurável). */
  const targetPatternCount = ref(DEFAULT_TARGET_PATTERN_COUNT);

  /** Ids das tarefas já concluídas. */
  const completedTasks = ref([]);

  // ── State (não persistido) ──────────────────────────────────────────────

  /** Pausa global: Vue (PauseModal) e Phaser (cena) reagem a este valor. */
  const isPaused = ref(false);

  // ── Getters ─────────────────────────────────────────────────────────────

  const isGoalReached = computed(
    () => currentPatternCount.value >= targetPatternCount.value,
  );

  // ── Persistência ────────────────────────────────────────────────────────

  /** Grava o progresso atual no localStorage. */
  function save() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          version: SAVE_VERSION,
          checkpoint: checkpoint.value,
          activeTaskId: activeTaskId.value,
          currentPatternCount: currentPatternCount.value,
          targetPatternCount: targetPatternCount.value,
          completedTasks: completedTasks.value,
        }),
      );
    } catch (error) {
      console.warn("[storyStore] Não foi possível salvar o progresso.", error);
    }
  }

  /**
   * Carrega o progresso salvo (se houver e for válido).
   * @returns {boolean} true se algo foi carregado.
   */
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;

      const data = JSON.parse(raw);
      if (data?.version !== SAVE_VERSION) return false;
      if (!VALID_CHECKPOINTS.includes(data.checkpoint)) return false;

      checkpoint.value = data.checkpoint;
      activeTaskId.value = data.activeTaskId ?? null;
      targetPatternCount.value =
        Number.isInteger(data.targetPatternCount) && data.targetPatternCount > 0
          ? data.targetPatternCount
          : DEFAULT_TARGET_PATTERN_COUNT;
      currentPatternCount.value = Math.min(
        Math.max(Number(data.currentPatternCount) || 0, 0),
        targetPatternCount.value,
      );
      completedTasks.value = Array.isArray(data.completedTasks)
        ? data.completedTasks
        : [];
      return true;
    } catch (error) {
      console.warn("[storyStore] Save inválido, ignorando.", error);
      return false;
    }
  }

  // ── Actions: fluxo ──────────────────────────────────────────────────────

  /**
   * Avança (ou move) para uma etapa do fluxo e persiste.
   * @param {string} step um valor de STORY_CHECKPOINTS
   */
  function advanceCheckpoint(step) {
    if (!VALID_CHECKPOINTS.includes(step)) {
      console.warn(`[storyStore] Checkpoint inválido: "${step}".`);
      return;
    }
    checkpoint.value = step;
    save();
  }

  /**
   * Inicia uma tarefa a partir do Painel de Chamados.
   * Zera o progresso do minigame e vai para a cutscene da tarefa
   * (ou direto para o jogo, se não houver cutscene).
   * @param {string} taskId
   * @param {{ withBriefing?: boolean }} [options]
   */
  function startTask(taskId, { withBriefing = true } = {}) {
    activeTaskId.value = taskId;
    currentPatternCount.value = 0;
    checkpoint.value = withBriefing
      ? STORY_CHECKPOINTS.TASK_INTRO_CUTSCENE
      : STORY_CHECKPOINTS.MINIGAME;
    save();
  }

  /** Conclui a tarefa ativa e volta ao Painel de Chamados. */
  function completeTask() {
    if (
      activeTaskId.value &&
      !completedTasks.value.includes(activeTaskId.value)
    ) {
      completedTasks.value.push(activeTaskId.value);
    }
    activeTaskId.value = null;
    currentPatternCount.value = 0;
    checkpoint.value = STORY_CHECKPOINTS.DASHBOARD;
    save();
  }

  // ── Actions: progresso do minigame ──────────────────────────────────────

  /**
   * Define o progresso do minigame atual (limitado a 0..target) e persiste.
   * @param {number} count
   */
  function setPatternProgress(count) {
    currentPatternCount.value = Math.min(
      Math.max(Math.trunc(count) || 0, 0),
      targetPatternCount.value,
    );
    save();
  }

  /**
   * Registra um acerto. Chamado quando o jogador acerta um padrão.
   * @returns {boolean} true se a meta da tarefa foi atingida.
   */
  function registerCorrectPattern() {
    setPatternProgress(currentPatternCount.value + 1);
    return isGoalReached.value;
  }

  /**
   * Altera a meta de padrões da tarefa atual.
   * @param {number} target inteiro positivo
   */
  function setTargetPatternCount(target) {
    if (!Number.isInteger(target) || target <= 0) return;
    targetPatternCount.value = target;
    currentPatternCount.value = Math.min(currentPatternCount.value, target);
    save();
  }

  // ── Actions: pausa ──────────────────────────────────────────────────────

  /** @param {boolean} paused */
  function setPaused(paused) {
    isPaused.value = Boolean(paused);
  }

  function togglePause() {
    isPaused.value = !isPaused.value;
  }

  // ── Actions: reset ──────────────────────────────────────────────────────

  /** Apaga o progresso (novo jogo). */
  function resetProgress() {
    checkpoint.value = STORY_CHECKPOINTS.INTRO_CUTSCENE;
    activeTaskId.value = null;
    currentPatternCount.value = 0;
    targetPatternCount.value = DEFAULT_TARGET_PATTERN_COUNT;
    completedTasks.value = [];
    isPaused.value = false;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn("[storyStore] Não foi possível limpar o save.", error);
    }
  }

  // Restaura o último checkpoint ao criar a store
  load();

  return {
    // state
    checkpoint,
    activeTaskId,
    currentPatternCount,
    targetPatternCount,
    completedTasks,
    isPaused,
    // getters
    isGoalReached,
    // actions
    advanceCheckpoint,
    startTask,
    completeTask,
    setPatternProgress,
    registerCorrectPattern,
    setTargetPatternCount,
    setPaused,
    togglePause,
    save,
    load,
    resetProgress,
  };
});
