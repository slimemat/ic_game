<script setup>
import { ref } from "vue";
import StoryDebugPanel from "../story/StoryDebugPanel.vue";
import { useStoryChapterSelect } from "../../composables/useStoryChapterSelect";

const emit = defineEmits(["start-story"]);

const {
  companyName,
  hasProgress,
  currentStageNumber,
  currentDay,
  chapters,
  feedbackMessage,
  selectChapter,
  resetStoryProgress,
} = useStoryChapterSelect();

const isDev = import.meta.env.DEV;
const isDebugOpen = ref(false);
const isConfirmingReset = ref(false);

function handleSelectChapter(chapterId) {
  isConfirmingReset.value = false;
  if (selectChapter(chapterId)) {
    emit("start-story");
  }
}

function handleConfirmReset() {
  resetStoryProgress();
  isConfirmingReset.value = false;
}
</script>

<template>
  <div class="tab-content">
    <div class="story-intro">
      <h2>{{ $t("hub.story.title") }}</h2>
      <p class="subtitle">
        {{
          hasProgress
            ? $t("hub.story.subtitle_current", {
                day: currentDay,
                stage: currentStageNumber,
              })
            : $t("hub.story.subtitle_new", { companyName })
        }}
      </p>
    </div>

    <button
      type="button"
      class="btn-tactile btn-tactile--primary btn-tactile--lg btn-tactile--block"
      @click="emit('start-story')"
    >
      <span class="btn-play-icon" aria-hidden="true">▶</span>
      <span>
        {{
          hasProgress ? $t("hub.story.btn_continue") : $t("hub.story.btn_start")
        }}
      </span>
    </button>

    <!-- Seletor Amigável de Pontos da História -->
    <section class="chapters-section">
      <h3 class="section-eyebrow">{{ $t("hub.story.chapters_title") }}</h3>

      <ol class="chapters-list" :aria-label="$t('hub.story.chapters_aria')">
        <li v-for="chapter in chapters" :key="chapter.id">
          <button
            type="button"
            class="chapter-card"
            :class="`is-${chapter.status}`"
            :aria-label="`${chapter.eyebrow}: ${chapter.title} (${chapter.statusLabel})`"
            :aria-current="chapter.status === 'current' ? 'step' : undefined"
            @click="handleSelectChapter(chapter.id)"
          >
            <span class="chapter-status" aria-hidden="true">
              {{
                chapter.status === "done"
                  ? "✓"
                  : chapter.status === "current"
                    ? "●"
                    : "○"
              }}
            </span>

            <span class="chapter-info">
              <span class="chapter-eyebrow">{{ chapter.eyebrow }}</span>
              <strong class="chapter-title">{{ chapter.title }}</strong>
            </span>

            <span class="chapter-right">
              <span class="chapter-meta">{{ chapter.meta }}</span>
              <span class="chapter-arrow" aria-hidden="true">›</span>
            </span>
          </button>
        </li>
      </ol>
    </section>

    <!-- Limpeza Segura de Progresso -->
    <section class="reset-section">
      <Transition name="fade">
        <p v-if="feedbackMessage" class="story-feedback" role="status">
          {{ feedbackMessage }}
        </p>
      </Transition>

      <div
        v-if="isConfirmingReset"
        class="reset-confirm-card"
        role="alertdialog"
        aria-labelledby="story-reset-title"
      >
        <h4 id="story-reset-title" class="reset-confirm-title">
          {{ $t("hub.story.reset_confirm_title") }}
        </h4>
        <p class="reset-confirm-message">
          {{ $t("hub.story.reset_confirm_message") }}
        </p>
        <div class="reset-confirm-actions">
          <button
            type="button"
            class="btn-tactile btn-tactile--ghost-dark btn-tactile--sm btn-reset-flex"
            @click="isConfirmingReset = false"
          >
            {{ $t("hub.story.reset_cancel") }}
          </button>
          <button
            type="button"
            class="btn-tactile btn-tactile--danger btn-tactile--sm btn-reset-flex"
            @click="handleConfirmReset"
          >
            {{ $t("hub.story.reset_confirm") }}
          </button>
        </div>
      </div>

      <button
        v-else
        type="button"
        class="btn-tactile btn-tactile--ghost-dark btn-tactile--block"
        :disabled="!hasProgress"
        @click="isConfirmingReset = true"
      >
        <span aria-hidden="true">↺</span>
        <span>{{ $t("hub.story.reset_btn") }}</span>
      </button>
    </section>

    <!-- Painel Técnico de Debug Recolhível (Apenas DEV) -->
    <footer v-if="isDev" class="dev-debug-footer">
      <button
        type="button"
        class="btn-debug-toggle"
        :aria-expanded="isDebugOpen"
        @click="isDebugOpen = !isDebugOpen"
      >
        <span>
          {{
            isDebugOpen
              ? $t("hub.debug.toggle_hide")
              : $t("hub.debug.toggle_show")
          }}
        </span>
        <span
          class="debug-chevron"
          :class="{ 'is-open': isDebugOpen }"
          aria-hidden="true"
        >
          ▾
        </span>
      </button>

      <StoryDebugPanel v-if="isDebugOpen" @start-story="emit('start-story')" />
    </footer>
  </div>
