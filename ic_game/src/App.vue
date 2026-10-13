<script setup>
import { computed, ref, watch } from "vue";
import { useGameSessionStore } from "./stores/gameSession";
import { useStoryStore, STORY_CHECKPOINTS } from "./stores/story";
import { scenes } from "./data/dialogues";
import MainMenu from "./components/MainMenu.vue";
import Home from "./components/Home.vue";
import GameSelection from "./components/GameSelection.vue";
import TestGame from "./components/TestGame.vue";
import PatternRecognitionGame from "./components/PatternRecognitionGame.vue";
import MatrixMirrorGame from "./components/MatrixMirrorGame.vue";
import CharadeGame from "./components/CharadeGame.vue";
import StoryMode from "./components/StoryMode.vue";
import StoryDashboard from "./components/StoryDashboard.vue";

const session = useGameSessionStore();
const story = useStoryStore();

/**
 * Top-level navigation state.
 *
 * 'main-menu'       → MainMenu entry screen
 * 'story'           → Modo História: cutscene inicial / Painel de Chamados
 * 'dialogue'        → Modo História: cutscene de introdução da tarefa
 * 'home'            → existing Home / hub screen
 * 'selection'       → GameSelection component
 * <game-id>         → a specific mini-game
 *
 * No Modo História a tela é derivada de `story.checkpoint`.
 */
const activeScreen = ref("main-menu");

/** Cena da cutscene de introdução da tarefa ativa (padrão: pre-<tarefaId>). */
const taskIntroSceneId = computed(() => `pre-${story.activeTaskId}`);

/** Converte o checkpoint salvo na tela correspondente. */
function syncScreenWithCheckpoint() {
  switch (story.checkpoint) {
    case STORY_CHECKPOINTS.INTRO_CUTSCENE:
    case STORY_CHECKPOINTS.DASHBOARD:
      activeScreen.value = "story";
      break;
    case STORY_CHECKPOINTS.TASK_INTRO_CUTSCENE:
      activeScreen.value = story.activeTaskId ? "dialogue" : "story";
      break;
    case STORY_CHECKPOINTS.MINIGAME:
      if (story.activeTaskId) {
        activeScreen.value = story.activeTaskId;
      } else {
        // Save inconsistente: volta ao painel
        story.advanceCheckpoint(STORY_CHECKPOINTS.DASHBOARD);
      }
      break;
  }
}

/**
 * Keep activeScreen in sync whenever the Pinia activeMode changes.
 * Entrar no Modo História retoma o último checkpoint salvo.
 */
watch(
  () => session.activeMode,
  (mode) => {
    if (mode === "story") {
      syncScreenWithCheckpoint();
    } else if (mode === "level-select") {
      activeScreen.value = "home";
    } else if (mode === "menu") {
      activeScreen.value = "main-menu";
    }
  },
);

/** Qualquer avanço de checkpoint durante o Modo História troca de tela. */
watch(
  () => [story.checkpoint, story.activeTaskId],
  () => {
    if (session.activeMode === "story") syncScreenWithCheckpoint();
  },
);

/** Navigate back to the main menu and reset the store mode. */
function goToMenu() {
  session.setActiveMode("menu");
  activeScreen.value = "main-menu";
}

/**
 * Inicia uma tarefa pelo Painel de Chamados.
 * Se existir a cena "pre-<gameId>", toca o briefing antes do jogo.
 */
function startTask(gameId) {
  story.startTask(gameId, { withBriefing: Boolean(scenes[`pre-${gameId}`]) });
}
</script>

<template>
  <!-- ── Main Menu ─────────────────────────────────────────────────────── -->
  <MainMenu v-if="activeScreen === 'main-menu'" @mode-selected="() => {}" />

  <!-- ── Modo História: cutscene inicial + Painel de Chamados (overlay) ── -->
  <template v-else-if="activeScreen === 'story'">
    <!-- Fora do checkpoint da cutscene fica só como pano de fundo (sem replay) -->
    <StoryMode
      sceneId="intro"
      :interactive="story.checkpoint === STORY_CHECKPOINTS.INTRO_CUTSCENE"
      @finished="story.advanceCheckpoint(STORY_CHECKPOINTS.DASHBOARD)"
      @quit="goToMenu"
    />
    <StoryDashboard
      v-if="story.checkpoint === STORY_CHECKPOINTS.DASHBOARD"
      @play="startTask"
    />
  </template>

  <!-- ── Cutscene de introdução da tarefa ──────────────────────────────── -->
  <StoryMode
    v-else-if="activeScreen === 'dialogue'"
    :key="taskIntroSceneId"
    :sceneId="taskIntroSceneId"
    @finished="story.advanceCheckpoint(STORY_CHECKPOINTS.MINIGAME)"
    @quit="goToMenu"
  />

  <!-- ── Existing Hub flow ──────────────────────────────────────────────── -->
  <Home
    v-else-if="activeScreen === 'home'"
    @play="activeScreen = $event"
    @choose-games="activeScreen = 'selection'"
    @back="goToMenu()"
  />
  <GameSelection
    v-else-if="activeScreen === 'selection'"
    @select="activeScreen = $event"
    @back="activeScreen = 'home'"
  />
  <TestGame
    v-else-if="activeScreen === 'test-platformer'"
    @back="goToMenu()"
    @quit="goToMenu()"
  />
  <PatternRecognitionGame
    v-else-if="activeScreen === 'pattern-recognition'"
    :story-mode="session.activeMode === 'story'"
    @back="goToMenu()"
    @quit="goToMenu()"
  />
  <MatrixMirrorGame
    v-else-if="activeScreen === 'matrix-mirror'"
    @back="goToMenu()"
    @quit="goToMenu()"
  />
  <CharadeGame
    v-else-if="activeScreen === 'charade-game'"
    @back="goToMenu()"
    @quit="goToMenu()"
  />

  <!-- ── Fallback ───────────────────────────────────────────────────────── -->
  <div v-else class="game-not-found">
    <h2>Jogo em desenvolvimento</h2>
    <button class="btn-primary" @click="goToMenu()">Voltar ao Menu</button>
  </div>
</template>
