<script setup>
import { onMounted, ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import { useGameSessionStore } from "../stores/gameSession";
import { useStoryStore } from "../stores/story";
import { STORY_STAGES, TASK_TAGS } from "../game/data/progressionConfig";
import PauseModal from "./ui/PauseModal.vue";
import PauseButton from "./ui/PauseButton.vue";
import lockIcon from "../assets/images/lock.svg";

const emit = defineEmits(["play"]);
const { t } = useI18n();
const session = useGameSessionStore();
const story = useStoryStore();

const showAssistant = ref(true);
const shakingFolderId = ref(null);

onMounted(() => story.setPaused(false));

function quitDashboard() {
  story.setPaused(false);
  session.setActiveMode("menu");
}

function getSpriteUrl(char, emotion) {
  return new URL(
    `../assets/sprites/${char}_${emotion || "neutral"}.png`,
    import.meta.url,
  ).href;
}

const currentStage = computed(() => story.currentStage);

const stageNumber = computed(() => currentStage.value?.stageNumber || 1);

const stageTitle = computed(() => {
  const key = currentStage.value?.titleKey;
  return key ? t(key) : "Padrões Corrompidos";
});

const stageDescription = computed(() => {
  const key = currentStage.value?.descriptionKey;
  return key ? t(key) : "Restaure a integridade dos padrões geométricos.";
});

const stageTags = computed(() => {
  const tags = currentStage.value?.tags || [];
  return tags.map((tagId) => TASK_TAGS[tagId]).filter(Boolean);
});

/**
 * Lista híbrida de pastas bloqueadas:
 * 1. A próxima etapa real de STORY_STAGES (se existir) para continuidade de progressão.
 * 2. 1 pasta de Easter Egg confidencial no final da fila.
 */
const lockedFolders = computed(() => {
  const items = [];

  const nextRealStage = STORY_STAGES.find(
    (s) => s.stageNumber === stageNumber.value + 1,
  );

  if (nextRealStage) {
    const resolvedTags = (nextRealStage.tags || [])
      .map((tagId) => TASK_TAGS[tagId])
      .filter(Boolean)
      .map((tag) => t(tag.labelKey));

    items.push({
      id: nextRealStage.id,
      levelLabel: t("story.dashboard.level_badge", {
        num: nextRealStage.stageNumber,
      }),
      tags: resolvedTags,
      goalLabel: t("story.dashboard.task_goal", {
        count: nextRealStage.targetChallengesCount,
      }),
      eyebrow: t("story.dashboard.ticket_eyebrow", {
        num: nextRealStage.stageNumber,
      }),
      title: t(nextRealStage.titleKey),
    });
  }

  // Easter Egg Confidencial no final da fila
  items.push({
    id: "easter-egg-99",
    levelLabel: t("story.dashboard.easter_egg.level"),
    tags: [t("story.dashboard.easter_egg.tag_secret")],
    goalLabel: t("story.dashboard.easter_egg.tag_goal"),
    eyebrow: t("story.dashboard.easter_egg.eyebrow"),
    title: t("story.dashboard.easter_egg.title"),
  });

  return items;
});

function triggerLockedShake(folderId) {
  shakingFolderId.value = folderId;
  setTimeout(() => {
    if (shakingFolderId.value === folderId) {
      shakingFolderId.value = null;
    }
  }, 400);
}
</script>

<template>
  <div class="dashboard-overlay">
    <PauseButton class="pause-btn-fixed" @click="story.setPaused(true)" />

    <PauseModal
      :isOpen="story.isPaused"
      @resume="story.setPaused(false)"
      @quit="quitDashboard"
      :showRestart="false"
    />

    <div class="backdrop"></div>

    <div class="os-window">
      <header class="window-header">
        <div class="window-controls">
          <span
            class="dot dot-red"
            @click="story.setPaused(true)"
            title="Menu"
          ></span>
          <span class="dot dot-yellow"></span>
          <span class="dot dot-green"></span>
        </div>
        <div class="window-title">{{ $t("story.dashboard.window_title") }}</div>
      </header>

      <div class="window-body">
        <div class="assistant-chat-bubble anim-fade-in" v-if="showAssistant">
          <button
            class="btn-close"
            @click="showAssistant = false"
            title="Dispensar"
          >
            &times;
          </button>

          <div class="avatar-container anim-bounce">
            <img
              :src="getSpriteUrl('assistant', 'explaining')"
              class="avatar-icon"
              alt="Assistente"
            />
          </div>

          <span class="sender-name">{{
            $t("story.dashboard.assistant_sender")
          }}</span>
          <div class="text-content">
            {{ stageDescription }}
          </div>
        </div>

        <!-- Card do Chamado Atual em formato de Pastinha do Windows -->
        <div class="folder-wrapper">
          <!-- Abas / Etiquetas Superiores da Pasta -->
          <div class="folder-tabs" aria-label="Informações do chamado">
            <span class="folder-tab tab-level">
              {{ $t("story.dashboard.level_badge", { num: stageNumber }) }}
            </span>

            <span
              v-for="tag in stageTags"
              :key="tag.id"
              class="folder-tab"
              :class="tag.bgClass"
            >
              {{ $t(tag.labelKey) }}
            </span>

            <span class="folder-tab tab-goal">
              {{
                $t("story.dashboard.task_goal", {
                  count: currentStage.targetChallengesCount,
                })
              }}
            </span>
          </div>

          <!-- Corpo da Pasta Windows -->
          <div class="folder-card">
            <div class="folder-sheet">
              <div class="folder-main">
                <div class="mission-icon-placeholder" aria-hidden="true"></div>

                <div class="mission-info">
                  <span class="mission-eyebrow">{{
                    $t("story.dashboard.ticket_eyebrow", { num: stageNumber })
                  }}</span>
                  <h3>{{ stageTitle }}</h3>
                </div>
              </div>

              <div class="mission-action">
                <button
                  class="btn-primary"
                  @click="$emit('play', currentStage.gameId)"
                >
                  {{ $t("story.dashboard.btn_start") }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Lista de Próximas Pastas Bloqueadas (P&B Compactas com Cadeado) -->
        <div
          class="locked-folders-list"
          aria-label="Próximos chamados bloqueados"
        >
          <div
            v-for="locked in lockedFolders"
            :key="locked.id"
            class="folder-wrapper folder-wrapper--locked"
            :class="{ 'anim-shake': shakingFolderId === locked.id }"
            @click="triggerLockedShake(locked.id)"
            role="button"
            tabindex="0"
            :aria-label="`${locked.title} - ${$t('story.dashboard.locked_label')}`"
          >
            <!-- Abas em P&B -->
            <div class="folder-tabs">
              <span class="folder-tab tab-locked-level">
                {{ locked.levelLabel }}
              </span>

              <span
                v-for="(tagLabel, idx) in locked.tags"
                :key="idx"
                class="folder-tab tab-locked-meta"
              >
                {{ tagLabel }}
              </span>

              <span class="folder-tab tab-locked-meta">
                {{ locked.goalLabel }}
              </span>
            </div>

            <!-- Corpo Compacto em P&B (sem o botão de ação) -->
            <div class="folder-card folder-card--locked">
              <div class="folder-sheet folder-sheet--locked">
                <div class="folder-main">
                  <div
                    class="mission-icon-placeholder mission-icon--locked"
                    aria-hidden="true"
                  ></div>

                  <div class="mission-info">
                    <span class="mission-eyebrow mission-eyebrow--locked">{{
                      locked.eyebrow
                    }}</span>
                    <h3>{{ locked.title }}</h3>
                  </div>
                </div>
              </div>

              <!-- Overlay com Sprite de Cadeado -->
              <div class="locked-overlay" aria-hidden="true">
                <div class="lock-badge">
                  <img :src="lockIcon" alt="" class="lock-sprite" />
                  <span class="lock-text">{{
                    $t("story.dashboard.locked_label")
                  }}</span>
                </div>
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
  max-width: 440px;
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
  padding: 1.25rem 1.15rem 1.4rem;
  overflow-y: auto;
  overscroll-behavior: contain;
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
}

/* ── BALÃO DA ASSISTENTE ── */
.assistant-chat-bubble {
  position: relative;
  background-color: #ebf8ff;
  border: 2px solid #90cdf4;
  border-left: 5px solid #3182ce;
  border-radius: 12px;
  border-bottom-left-radius: 2px;
  padding: 12px 30px 12px 12px;
  margin-left: 16px;
  margin-top: 6px;
  /* Sombra sólida sem blur */
  box-shadow: 0 4px 0 #bee3f8;
}

.assistant-chat-bubble::after {
  content: "";
  display: table;
  clear: both;
}

.btn-close {
  position: absolute;
  top: 6px;
  right: 10px;
  background: none;
  border: none;
  font-size: 1.35rem;
  color: #64748b;
  cursor: pointer;
  line-height: 1;
}

.btn-close:hover {
  color: #e53e3e;
}

.avatar-container {
  float: left;
  width: 52px;
  height: 52px;
  margin-top: -16px;
  margin-left: -26px;
  margin-right: 10px;
  margin-bottom: 4px;
  background-color: #ffffff;
  border-radius: 50%;
  border: 2px solid #3182ce;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 3px 0 #90cdf4;
  position: relative;
  z-index: 2;
}

.avatar-icon {
  width: 100%;
  height: 100%;
  object-fit: contain;
  image-rendering: pixelated;
}

.sender-name {
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #2b6cb0;
  display: block;
  margin-bottom: 3px;
  line-height: 1.2;
}

.text-content {
  font-family: var(--font-main);
  color: #1e293b;
  font-size: 0.94rem;
  line-height: 1.4;
  display: block;
}

/* ── PASTA WINDOWS (FOLDER CARD COM ETIQUETAS NO TOPO) ── */
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
  padding-left: 8px;
  padding-right: 8px;
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

/* Aba principal do Nível */
.tab-level {
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

.tab-goal {
  background-color: #e0f2fe;
  color: #0c4a6e;
  border-color: #0284c7;
}

/* Corpo principal da Pastinha Windows */
.folder-card {
  position: relative;
  z-index: 1;
  background-color: var(--folder-bg, #fef08a);
  border: 2px solid var(--folder-border, #ca8a04);
  border-radius: 10px;
  padding: 10px;
  /* Sombra sólida (hard shadow sem blur) */
  box-shadow: 0 6px 0 var(--folder-shadow, #a16207);
}

/* Folha interna da pasta */
.folder-sheet {
  background-color: var(--folder-surface, #fffbeb);
  border: 1.5px solid #fde047;
  border-radius: 7px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.folder-main {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mission-icon-placeholder {
  width: 58px;
  height: 58px;
  flex-shrink: 0;
  border-radius: 10px;
  background-color: #38bdf8;
  border: 2px solid #0284c7;
  box-shadow: 0 3px 0 #0369a1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mission-icon-placeholder::after {
  content: "DOC";
  font-family: var(--font-mono);
  color: #ffffff;
  font-weight: 700;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
}

.mission-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mission-eyebrow {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 600;
  color: var(--folder-shadow, #a16207);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.mission-info h3 {
  margin: 0;
  font-family: var(--font-main);
  color: var(--folder-text, #422006);
  font-size: 1.08rem;
  font-weight: 700;
  line-height: 1.25;
}

.mission-action {
  width: 100%;
}

.btn-primary {
  width: 100%;
  font-family: var(--font-main);
  background-color: #14b8a6;
  color: #ffffff;
  border: 2px solid #0f766e;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
  font-size: 1rem;
  letter-spacing: 0.01em;
  /* Sombra sólida sem blur */
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

/* ── PASTAS BLOQUEADAS EM P&B (COMPACTAS COM CADEADO) ── */
.locked-folders-list {
  display: flex;
  flex-direction: column;
  gap: 0.95rem;
}

.folder-wrapper--locked {
  cursor: not-allowed;
  user-select: none;
  opacity: 0.88;
  transition: opacity 0.15s ease;
}

.folder-wrapper--locked:hover {
  opacity: 0.96;
}

.tab-locked-level {
  background-color: #cbd5e1;
  color: #334155;
  border-color: #64748b;
  padding-top: 6px;
}

.tab-locked-meta {
  background-color: #e2e8f0;
  color: #475569;
  border-color: #64748b;
}

.folder-card--locked {
  background-color: #cbd5e1;
  border-color: #64748b;
  box-shadow: 0 5px 0 #475569;
  padding: 8px;
  overflow: hidden;
}

.folder-sheet--locked {
  background-color: #f1f5f9;
  border-color: #cbd5e1;
  padding: 10px 12px;
  filter: grayscale(1);
}

.mission-icon--locked {
  width: 44px;
  height: 44px;
  background-color: #94a3b8;
  border-color: #475569;
  box-shadow: 0 2px 0 #334155;
}

.mission-eyebrow--locked {
  color: #64748b;
}

.folder-sheet--locked .mission-info h3 {
  color: #475569;
  font-size: 0.95rem;
}

.locked-overlay {
  position: absolute;
  inset: 0;
  background-color: rgba(15, 23, 42, 0.18);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 14px;
  pointer-events: none;
}

.lock-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background-color: #f8fafc;
  border: 2px solid #1e293b;
  border-radius: 8px;
  padding: 5px 10px;
  box-shadow: 0 3px 0 #1e293b;
}

.lock-sprite {
  width: 22px;
  height: 22px;
  object-fit: contain;
  display: block;
}

.lock-text {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: 0.06em;
}

/* ── ANIMAÇÕES ── */
.anim-fade-in {
  animation: fade-in 0.35s ease-out;
}

.anim-bounce {
  animation: pop-in 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.anim-shake {
  animation: locked-shake 0.35s ease-in-out;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pop-in {
  from {
    transform: scale(0.6);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes locked-shake {
  0%,
  100% {
    transform: translateX(0);
  }
  20% {
    transform: translateX(-5px);
  }
  40% {
    transform: translateX(5px);
  }
  60% {
    transform: translateX(-3px);
  }
  80% {
    transform: translateX(3px);
  }
}

@media (max-width: 400px) {
  .window-body {
    padding: 1rem 0.9rem 1.2rem;
  }

  .folder-tab {
    font-size: 0.64rem;
    padding: 4px 7px 5px;
  }

  .mission-icon-placeholder {
    width: 50px;
    height: 50px;
  }

  .mission-icon--locked {
    width: 40px;
    height: 40px;
  }

  .mission-info h3 {
    font-size: 0.98rem;
  }

  .lock-badge {
    padding: 4px 8px;
  }

  .lock-text {
    font-size: 0.62rem;
  }
}
</style>
