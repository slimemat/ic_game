<template>
  <div class="tab-content">
    <h2>🏆 Ranking de Alunos</h2>
    <div class="ranking-list">
      <div
        v-for="(user, index) in ranking"
        :key="index"
        class="ranking-item"
        :class="{ 'is-me': user.isMe }"
      >
        <span class="rank-pos">#{{ index + 1 }}</span>
        <span class="rank-name">{{ user.name }}</span>
        <span class="rank-score">{{ user.score }} XP</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "RankingTab",
  data() {
    return {
      ranking: [
        { name: "Ana Souza", score: 1450 },
        { name: "Carlos Lima", score: 1200 },
        { name: "Felipe Silva (Você)", score: 980, isMe: true },
        { name: "Beatriz Costa", score: 850 },
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
.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 15px;
}
.ranking-item {
  display: flex;
  justify-content: space-between;
  background: #252836;
  padding: 12px 15px;
  border-radius: 8px;
  align-items: center;
}
.ranking-item.is-me {
  background: #2b4c7e;
  border: 1px solid #ffd700;
}
.rank-pos {
  font-weight: bold;
  color: #ffd700;
  width: 40px;
}
.rank-name {
  flex: 1;
}
.rank-score {
  font-weight: bold;
  color: #68d391;
}
</style>
