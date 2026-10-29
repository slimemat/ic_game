<script setup>
import { computed } from "vue";
import { useStoryStore, STORY_CHECKPOINTS } from "../../stores/story";
import { useProgressionStore } from "../../stores/progression";
import { useDebugActions } from "../../composables/useDebugActions";

const emit = defineEmits(["start-story"]);

const story = useStoryStore();
const progression = useProgressionStore();
const {
  message,
  selectedShift,
  selectedStars,
  currentDay,
  currentCheckpoint,
  setShiftDecision,
  setStarsDecision,
  jumpToPreset,
  resetProgress,
} = useDebugActions();

// O painel de debug só existe em desenvolvimento
const isDev = import.meta.env.DEV;

const hasProgress = computed(
  () =>
    story.checkpoint !== STORY_CHECKPOINTS.INTRO_CUTSCENE ||
    progression.totalXp > 0,
);

function handleJump(presetId) {
  jumpToPreset(presetId);
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
      <div class="debug-header-row">
        <span class="debug-badge">{{ $t("hub.debug.badge") }}</span>
      </div>

      <!-- Resumo do Estado Ativo no Pinia -->
      <div class="debug-status-box">
        <span class="debug-status-eyebrow">
          {{ $t("hub.debug.status_title") }}
        </span>
        <div
          class="debug-active-shift"
          :class="selectedShift === 'night' ? 'is-night' : 'is-day'"
        >
          {{
            selectedShift === "night"
              ? $t("hub.debug.status_shift_night")
              : $t("hub.debug.status_shift_day")
          }}
        </div>
        <div class="debug-meta-pills">
          <span class="debug-meta-pill">
            {{ $t("hub.debug.status_day", { day: currentDay }) }}
          </span>
          <span class="debug-meta-pill">
            {{ $t("hub.debug.status_stars", { stars: selectedStars }) }}
          </span>
          <span class="debug-meta-pill">
            {{
              $t("hub.debug.status_checkpoint", {
                checkpoint: currentCheckpoint,
              })
            }}
          </span>
        </div>
      </div>

      <!-- Feedback Toast -->
      <Transition name="fade">
        <p v-if="message" class="debug-feedback">{{ message }}</p>
      </Transition>

      <!-- 1. Switches de Decisões Pré-Definidas -->
      <div class="debug-section">
        <h3 class="debug-section-title">
          {{ $t("hub.debug.decisions_title") }}
        </h3>

        <div class="debug-control-group">
          <span class="debug-control-label">
            {{ $t("hub.debug.shift_label") }}
          </span>
          <div class="debug-switch-row" role="group">
            <button
              type="button"
              class="debug-switch-btn"
              :class="{ 'is-selected-night': selectedShift === 'night' }"
              :aria-pressed="selectedShift === 'night'"
              @click="setShiftDecision('night')"
            >
              {{ $t("hub.debug.shift_night_btn") }}
            </button>
            <button
              type="button"
              class="debug-switch-btn"
              :class="{ 'is-selected-day': selectedShift === 'day' }"
              :aria-pressed="selectedShift === 'day'"
              @click="setShiftDecision('day')"
            >
              {{ $t("hub.debug.shift_day_btn") }}
            </button>
          </div>
        </div>

        <div class="debug-control-group">
          <span class="debug-control-label">
            {{ $t("hub.debug.stars_label") }}
          </span>
          <div class="debug-switch-row" role="group">
            <button
              v-for="starCount in [3, 2, 1]"
              :key="starCount"
              type="button"
              class="debug-switch-btn debug-switch-btn--compact"
              :class="{ 'is-selected-star': selectedStars === starCount }"
              :aria-pressed="selectedStars === starCount"
              @click="setStarsDecision(starCount)"
            >
              {{ $t("hub.debug.stars_btn", { stars: starCount }) }}
            </button>
          </div>
        </div>
      </div>

      <!-- 2. Atalhos de Cutscenes -->
      <div class="debug-section">
        <h3 class="debug-section-title">
          {{ $t("hub.debug.cutscenes_title") }}
        </h3>
        <div class="debug-btn-list">
          <button
            type="button"
            class="btn-debug btn-debug-cutscene"
            @click="handleJump('cutscene-intro')"
          >
            {{ $t("hub.debug.presets.cutscene_intro") }}
          </button>

          <button
            type="button"
            class="btn-debug btn-debug-cutscene"
            @click="handleJump('cutscene-pre-1')"
          >
            {{ $t("hub.debug.presets.cutscene_pre_1") }}
          </button>

          <button
            type="button"
            class="btn-debug btn-debug-cutscene"
            @click="handleJump('cutscene-post-1')"
          >
            {{
              $t("hub.debug.presets.cutscene_post_1", { stars: selectedStars })
            }}
          </button>

          <button
            type="button"
            class="btn-debug btn-debug-cutscene"
            @click="handleJump('cutscene-pre-2')"
          >
            {{ $t("hub.debug.presets.cutscene_pre_2") }}
          </button>

          <button
            type="button"
            class="btn-debug btn-debug-highlight"
            :class="selectedShift === 'night' ? 'is-night' : 'is-day'"
            @click="handleJump('cutscene-post-2')"
          >
            {{
              selectedShift === "night"
                ? $t("hub.debug.presets.cutscene_post_2_night")
                : $t("hub.debug.presets.cutscene_post_2_day")
            }}
          </button>
        </div>
      </div>

      <!-- 3. Atalhos de Jogos e Telas -->
      <div class="debug-section">
        <h3 class="debug-section-title">
          {{ $t("hub.debug.games_title") }}
        </h3>
        <div class="debug-btn-list">
          <button
            type="button"
            class="btn-debug btn-debug-jump"
            @click="handleJump('screen-dashboard')"
          >
            {{ $t("hub.debug.presets.screen_dashboard") }}
          </button>

          <button
            type="button"
            class="btn-debug btn-debug-jump"
            @click="handleJump('game-stage-1')"
          >
            {{ $t("hub.debug.presets.game_stage_1") }}
          </button>

          <button
            type="button"
            class="btn-debug btn-debug-jump"
            @click="handleJump('game-stage-2')"
          >
            {{
              selectedShift === "night"
                ? $t("hub.debug.presets.game_stage_2_night")
                : $t("hub.debug.presets.game_stage_2_day")
            }}
          </button>

          <button
            type="button"
            class="btn-debug btn-debug-jump"
            @click="handleJump('game-stage-2-multi')"
          >
            {{ $t("hub.debug.presets.game_stage_2_multi") }}
          </button>

          <button
            type="button"
            class="btn-debug btn-debug-jump"
            @click="handleJump('game-stage-3')"
          >
            {{ $t("hub.debug.presets.game_stage_3") }}
          </button>

          <button
            type="button"
            class="btn-debug btn-debug-jump"
            @click="handleJump('screen-promotion')"
          >
            {{ $t("hub.debug.presets.screen_promotion") }}
          </button>
        </div>
      </div>

      <!-- 4. Reset Pinia / LocalStorage -->
      <button
        type="button"
        class="btn-debug btn-debug-reset"
        :title="$t('hub.debug.reset_title')"
        @click="resetProgress"
      >
        {{ $t("hub.debug.reset_label") }}
      </button>
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
  gap: 14px;
  padding: 14px 16px;
  background: rgba(15, 23, 42, 0.85);
  border: 1px dashed rgba(244, 63, 94, 0.55);
  border-radius: 12px;
  text-align: left;
}

