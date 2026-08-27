<script setup>
import { ref } from "vue";
import MainMenu from "./components/MainMenu.vue";
import PlaceholderGame from "./components/PlaceholderGame.vue";
import TestGame from "./components/TestGame.vue";
import PatternRecognitionGame from "./components/PatternRecognitionGame.vue";
import GenericGame from "./components/GenericGame.vue";

const games = [
  {
    id: "test-platformer",
    number: "01",
    title: "Star Runner",
    description: "Teste do phaser com plataforma e coleta de itens.",
    status: "Play",
  },
  {
    id: "logic-lab",
    number: "02",
    title: "Logic Lab",
    description: "Um novo jogo de resolução de problemas.",
    status: "Play",
  },
  {
    id: "pattern-recognition",
    number: "03",
    title: "Pattern Recognition",
    description: "Reconhecimento de padrões.",
    status: "Play",
  },
  {
    id: "generic-game",
    number: "04",
    title: "Generic Game",
    description: "Esqueleto de um novo jogo.",
    status: "Play",
  },
];

const activeGame = ref("menu");
</script>

<template>
  <MainMenu
    v-if="activeGame === 'menu'"
    :games="games"
    @select="activeGame = $event"
  />
  <TestGame
    v-else-if="activeGame === 'test-platformer'"
    @back="activeGame = 'menu'"
  />
  <PatternRecognitionGame
    v-else-if="activeGame === 'pattern-recognition'"
    @back="activeGame = 'menu'"
  />
  <GenericGame
    v-else-if="activeGame === 'generic-game'"
    @back="activeGame = 'menu'"
  />
  <PlaceholderGame v-else @back="activeGame = 'menu'" />
</template>