</template>

<style scoped>
.story-intro {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.subtitle {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.btn-play-icon {
  font-size: 0.85rem;
  line-height: 1;
}

/* ── Seletor Amigável de Pontos da História ── */
.chapters-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-eyebrow {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-dim);
}

.chapters-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chapter-card {
  width: 100%;
  min-height: 54px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  text-align: left;
  color: var(--text-main);
  background: var(--bg-panel);
  border: 1px solid var(--border-default);
  border-radius: 10px;
  cursor: pointer;
  transition:
    border-color 0.18s ease,
    background-color 0.18s ease,
    transform 0.12s ease;
}

.chapter-card:hover,
.chapter-card:focus-visible {
  border-color: var(--accent-color);
  background: rgba(54, 57, 59, 0.9);
}

.chapter-card:active {
  transform: scale(0.99);
}

.chapter-card.is-current {
  border-color: var(--light-green);
  background: rgba(14, 165, 233, 0.1);
}

.chapter-status {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-family: var(--font-mono);
  font-size: 0.78rem;
  font-weight: 700;
  background: rgba(148, 163, 184, 0.12);
  color: var(--text-muted);
}

.chapter-card.is-done .chapter-status {
  background: rgba(148, 221, 188, 0.18);
  color: var(--medium-green);
}

.chapter-card.is-current .chapter-status {
  background: rgba(160, 236, 208, 0.22);
  color: var(--light-green);
}

.chapter-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.chapter-eyebrow {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.chapter-card.is-current .chapter-eyebrow {
  color: var(--light-green);
}

.chapter-title {
  font-size: 0.94rem;
  font-weight: 600;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.chapter-right {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.chapter-meta {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--text-dim);
  white-space: nowrap;
}

.chapter-arrow {
  font-size: 1.2rem;
  line-height: 1;
  color: var(--text-muted);
}

/* ── Reset Seguro ── */
.reset-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.story-feedback {
  margin: 0;
  padding: 8px 12px;
  border-radius: 8px;
  background: rgba(148, 221, 188, 0.14);
  border: 1px solid rgba(148, 221, 188, 0.45);
  color: var(--light-green);
  font-size: 0.84rem;
  font-weight: 600;
  text-align: center;
}

.reset-confirm-card {
  padding: 12px 14px;
  border-radius: 10px;
  background: rgba(30, 41, 59, 0.9);
  border: 1px solid rgba(239, 68, 68, 0.45);
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: left;
}

.reset-confirm-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: #fecaca;
}

.reset-confirm-message {
  margin: 0;
  font-size: 0.84rem;
  line-height: 1.35;
  color: var(--text-muted);
}

.reset-confirm-actions {
  display: flex;
  gap: 8px;
  margin-top: 2px;
}

.btn-reset-flex {
  flex: 1;
}

/* ── Debug Recolhível (Apenas DEV) ── */
.dev-debug-footer {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(148, 163, 184, 0.18);
}

.btn-debug-toggle {
  align-self: center;
  min-height: 44px;
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px dashed rgba(244, 63, 94, 0.45);
  background: rgba(15, 23, 42, 0.6);
  color: #fda4af;
  font-family: var(--font-mono);
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease;
}

.btn-debug-toggle:hover {
  background: rgba(244, 63, 94, 0.14);
  border-color: rgba(244, 63, 94, 0.75);
}

.debug-chevron {
  display: inline-block;
  transition: transform 0.2s ease;
}

.debug-chevron.is-open {
  transform: rotate(180deg);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .chapter-card,
  .btn-debug-toggle,
  .debug-chevron,
  .fade-enter-active,
  .fade-leave-active {
    transition: none;
  }
}
</style>