.debug-header-row {
  display: flex;
  justify-content: center;
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

.debug-status-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(30, 41, 59, 0.85);
  border: 1px solid rgba(148, 163, 184, 0.25);
}

.debug-status-eyebrow {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #94a3b8;
}

.debug-active-shift {
  font-size: 0.84rem;
  font-weight: 700;
  padding: 6px 10px;
  border-radius: 7px;
  line-height: 1.3;
}

.debug-active-shift.is-night {
  background: rgba(128, 90, 213, 0.24);
  border: 1px solid rgba(167, 139, 250, 0.55);
  color: #ddd6fe;
}

.debug-active-shift.is-day {
  background: rgba(245, 158, 11, 0.2);
  border: 1px solid rgba(251, 191, 36, 0.55);
  color: #fef08a;
}

.debug-meta-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.debug-meta-pill {
  font-size: 0.72rem;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(148, 163, 184, 0.3);
  color: #cbd5e1;
}

.debug-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(148, 163, 184, 0.16);
}

.debug-section-title {
  margin: 0;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #e2e8f0;
}

.debug-control-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.debug-control-label {
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 600;
}

.debug-switch-row {
  display: flex;
  gap: 6px;
}

.debug-switch-btn {
  flex: 1;
  min-height: 38px;
  padding: 6px 10px;
  font-size: 0.8rem;
  font-weight: 700;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  background: rgba(30, 41, 59, 0.65);
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.15s ease;
}

.debug-switch-btn:hover {
  border-color: rgba(203, 213, 225, 0.6);
  color: #f8fafc;
}

.debug-switch-btn.is-selected-night {
  background: rgba(128, 90, 213, 0.32);
  border-color: #a78bfa;
  color: #f5f3ff;
  box-shadow: 0 0 0 1px rgba(167, 139, 250, 0.4);
}

.debug-switch-btn.is-selected-day {
  background: rgba(245, 158, 11, 0.28);
  border-color: #fbbf24;
  color: #fef9c3;
  box-shadow: 0 0 0 1px rgba(251, 191, 36, 0.4);
}

.debug-switch-btn.is-selected-star {
  background: rgba(14, 165, 233, 0.28);
  border-color: #38bdf8;
  color: #e0f2fe;
}

.debug-btn-list {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.btn-debug {
  width: 100%;
  min-height: 42px;
  padding: 9px 12px;
  font-size: 0.84rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s ease;
}

.btn-debug-cutscene {
  background: rgba(168, 85, 247, 0.14);
  border: 1px solid rgba(168, 85, 247, 0.4);
  color: #e9d5ff;
}

.btn-debug-cutscene:hover {
  background: rgba(168, 85, 247, 0.28);
  color: #fff;
}

.btn-debug-highlight.is-night {
  background: rgba(128, 90, 213, 0.28);
  border: 1.5px solid #a78bfa;
  color: #f5f3ff;
}

.btn-debug-highlight.is-night:hover {
  background: rgba(128, 90, 213, 0.42);
  color: #fff;
}

.btn-debug-highlight.is-day {
  background: rgba(245, 158, 11, 0.24);
  border: 1.5px solid #fbbf24;
  color: #fef9c3;
}

.btn-debug-highlight.is-day:hover {
  background: rgba(245, 158, 11, 0.38);
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

.btn-debug-reset {
  margin-top: 4px;
  text-align: center;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.45);
  color: #fca5a5;
}

.btn-debug-reset:hover {
  background: rgba(239, 68, 68, 0.3);
  color: #fff;
}

.debug-feedback {
  margin: 0;
  padding: 6px 10px;
  border-radius: 6px;
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.4);
  font-size: 0.8rem;
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
