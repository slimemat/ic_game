<script setup>
import { ref } from "vue";
import MainMenu from "./components/MainMenu.vue";
import PlaceholderGame from "./components/PlaceholderGame.vue";
import TestGame from "./components/TestGame.vue";

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
    status: "Soon",
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
  <PlaceholderGame v-else @back="activeGame = 'menu'" />
</template>
