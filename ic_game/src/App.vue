<script setup>
import { ref, watch } from "vue";
import { useGameSessionStore } from "./stores/gameSession";
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

/**
 * Top-level navigation state.
 *
 * 'main-menu'       → MainMenu entry screen
 * 'story'           → Story Mode (cena de abertura "intro")
 * 'story-dashboard' → Painel de Chamados sobre a cena de abertura
 * 'dialogue'        → StoryMode reutilizado para outras cenas (ver `dialogue`)
 * 'home'            → existing Home / hub screen
 * 'selection'       → GameSelection component
 * <game-id>         → a specific mini-game
 */
const activeScreen = ref("main-menu");

/**
 * Estado da tela de diálogo genérica.
 *   sceneId – cena em src/data/dialogues
 *   next    – tela para onde ir quando a cena terminar
 */
const dialogue = ref({ sceneId: null, next: null });

/**
 * Keep activeScreen in sync whenever the Pinia activeMode changes.
 * This means any part of the app can navigate by calling
 * session.setActiveMode('story'), and App.vue reacts automatically.
 */
watch(
  () => session.activeMode,
  (mode) => {
    if (mode === "story") {
      activeScreen.value = "story";
    } else if (mode === "story-dashboard") {
      activeScreen.value = "story-dashboard";
    } else if (mode === "level-select") {
      activeScreen.value = "home";
    } else if (mode === "menu") {
      activeScreen.value = "main-menu";
    }
  },
);

/** Navigate back to the main menu and reset the store mode. */
function goToMenu() {
  session.setActiveMode("menu");
  activeScreen.value = "main-menu";
}

/** Abre o StoryMode com uma cena e define a tela seguinte. */
function startDialogue(sceneId, next) {
  dialogue.value = { sceneId, next };
  activeScreen.value = "dialogue";
}

/** Fim da cena: segue para a tela definida em startDialogue. */
function onDialogueFinished() {
  activeScreen.value = dialogue.value.next;
}

/**
 * Inicia um jogo pelo Modo História.
 * Se existir a cena "pre-<gameId>", toca o briefing antes do jogo.
 */
function playWithBriefing(gameId) {
  const sceneId = `pre-${gameId}`;
  if (scenes[sceneId]) {
    startDialogue(sceneId, gameId);
  } else {
    activeScreen.value = gameId;
  }
}
</script>

<template>
  <!-- ── Main Menu ─────────────────────────────────────────────────────── -->
  <MainMenu v-if="activeScreen === 'main-menu'" @mode-selected="() => {}" />

  <!-- ── Modo História: cena de abertura + Painel de Chamados (overlay) ── -->
  <template
    v-else-if="activeScreen === 'story' || activeScreen === 'story-dashboard'"
  >
    <StoryMode
      sceneId="intro"
      @finished="session.setActiveMode('story-dashboard')"
      @quit="goToMenu"
    />
    <StoryDashboard
      v-if="activeScreen === 'story-dashboard'"
      @play="playWithBriefing"
    />
  </template>

  <!-- ── Diálogo genérico (ex.: briefing antes de um desafio) ──────────── -->
  <StoryMode
    v-else-if="activeScreen === 'dialogue'"
    :key="dialogue.sceneId"
    :sceneId="dialogue.sceneId"
    @finished="onDialogueFinished"
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
    @back="activeScreen = 'home'"
  />
  <PatternRecognitionGame
    v-else-if="activeScreen === 'pattern-recognition'"
    @back="activeScreen = 'home'"
  />
  <MatrixMirrorGame
    v-else-if="activeScreen === 'matrix-mirror'"
    @back="activeScreen = 'home'"
  />
  <CharadeGame
    v-else-if="activeScreen === 'charade-game'"
    @back="activeScreen = 'home'"
  />

  <!-- ── Fallback ───────────────────────────────────────────────────────── -->
  <div v-else class="game-not-found">
    <h2>Jogo em desenvolvimento</h2>
    <button class="btn-primary" @click="goToMenu()">Voltar ao Menu</button>
  </div>
</template>
