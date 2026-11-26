<script setup>
import { ref } from "vue";
import StoryDebugPanel from "../story/StoryDebugPanel.vue";
import LobbySectionHeader from "../ui/lobby/LobbySectionHeader.vue";
import AeroGlassCard from "../ui/lobby/AeroGlassCard.vue";
import AeroActionButton from "../ui/lobby/AeroActionButton.vue";
import AppIcon from "../ui/AppIcon.vue";
import { useStoryChapterSelect } from "../../composables/useStoryChapterSelect";

const emit = defineEmits(["start-story"]);

const {
  companyName,
  hasProgress,
  currentStageNumber,
  currentDay,
  recap,
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
    <LobbySectionHeader
      :title="$t('hub.story.title')"
      :subtitle="
        hasProgress
          ? $t('hub.story.subtitle_current', {
              day: currentDay,
              stage: currentStageNumber,
            })
          : $t('hub.story.subtitle_new', { companyName })
      "
    />

    <!-- Resumo da Jornada (Story Recap) -->
    <AeroGlassCard variant="accent" padding="md" class="recap-card">
      <div class="recap-header">
        <span class="recap-badge">
          <AppIcon name="sparkles" :size="14" />
          <span>{{ $t("hub.story.recap_title") }}</span>
        </span>
      </div>

      <dl class="recap-list">
        <div class="recap-row">
          <dt>{{ $t("hub.story.recap_last_label") }}</dt>
          <dd>{{ recap.lastCompletedText }}</dd>
        </div>
        <div class="recap-row">
          <dt>{{ $t("hub.story.recap_next_label") }}</dt>
          <dd class="is-highlight">{{ recap.nextStepText }}</dd>
        </div>
      </dl>

      <AeroActionButton
        variant="primary"
        size="lg"
        block
        icon="play"
        @click="emit('start-story')"
      >
        {{
          hasProgress ? $t("hub.story.btn_continue") : $t("hub.story.btn_start")
        }}
      </AeroActionButton>
    </AeroGlassCard>

    <!-- Linha do Tempo / Pontos da História -->
    <section class="chapters-section">
      <h3 class="section-eyebrow">{{ $t("hub.story.chapters_title") }}</h3>

      <ol class="chapters-list" :aria-label="$t('hub.story.chapters_aria')">
        <li v-for="chapter in chapters" :key="chapter.id">
          <AeroGlassCard
            as="button"
            :variant="chapter.status === 'current' ? 'accent' : 'default'"
            padding="none"
            interactive
            class="chapter-card"
            :class="`is-${chapter.status}`"
            :aria-label="`${chapter.eyebrow}: ${chapter.title} (${chapter.statusLabel})`"
            :aria-current="chapter.status === 'current' ? 'step' : undefined"
            @click="handleSelectChapter(chapter.id)"
          >
            <span class="chapter-status" aria-hidden="true">
              <AppIcon
                v-if="chapter.status === 'done'"
                name="check"
                :size="15"
              />
              <AppIcon
                v-else-if="chapter.status === 'current'"
                name="play"
                :size="13"
              />
              <span v-else class="status-dot"></span>
            </span>

            <span class="chapter-info">
              <span class="chapter-eyebrow">{{ chapter.eyebrow }}</span>
              <strong class="chapter-title">{{ chapter.title }}</strong>
            </span>

            <span class="chapter-right">
              <span
                v-if="chapter.status === 'current'"
                class="chapter-current-pill"
              >
                {{ chapter.statusLabel }}
              </span>
              <span v-else class="chapter-meta">{{ chapter.meta }}</span>
              <span class="chapter-arrow" aria-hidden="true">›</span>
            </span>
          </AeroGlassCard>
        </li>
      </ol>
    </section>

    <!-- Limpeza Segura de Progresso (Link discreto no rodapé) -->
    <section class="reset-section">
      <Transition name="fade">
        <p v-if="feedbackMessage" class="story-feedback" role="status">
          {{ feedbackMessage }}
        </p>
      </Transition>

      <AeroGlassCard
        v-if="isConfirmingReset"
        variant="elevated"
        padding="md"
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
          <AeroActionButton
            variant="secondary"
            size="sm"
            class="btn-reset-flex"
            @click="isConfirmingReset = false"
          >
            {{ $t("hub.story.reset_cancel") }}
          </AeroActionButton>
          <AeroActionButton
            variant="danger"
            size="sm"
            class="btn-reset-flex"
            @click="handleConfirmReset"
          >
            {{ $t("hub.story.reset_confirm") }}
          </AeroActionButton>
        </div>
      </AeroGlassCard>

      <div v-else class="reset-link-wrap">
        <AeroActionButton
          variant="ghost-link"
          size="sm"
          icon="reset"
          :disabled="!hasProgress"
          @click="isConfirmingReset = true"
        >
          {{ $t("hub.story.reset_btn") }}
        </AeroActionButton>
      </div>
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
/* ── Resumo Card ── */
.recap-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recap-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.recap-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(14, 165, 233, 0.14);
  border: 1px solid rgba(14, 165, 233, 0.28);
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #0369a1;
}

