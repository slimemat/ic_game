<script setup>
import { computed, ref, watch } from "vue";
import { useGameSessionStore } from "./stores/gameSession";
import { useStoryStore, STORY_CHECKPOINTS } from "./stores/story";
import { scenes } from "./data/dialogues";
import HubShell from "./components/HubShell.vue";
import Home from "./components/Home.vue";
import GameSelection from "./components/GameSelection.vue";
import TestGame from "./components/TestGame.vue";
import PatternRecognitionGame from "./components/PatternRecognitionGame.vue";
import MatrixMirrorGame from "./components/MatrixMirrorGame.vue";
import CharadeGame from "./components/CharadeGame.vue";
import StoryMode from "./components/StoryMode.vue";
import StoryDashboard from "./components/StoryDashboard.vue";
import PromotionModal from "./components/ui/PromotionModal.vue";

const session = useGameSessionStore();
const story = useStoryStore();

/**
 * Top-level navigation state.
 *
 * 'main-menu'       → HubShell entry screen (abas do Hub)
 * 'story'           → Modo História: cutscene inicial / Painel de Chamados
 * 'dialogue'        → Modo História: cutscene de introdução da tarefa
 * 'post-cutscene'   → Modo História: cutscene de conclusão da etapa
 * 'promotion'       → Modo História: tela/modal de promoção
 * 'home'            → existing Home / hub screen
 * 'selection'       → GameSelection component
 * <game-id>         → a specific mini-game
 *
 * No Modo História a tela é derivada de `story.checkpoint`.
 */
const activeScreen = ref("main-menu");

/** Cena da cutscene ativa (vem de story.activeCutsceneId). */
const activeCutsceneSceneId = computed(() => story.activeCutsceneId || "intro");

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
    case STORY_CHECKPOINTS.POST_STAGE_CUTSCENE:
      activeScreen.value = "post-cutscene";
      break;
    case STORY_CHECKPOINTS.PROMOTION:
      activeScreen.value = "promotion";
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
 * Se existir a cena no diálogo, toca o briefing antes do jogo.
 */
function startTask(gameId) {
  const introScene = story.currentStage?.introCutsceneId || `pre-${gameId}`;
  story.startTask(gameId, { withBriefing: Boolean(scenes[introScene]) });
}

/** Abre um mini-jogo escolhido nas abas do Hub (Desafios / Início). */
function playGame(gameId) {
  activeScreen.value = gameId;
}
</script>

<template>
  <!-- ── Main Menu ─────────────────────────────────────────────────────── -->
  <HubShell
    v-if="activeScreen === 'main-menu'"
    @mode-selected="() => {}"
    @play="playGame"
  />

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
    :key="'task-intro-' + activeCutsceneSceneId"
    :sceneId="activeCutsceneSceneId"
    @finished="story.advanceCheckpoint(STORY_CHECKPOINTS.MINIGAME)"
    @quit="goToMenu"
  />

  <!-- ── Cutscene de conclusão da etapa ────────────────────────────────── -->
  <StoryMode
    v-else-if="activeScreen === 'post-cutscene'"
    :key="'post-stage-' + activeCutsceneSceneId"
    :sceneId="activeCutsceneSceneId"
    @finished="story.finishPostStageCutscene()"
    @quit="goToMenu"
  />

  <!-- ── Promoção de Cargo ─────────────────────────────────────────────── -->
  <template v-else-if="activeScreen === 'promotion'">
    <StoryDashboard @play="startTask" />
    <PromotionModal :isOpen="true" @continue="story.finishPromotion()" />
  </template>

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
