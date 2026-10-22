import { onBeforeUnmount, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useStoryStore } from "../stores/story";
import { useProgressionStore } from "../stores/progression";
import { RANKS, STORY_STAGES } from "../game/data/progressionConfig";

const FEEDBACK_MS = 4000;
const [STAGE_1, STAGE_2] = STORY_STAGES;
const STAGE_2_START_XP = RANKS[1].requiredTotalXp;

/**
 * Ações de desenvolvimento (reset e atalho para a Etapa 2).
 * Não navega: quem chama decide o que fazer depois.
 */
export function useDebugActions() {
  const { t } = useI18n();
  const story = useStoryStore();
  const progression = useProgressionStore();

  const message = ref("");
  let timer = null;

  function flash(text) {
    clearTimeout(timer);
    message.value = text;
    timer = setTimeout(() => {
      message.value = "";
    }, FEEDBACK_MS);
  }

  onBeforeUnmount(() => clearTimeout(timer));

  function resetProgress() {
    // Também reseta a progressão e limpa as chaves do localStorage
    story.resetProgress();
    flash(t("hub.debug.reset_done"));
  }

  function prepareStage2() {
    progression.totalXp = STAGE_2_START_XP;
    progression.markStageCompleted(STAGE_1.id);
    progression.save(); // garante a persistência do XP mesmo se a etapa já estava concluída

    story.currentStageId = STAGE_2.id;
    story.completedTasks = [STAGE_1.id];
    story.currentPatternCount = 0;
    story.startTask(STAGE_2.id, { withBriefing: false });

    flash(t("hub.debug.jump_done"));
  }

  return { message, resetProgress, prepareStage2 };
}
