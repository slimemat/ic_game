<script setup>
import { ref, watch } from "vue";
import { useGameSessionStore } from "./stores/gameSession";
import MainMenu from "./components/MainMenu.vue";
import Home from "./components/Home.vue";
import GameSelection from "./components/GameSelection.vue";
import TestGame from "./components/TestGame.vue";
import PatternRecognitionGame from "./components/PatternRecognitionGame.vue";
import MatrixMirrorGame from "./components/MatrixMirrorGame.vue";
import CharadeGame from "./components/CharadeGame.vue";

const session = useGameSessionStore();

/**
 * Top-level navigation state.
 *
 * 'main-menu'    → MainMenu entry screen
 * 'story'        → Story Mode (Phase 2 placeholder)
 * 'home'         → existing Home / hub screen
 * 'selection'    → GameSelection component
 * <game-id>      → a specific mini-game
 */
const activeScreen = ref("main-menu");

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
</script>

<template>
  <!-- ── Main Menu ─────────────────────────────────────────────────────── -->
  <MainMenu v-if="activeScreen === 'main-menu'" @mode-selected="() => {}" />

  <!-- ── Story Mode (Phase 2 placeholder) ──────────────────────────────── -->
  <div v-else-if="activeScreen === 'story'" class="placeholder-screen">
    <h2>Modo História</h2>
    <p>Em breve…</p>
    <button class="btn-primary" @click="goToMenu()">Voltar ao Menu</button>
  </div>

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
