<script setup>
import { onMounted, computed } from "vue";
import { useI18n } from "vue-i18n";
import { useGameSessionStore } from "../stores/gameSession";
import { useStoryStore } from "../stores/story";
import { useProgressionStore } from "../stores/progression";
import {
  STORY_STAGES,
  TASK_TAGS,
  calculateStageTotalPayout,
} from "../game/data/progressionConfig";
import PauseModal from "./ui/PauseModal.vue";
import PauseButton from "./ui/PauseButton.vue";
import assistantAvatar from "../assets/sprites/assistant_explaining.png";

defineEmits(["play"]);

const { t } = useI18n();
const session = useGameSessionStore();
const story = useStoryStore();
const progression = useProgressionStore();

onMounted(() => story.setPaused(false));

function quitDashboard() {
  story.setPaused(false);
  session.setActiveMode("menu");
}

const currentStage = computed(() => story.currentStage);
const stageNumber = computed(() => currentStage.value.stageNumber);
const stageTitle = computed(() => t(currentStage.value.titleKey));
const stageDescription = computed(() => t(currentStage.value.descriptionKey));
const stageTags = computed(() =>
  (currentStage.value.tags || [])
    .map((tagId) => TASK_TAGS[tagId])
    .filter(Boolean),
);
const stageTotalXp = computed(() =>
  calculateStageTotalPayout(currentStage.value),
);
const assistantName = computed(() => t("story.variables.assistantName"));

const stageSteps = computed(() =>
  STORY_STAGES.map((stage) => {
    const isCurrent = stage.id === currentStage.value.id;
    const isDone =
      !isCurrent &&
      (progression.completedStageIds.includes(stage.id) ||
        stage.stageNumber < stageNumber.value);
    const status = isCurrent ? "current" : isDone ? "done" : "upcoming";
    return {
      id: stage.id,
      number: stage.stageNumber,
      status,
    };
  }),
);
</script>

