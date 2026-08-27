<script setup>
defineProps({
  games: {
    type: Array,
    required: true,
  },
});

defineEmits(["select"]);
</script>

<template>
  <main class="menu-screen">
    <div class="menu-intro">
      <p class="eyebrow">Jogos de Lógica</p>
      <h1>Escolha uma fase</h1>
      <p class="menu-copy">
        Jogos curtos para mentes curiosas. Mais quebra-cabeças estão por vir.
      </p>
    </div>

    <nav class="game-list" aria-label="Available games">
      <button
        v-for="game in games"
        :key="game.id"
        class="game-choice"
        type="button"
        @click="$emit('select', game.id)"
      >
        <span class="game-number">{{ game.number }}</span>
        <span class="game-details">
          <strong>{{ game.title }}</strong>
          <small>{{ game.description }}</small>
        </span>
        <span class="game-status">{{ game.status }}</span>
      </button>
    </nav>
  </main>
</template>
