<script setup>
import { computed } from "vue";
import { useStoryStore, STORY_CHECKPOINTS } from "../../stores/story";
import { useProgressionStore } from "../../stores/progression";
import { useDebugActions } from "../../composables/useDebugActions";

const emit = defineEmits(["start-story"]);

const story = useStoryStore();
const progression = useProgressionStore();
const { message, resetProgress, prepareStage2 } = useDebugActions();

// O painel de debug só existe em desenvolvimento
const isDev = import.meta.env.DEV;

const hasProgress = computed(
  () =>
    story.checkpoint !== STORY_CHECKPOINTS.INTRO_CUTSCENE ||
    progression.totalXp > 0,
);

function jumpToStage2() {
  prepareStage2();
  emit("start-story");
}
</script>

<template>
  <div class="tab-content">
    <h2>{{ $t("hub.story.title") }}</h2>
    <p class="subtitle">
      {{
        hasProgress
          ? $t("hub.story.subtitle_progress")
          : $t("hub.story.subtitle_new")
      }}
    </p>

    <button type="button" class="btn-story" @click="emit('start-story')">
      {{
        hasProgress ? $t("hub.story.btn_continue") : $t("hub.story.btn_start")
      }}
    </button>

    <section
      v-if="isDev"
      class="debug-panel"
      :aria-label="$t('hub.debug.aria')"
    >
      <span class="debug-badge">{{ $t("hub.debug.badge") }}</span>

      <button
        type="button"
        class="btn-debug btn-debug-reset"
        :title="$t('hub.debug.reset_title')"
        @click="resetProgress"
      >
        {{ $t("hub.debug.reset_label") }}
      </button>

      <button
        type="button"
        class="btn-debug btn-debug-jump"
        :title="$t('hub.debug.jump_title')"
        @click="jumpToStage2"
      >
        {{ $t("hub.debug.jump_label") }}
      </button>

      <Transition name="fade">
        <p v-if="message" class="debug-feedback">{{ message }}</p>
      </Transition>
    </section>
  </div>
</template>

<style scoped>
.subtitle {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.btn-story {
  width: 100%;
  min-height: 56px;
  padding: 16px 24px;
  border-radius: 12px;
  border: 2px solid var(--light-green);
  background: transparent;
  color: var(--light-green);
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 0.1s ease,
    background-color 0.2s ease;
}

.btn-story:hover {
  background: rgba(74, 222, 128, 0.08);
}

.btn-story:active {
  transform: scale(0.97);
}

.debug-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  background: rgba(15, 23, 42, 0.75);
  border: 1px dashed rgba(244, 63, 94, 0.5);
  border-radius: 12px;
}

.debug-badge {
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: #f43f5e;
  background: rgba(244, 63, 94, 0.15);
  padding: 3px 10px;
  border-radius: 6px;
}

.btn-debug {
  width: 100%;
  min-height: 44px;
  padding: 10px 14px;
  font-size: 0.88rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-debug-reset {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.45);
  color: #fca5a5;
}

.btn-debug-reset:hover {
  background: rgba(239, 68, 68, 0.3);
  color: #fff;
}

.btn-debug-jump {
  background: rgba(56, 189, 248, 0.15);
  border: 1px solid rgba(56, 189, 248, 0.45);
  color: #7dd3fc;
}

.btn-debug-jump:hover {
  background: rgba(56, 189, 248, 0.3);
  color: #fff;
}

.debug-feedback {
  margin: 0;
  font-size: 0.82rem;
  font-weight: 600;
  color: #4ade80;
  text-align: center;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