<template>
  <div class="dashboard-overlay">
    <PauseButton class="pause-btn-fixed" @click="story.setPaused(true)" />

    <PauseModal
      :isOpen="story.isPaused"
      :showRestart="false"
      @resume="story.setPaused(false)"
      @quit="quitDashboard"
    />

    <div class="backdrop"></div>

    <div class="os-window">
      <header class="window-header">
        <div class="window-controls">
          <span
            class="dot dot-red"
            :title="$t('story.dashboard.menu_title')"
            @click="story.setPaused(true)"
          ></span>
          <span class="dot dot-yellow"></span>
          <span class="dot dot-green"></span>
        </div>
        <div class="window-title">{{ $t("story.dashboard.window_title") }}</div>
      </header>

      <div class="window-body">
        <!-- Trilho minimalista de progressão linear -->
        <nav
          class="stage-stepper"
          :aria-label="$t('story.dashboard.stepper_aria')"
        >
          <ol class="stepper-track">
            <li
              v-for="(step, idx) in stageSteps"
              :key="step.id"
              class="stepper-item"
            >
              <span
                class="step-node"
                :class="`is-${step.status}`"
                :aria-label="
                  $t(`story.dashboard.step_status_${step.status}`, {
                    num: step.number,
                  })
                "
                :aria-current="step.status === 'current' ? 'step' : undefined"
              >
                {{ step.status === "done" ? "✓" : step.number }}
              </span>
              <span
                v-if="idx < stageSteps.length - 1"
                class="step-connector"
                :class="{ 'is-filled': idx < stageNumber - 1 }"
                aria-hidden="true"
              ></span>
            </li>
          </ol>
          <p class="stepper-caption">
            {{
              $t("story.dashboard.step_counter", {
                current: stageNumber,
                total: STORY_STAGES.length,
              })
            }}
          </p>
        </nav>

        <!-- Card único do Chamado Atual em formato de Pastinha do Windows -->
        <div class="folder-wrapper anim-fade-in">
          <div
            class="folder-tabs"
            :aria-label="$t('story.dashboard.folder_tabs_aria')"
          >
            <span class="folder-tab tab-ticket">
              {{ $t("story.dashboard.ticket_eyebrow", { num: stageNumber }) }}
            </span>

            <span
              v-for="tag in stageTags"
              :key="tag.id"
              class="folder-tab"
              :class="tag.bgClass"
            >
              {{ $t(tag.labelKey) }}
            </span>
          </div>

          <div class="folder-card">
            <div class="folder-sheet">
              <div class="mission-header">
                <h3 class="mission-title">{{ stageTitle }}</h3>
                <div class="mission-meta">
                  <span>
                    {{
                      $t("story.dashboard.task_goal", {
                        count: currentStage.targetChallengesCount,
                      })
                    }}
                  </span>
                  <span aria-hidden="true">&middot;</span>
                  <span class="meta-xp">
                    {{
                      $t("story.dashboard.reward_short", { xp: stageTotalXp })
                    }}
                  </span>
                </div>
              </div>

              <!-- Recado leve da Malu integrado à folha -->
              <div class="assistant-note">
                <div class="assistant-avatar">
                  <img
                    :src="assistantAvatar"
                    :alt="
                      $t('story.dashboard.assistant_alt', {
                        name: assistantName,
                      })
                    "
                    class="avatar-icon"
                  />
                </div>
                <div class="assistant-copy">
                  <span class="assistant-name">{{ assistantName }}</span>
                  <p class="assistant-message">{{ stageDescription }}</p>
                </div>
              </div>

              <div class="mission-action">
                <button
                  type="button"
                  class="btn-primary"
                  @click="$emit('play', currentStage.gameId)"
                >
                  <span class="btn-play-icon" aria-hidden="true">▶</span>
                  <span>{{ $t("story.dashboard.btn_start") }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── OVERLAY E JANELA PRINCIPAL (MOBILE-FIRST) ── */
.dashboard-overlay {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  z-index: 1000;
  font-family: var(--font-main);
}

.backdrop {
  position: absolute;
  inset: 0;
  background-color: rgba(16, 24, 32, 0.65);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

.pause-btn-fixed {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 1050;
}

.os-window {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 420px;
  max-height: 92vh;
  background-color: #f4f5f7;
  border-radius: 14px;
  border: 2px solid #cbd5e1;
  /* Sombra sólida sem blur */
  box-shadow: 0 8px 0 #1e293b;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.window-header {
  height: 40px;
  background: linear-gradient(to bottom, #ffffff 0%, #e2e8f0 100%);
  border-bottom: 2px solid #cbd5e1;
  display: flex;
  align-items: center;
  padding: 0 14px;
  position: relative;
  flex-shrink: 0;
}

.window-controls {
  display: flex;
  gap: 7px;
  align-items: center;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.dot-red {
  background-color: #ff5f56;
  border: 1px solid #e0443e;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.dot-red:hover {
  transform: scale(1.15);
}

.dot-yellow {
  background-color: #ffbd2e;
  border: 1px solid #dea123;
}

.dot-green {
  background-color: #27c93f;
  border: 1px solid #1aab29;
}

.window-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-family: var(--font-mono);
  font-size: 0.76rem;
  font-weight: 600;
  color: #334155;
  letter-spacing: 0.03em;
  white-space: nowrap;
  pointer-events: none;
}

.window-body {
  background-color: #f8fafc;
  padding: 1.15rem 1.15rem 1.4rem;
  overflow-y: auto;
  overscroll-behavior: contain;
  display: flex;
  flex-direction: column;
  gap: 1.05rem;
}

/* ── TRILHO MINIMALISTA DE PROGRESSÃO (STEPPER) ── */
.stage-stepper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.stepper-track {
  list-style: none;
  margin: 0;
  padding: 0;
  width: 100%;
  max-width: 260px;
  display: flex;
  align-items: center;
}

.stepper-item {
  display: flex;
  align-items: center;
  flex: 1;
}

.stepper-item:last-child {
  flex: 0 0 auto;
}

.step-node {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-family: var(--font-mono);
  font-size: 0.76rem;
  font-weight: 700;
  border: 2px solid #cbd5e1;
  background-color: #ffffff;
  color: #64748b;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease;
}

.step-node.is-done {
  background-color: #ccfbf1;
  border-color: #0d9488;
  color: #0f766e;
}

.step-node.is-current {
  background-color: #14b8a6;
  border-color: #0f766e;
  color: #ffffff;
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.22);
}

.step-node.is-upcoming {
  background-color: #f1f5f9;
  border-color: #cbd5e1;
  color: #94a3b8;
}

.step-connector {
  flex: 1;
  height: 2px;
  margin: 0 4px;
  background-color: #cbd5e1;
  border-radius: 2px;
}

.step-connector.is-filled {
  background-color: #14b8a6;
}

.stepper-caption {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.74rem;
  font-weight: 600;
  color: #475569;
  letter-spacing: 0.03em;
}

/* ── PASTA WINDOWS (FOCO ÚNICO COM ETIQUETAS NO TOPO) ── */
.folder-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.folder-tabs {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 4px;
  padding: 0 8px;
  margin-bottom: -2px;
  position: relative;
  z-index: 2;
}

.folder-tab {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 5px 10px 6px;
  border-radius: 8px 8px 0 0;
  border: 2px solid var(--folder-border, #ca8a04);
  border-bottom: none;
  background-color: var(--folder-tab-bg, #fde047);
  color: var(--folder-text, #422006);
  line-height: 1;
  white-space: nowrap;
}

.tab-ticket {
  background-color: var(--folder-bg, #fef08a);
  color: var(--folder-text, #422006);
  padding-top: 7px;
  font-weight: 800;
}

/* Variantes de etiquetas nas abas */
.folder-tab.tag-easy {
  background-color: #bbf7d0;
  color: #14532d;
  border-color: #16a34a;
}

.folder-tab.tag-medium {
  background-color: #fde68a;
  color: #78350f;
  border-color: #d97706;
}

.folder-tab.tag-hard {
  background-color: #fecaca;
  color: #7f1d1d;
  border-color: #dc2626;
}

.folder-tab.tag-special {
  background-color: #fef08a;
  color: #9a3412;
  border-color: #ea580c;
}

.folder-tab.tag-urgent {
  background-color: #fca5a5;
  color: #7f1d1d;
  border-color: #b91c1c;
}

/* Corpo principal da Pastinha Windows */
.folder-card {
  position: relative;
  z-index: 1;
  background-color: var(--folder-bg, #fef08a);
  border: 2px solid var(--folder-border, #ca8a04);
  border-radius: 10px;
  padding: 10px;
  box-shadow: 0 6px 0 var(--folder-shadow, #a16207);
}

/* Folha interna da pasta */
.folder-sheet {
  background-color: var(--folder-surface, #fffbeb);
  border: 1.5px solid #fde047;
  border-radius: 7px;
  padding: 16px 14px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.mission-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mission-title {
  margin: 0;
  font-family: var(--font-main);
  color: var(--folder-text, #422006);
  font-size: 1.15rem;
  font-weight: 700;
  line-height: 1.25;
}

.mission-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  font-family: var(--font-mono);
  font-size: 0.78rem;
  font-weight: 600;
  color: #78350f;
}

.meta-xp {
  color: #0f766e;
  font-weight: 700;
}

/* ── RECADO LEVE DA ASSISTENTE DENTRO DA FOLHA ── */
.assistant-note {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 9px 11px;
  background-color: rgba(255, 255, 255, 0.72);
  border: 1px solid #bae6fd;
  border-left: 3px solid #38bdf8;
  border-radius: 8px;
}

.assistant-avatar {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background-color: #ffffff;
  border: 1.5px solid #38bdf8;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-icon {
  width: 100%;
  height: 100%;
  object-fit: contain;
  image-rendering: pixelated;
}

.assistant-copy {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.assistant-name {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #0369a1;
}

.assistant-message {
  margin: 0;
  font-size: 0.88rem;
  line-height: 1.38;
  color: #1e293b;
}

/* ── CTA PRINCIPAL ── */
.mission-action {
  width: 100%;
}

.btn-primary {
  width: 100%;
  min-height: 52px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: var(--font-main);
  background-color: #14b8a6;
  color: #ffffff;
  border: 2px solid #0f766e;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
  font-size: 1.02rem;
  letter-spacing: 0.01em;
  box-shadow: 0 4px 0 #0f766e;
  transition:
    transform 0.12s ease,
    background-color 0.15s ease,
    box-shadow 0.12s ease;
}

.btn-primary:hover {
  background-color: #0d9488;
  transform: translateY(-1px);
  box-shadow: 0 5px 0 #0f766e;
}

.btn-primary:active {
  transform: translateY(3px);
  box-shadow: 0 1px 0 #0f766e;
}

.btn-play-icon {
  font-size: 0.82rem;
  line-height: 1;
}

/* ── ANIMAÇÕES ── */
.anim-fade-in {
  animation: fade-in 0.3s ease-out;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 400px) {
  .window-body {
    padding: 0.95rem 0.9rem 1.15rem;
    gap: 0.9rem;
  }

  .folder-tab {
    font-size: 0.64rem;
    padding: 4px 7px 5px;
  }

  .folder-sheet {
    padding: 14px 12px;
    gap: 12px;
  }

  .mission-title {
    font-size: 1.05rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .anim-fade-in,
  .step-node,
  .btn-primary,
  .dot-red {
    animation: none;
    transition: none;
  }
}
</style>
