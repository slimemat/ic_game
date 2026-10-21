<script setup>
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { useGameSessionStore } from "../stores/gameSession";
import { useStoryStore, STORY_CHECKPOINTS } from "../stores/story";
import { useProgressionStore } from "../stores/progression";
import spritePaint from "../assets/images/spritepaint.png";
import RestPanel from "./ui/RestPanel.vue";
import { useRestSummary } from "../composables/useRestSummary";

const { summary } = useRestSummary();

const { t } = useI18n();
const session = useGameSessionStore();
const story = useStoryStore();
const progression = useProgressionStore();

const emit = defineEmits(["mode-selected"]);

const debugMessage = ref("");
let debugMsgTimeout = null;

function selectMode(mode) {
  session.setActiveMode(mode);
  emit("mode-selected", mode);
}

function flashDebugMessage(msg) {
  if (debugMsgTimeout) clearTimeout(debugMsgTimeout);
  debugMessage.value = msg;
  debugMsgTimeout = setTimeout(() => {
    debugMessage.value = "";
  }, 4000);
}

function handleResetProgress() {
  story.resetProgress();
  progression.resetProgression();
  try {
    localStorage.removeItem("ic_game:story-progress");
    localStorage.removeItem("ic_game:career-progression");
  } catch (e) {
    console.warn(e);
  }
  flashDebugMessage(
    "✓ Progresso do Pinia & LocalStorage resetado com sucesso!",
  );
}

function handlePlayStage2Directly() {
  // Configura a store para o início da Etapa 2
  progression.totalXp = 350;
  progression.completedStages = ["stage-1-intern-onboarding"];
  progression.saveProgression();

  story.currentStageId = "stage-2-corrupted-archives";
  story.completedTasks = ["stage-1-intern-onboarding"];
  story.currentPatternCount = 0;
  story.startTask("stage-2-corrupted-archives", { withBriefing: false });
  story.advanceCheckpoint(STORY_CHECKPOINTS.MINIGAME);

  flashDebugMessage(
    "⚡ Iniciando Etapa 2 com os novos jogos de transformação!",
  );
  selectMode("story");
}
</script>

<template>
  <main class="main-menu">
    <div class="menu-content">
      <!-- Header -->
      <header class="menu-header">
        <h1 class="menu-title">{{ $t("mainMenu.title") }}</h1>
        <p class="menu-subtitle">{{ $t("mainMenu.subtitle") }}</p>
        <p v-if="session.playerName" class="player-info">
          {{ session.playerName }} &mdash;
          {{ $t("mainMenu.level_label") }}
          <span class="level-badge">{{ session.currentLevel }}</span>
        </p>
      </header>

      <RestPanel :summary="summary" @continue="selectMode('story')" />

      <!-- CTA buttons -->
      <nav class="menu-actions" :aria-label="$t('mainMenu.nav_aria_label')">
        <button
          class="btn-mode"
          :class="{ 'btn-mode--active': session.activeMode === 'story' }"
          @click="selectMode('story')"
        >
          <img
            :src="spritePaint"
            alt=""
            aria-hidden="true"
            class="btn-icon-img"
          />
          {{ $t("mainMenu.buttons.story_mode") }}
        </button>

        <button
          class="btn-mode"
          :class="{ 'btn-mode--active': session.activeMode === 'level-select' }"
          @click="selectMode('level-select')"
        >
          <img
            :src="spritePaint"
            alt=""
            aria-hidden="true"
            class="btn-icon-img"
          />
          {{ $t("mainMenu.buttons.level_select") }}
        </button>
      </nav>

      <!-- Selection feedback -->
      <Transition name="fade">
        <p v-if="session.activeMode !== 'menu'" class="active-mode-label">
          {{
            session.activeMode === "story"
              ? $t("mainMenu.active_mode.story")
              : $t("mainMenu.active_mode.level_select")
          }}
        </p>
      </Transition>

      <!-- Painel de Debug -->
      <section class="debug-panel" aria-label="Ferramentas de Debug">
        <div class="debug-header">
          <span class="debug-badge">PAINEL DEBUG DEV</span>
        </div>

        <div class="debug-buttons">
          <button
            class="btn-debug btn-debug-reset"
            title="Zera o progresso de todas as stores do Pinia e LocalStorage"
            @click="handleResetProgress"
          >
            🗑️ Resetar Progresso Pinia / Storage
          </button>

          <button
            class="btn-debug btn-debug-jump"
            title="Avança direto para a Etapa 2 com os novos jogos de transformação"
            @click="handlePlayStage2Directly"
          >
            ⚡ Jogar Novos Jogos (Etapa 2 Direto)
          </button>
        </div>

        <Transition name="fade">
          <p v-if="debugMessage" class="debug-feedback">
            {{ debugMessage }}
          </p>
        </Transition>
      </section>
    </div>
  </main>
