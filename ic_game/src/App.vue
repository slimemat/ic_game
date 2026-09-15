<script setup>
import { ref } from "vue";
import Home from "./components/Home.vue";
import GameSelection from "./components/GameSelection.vue";
import PlaceholderGame from "./components/PlaceholderGame.vue";
import TestGame from "./components/TestGame.vue";
import PatternRecognitionGame from "./components/PatternRecognitionGame.vue";
import MatrixMirrorGame from "./components/MatrixMirrorGame.vue";
import CharadeGame from "./components/CharadeGame.vue";

const activeGame = ref("home");
</script>

<template>
  <Home
    v-if="activeGame === 'home'"
    @play="activeGame = $event"
    @choose-games="activeGame = 'selection'"
  />
  <GameSelection
    v-else-if="activeGame === 'selection'"
    @select="activeGame = $event"
    @back="activeGame = 'home'"
  />
  <TestGame
    v-else-if="activeGame === 'test-platformer'"
    @back="activeGame = 'home'"
  />
  <PatternRecognitionGame
    v-else-if="activeGame === 'pattern-recognition'"
    @back="activeGame = 'home'"
  />
  <MatrixMirrorGame
    v-else-if="activeGame === 'matrix-mirror'"
    @back="activeGame = 'home'"
  />
  <CharadeGame
    v-else-if="activeGame === 'charade-game'"
    @back="activeGame = 'home'"
  />
  <PlaceholderGame v-else @back="activeGame = 'home'" />
</template>