.recap-list {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.recap-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.recap-row dt {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--aero-text-muted, #475569);
}

.recap-row dd {
  margin: 0;
  font-size: 0.92rem;
  line-height: 1.3;
  color: var(--aero-text-secondary, #334155);
}

.recap-row dd.is-highlight {
  font-weight: 700;
  color: var(--aero-text-primary, #0f172a);
}

/* ── Timeline de Pontos da História ── */
.chapters-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-eyebrow {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--aero-text-secondary, #334155);
}

.chapters-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.chapter-card {
  width: 100%;
  min-height: 58px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 14px;
  border-radius: 15px;
}

.chapter-card.is-available {
  opacity: 0.88;
}

.chapter-status {
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: rgba(15, 23, 42, 0.08);
  color: var(--aero-text-muted, #475569);
  border: 1px solid rgba(255, 255, 255, 0.85);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #94a3b8;
}

.chapter-card.is-done .chapter-status {
  background: rgba(16, 185, 129, 0.18);
  border-color: rgba(16, 185, 129, 0.35);
  color: #047857;
}

.chapter-card.is-current .chapter-status {
  background: linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%);
  border-color: rgba(255, 255, 255, 0.9);
  color: #ffffff;
  box-shadow: 0 3px 10px rgba(14, 165, 233, 0.32);
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
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--aero-text-muted, #475569);
}

.chapter-card.is-current .chapter-eyebrow {
  color: var(--aero-accent, #0284c7);
}

.chapter-title {
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1.25;
  color: var(--aero-text-primary, #0f172a);
  overflow-wrap: anywhere;
}

.chapter-right {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.chapter-current-pill {
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba(14, 165, 233, 0.16);
  border: 1px solid rgba(14, 165, 233, 0.32);
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 700;
  color: #0369a1;
}

.chapter-meta {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--aero-text-muted, #475569);
  white-space: nowrap;
}

.chapter-arrow {
  font-size: 1.2rem;
  line-height: 1;
  color: var(--aero-text-muted, #475569);
}

/* ── Reset Seguro (Demoted Link + Glass Confirm) ── */
.reset-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 4px;
}

.reset-link-wrap {
  display: flex;
  justify-content: center;
}

.story-feedback {
  margin: 0;
  padding: 9px 12px;
  border-radius: 12px;
  background: rgba(209, 250, 229, 0.9);
  border: 1px solid rgba(16, 185, 129, 0.45);
  color: #065f46;
  font-size: 0.84rem;
  font-weight: 700;
  text-align: center;
}

.reset-confirm-card {
  border-color: rgba(239, 68, 68, 0.45);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reset-confirm-title {
  margin: 0;
  font-size: 0.96rem;
  font-weight: 700;
  color: #991b1b;
}

.reset-confirm-message {
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.38;
  color: var(--aero-text-secondary, #334155);
}

.reset-confirm-actions {
  display: flex;
  gap: 8px;
  margin-top: 4px;
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
  border-top: 1px solid rgba(15, 23, 42, 0.12);
}

.btn-debug-toggle {
  align-self: center;
  min-height: 40px;
  padding: 6px 14px;
  border-radius: 999px;
  border: 1px dashed rgba(225, 29, 72, 0.45);
  background: rgba(255, 255, 255, 0.65);
  color: #be123c;
  font-family: var(--font-mono);
  font-size: 0.74rem;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease;
}

.btn-debug-toggle:hover {
  background: rgba(255, 228, 230, 0.85);
  border-color: rgba(225, 29, 72, 0.75);
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
  .btn-debug-toggle,
  .debug-chevron,
  .fade-enter-active,
  .fade-leave-active {
    transition: none;
  }
}
</style>