</template>

<style scoped>
.main-menu {
  flex: 1;
  min-height: 0;
  display: flex;
  justify-content: center;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: max(clamp(16px, 5vw, 48px), env(safe-area-inset-top))
    max(clamp(16px, 5vw, 48px), env(safe-area-inset-right))
    max(clamp(16px, 5vw, 48px), env(safe-area-inset-bottom))
    max(clamp(16px, 5vw, 48px), env(safe-area-inset-left));
}

.menu-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  width: 100%;
  max-width: 480px;
  margin: auto 0;
}

.menu-header {
  text-align: center;
}

.menu-title {
  font-size: clamp(2.4rem, 9vw, 4rem);
  margin: 0 0 8px;
  letter-spacing: -0.02em;
}

.menu-subtitle {
  margin: 0;
  color: var(--background-light, #94a3b8);
  font-size: 1rem;
}

.player-info {
  margin: 12px 0 0;
  font-size: 0.9rem;
  color: var(--background-light, #94a3b8);
}

.level-badge {
  color: var(--accent-color, #38bdf8);
  font-weight: 700;
}

.menu-actions {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.btn-mode {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  padding: 20px 24px;
  border-radius: 12px;
  min-height: 56px;
  font-size: 1.15rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 0.1s ease,
    background-color 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
  border: 2px solid var(--light-green, #4ade80);
  background: transparent;
  color: var(--light-green, #4ade80);
}

.btn-mode:hover {
  background: rgba(74, 222, 128, 0.08);
  box-shadow: 0 0 0 4px rgba(74, 222, 128, 0.15);
}

.btn-mode:active {
  transform: scale(0.97);
}

.btn-mode--active {
  background: var(--accent-color, #38bdf8);
  border-color: var(--accent-color, #38bdf8);
  color: #fff;
  box-shadow: 0 4px 20px rgba(56, 189, 248, 0.35);
}

.btn-mode--active:hover {
  box-shadow: 0 4px 24px rgba(56, 189, 248, 0.5);
}

/* Placeholder icon image — constrained so it doesn't blow up the button */
.btn-icon-img {
  width: 28px;
  height: 28px;
  object-fit: contain;
  /* Tint to match button color when inactive */
  filter: brightness(0) saturate(100%) invert(72%) sepia(47%) saturate(400%)
    hue-rotate(83deg) brightness(103%) contrast(92%);
  transition: filter 0.2s ease;
}

/* Remove the tint when button is active (white label context) */
.btn-mode--active .btn-icon-img {
  filter: brightness(0) invert(1);
}

.active-mode-label {
  margin: 0;
  font-size: 0.875rem;
  color: var(--medium-green, #86efac);
  font-style: italic;
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

/* Debug Dev Panel */
.debug-panel {
  width: 100%;
  margin-top: 10px;
  padding: 14px 16px;
  background: rgba(15, 23, 42, 0.75);
  border: 1px dashed rgba(244, 63, 94, 0.5);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.debug-header {
  display: flex;
  align-items: center;
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

.debug-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.btn-debug {
  padding: 10px 14px;
  font-size: 0.88rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.btn-debug-reset {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.45);
  color: #fca5a5;
}

.btn-debug-reset:hover {
  background: rgba(239, 68, 68, 0.3);
  border-color: #ef4444;
  color: #ffffff;
}

.btn-debug-jump {
  background: rgba(56, 189, 248, 0.15);
  border: 1px solid rgba(56, 189, 248, 0.45);
  color: #7dd3fc;
}

.btn-debug-jump:hover {
  background: rgba(56, 189, 248, 0.3);
  border-color: #38bdf8;
  color: #ffffff;
}

.debug-feedback {
  margin: 0;
  font-size: 0.82rem;
  color: #4ade80;
  font-weight: 600;
  text-align: center;
}
</style>
