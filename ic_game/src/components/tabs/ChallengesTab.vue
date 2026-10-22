<template>
  <div class="tab-content">
    <h2>{{ $t("hub.challenges.title") || "Desafios" }}</h2>
    <p class="subtitle">Selecione um jogo para treinar suas habilidades</p>
    <div class="games-grid">
      <div
        v-for="game in games"
        :key="game.id"
        class="game-card"
        @click="$emit('select-game', game)"
      >
        <h3>{{ game.name }}</h3>
        <p>{{ game.description }}</p>
        <button class="btn-play">Jogar</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "ChallengesTab",
  data() {
    return {
      games: [
        {
          id: "logic-lab",
          name: "Logic Lab",
          description: "Resolva problemas lógicos avançados.",
        },
        {
          id: "pattern-recognition",
          name: "Pattern Recognition",
          description: "Encontre padrões e sequências.",
        },
        {
          id: "matrix-mirror",
          name: "Matrix Mirror",
          description: "Espelhamento e simetria de matrizes.",
        },
        {
          id: "charades",
          name: "Charades",
          description: "Adivinhação baseada em dicas visuais.",
        },
      ],
    };
  },
};
</script>

<style scoped>
.tab-content {
  padding: 20px;
  padding-bottom: 90px;
  color: #fff;
  max-width: 600px;
  margin: 0 auto;
}
.subtitle {
  color: #a0aec0;
  margin-bottom: 20px;
  font-size: 14px;
}
.games-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 15px;
}
.game-card {
  background: #252836;
  border: 1px solid #3b4252;
  border-radius: 12px;
  padding: 15px;
  cursor: pointer;
  transition: 0.2s;
}
.game-card:hover {
  border-color: #ffd700;
  transform: translateY(-2px);
}
.btn-play {
  background: #3182ce;
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: bold;
  margin-top: 10px;
  cursor: pointer;
}
</style>
