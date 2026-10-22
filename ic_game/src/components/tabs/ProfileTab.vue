<template>
  <div class="tab-content">
    <div class="profile-header">
      <div class="avatar-container">👤</div>
      <div class="user-info">
        <h2>{{ profile.name }}</h2>
        <p class="cargo">
          Cargo: <strong>{{ profile.cargo }}</strong>
        </p>
      </div>
    </div>

    <div class="xp-section">
      <div class="xp-labels">
        <span>XP Total: {{ profile.xp }}</span>
        <span>Próximo: {{ profile.nextCargo }}</span>
      </div>
      <div class="progress-bar">
        <div
          class="progress-fill"
          :style="{ width: profile.xpPercentage + '%' }"
        ></div>
      </div>
    </div>

    <div class="stats-card">
      <p>
        📚 Aulas/Atividades Concluídas:
        <strong>{{ profile.completedClasses }}</strong>
      </p>
    </div>

    <div class="book-section">
      <h3>📖 Livro de Personagens Encontrados</h3>
      <div class="characters-grid">
        <div
          v-for="char in characters"
          :key="char.id"
          class="char-badge"
          :class="{ locked: !char.unlocked }"
        >
          <span>{{ char.unlocked ? char.name : "???" }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "ProfileTab",
  data() {
    return {
      profile: {
        name: "Felipe Silva",
        cargo: "Estagiário(a)",
        xp: 120,
        nextCargo: "Analista Júnior",
        xpPercentage: 35,
        completedClasses: 3,
      },
      characters: [
        { id: 1, name: "Mentor Tech", unlocked: true },
        { id: 2, name: "Gerente de Projetos", unlocked: true },
        { id: 3, name: "Assistente IA", unlocked: false },
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
.profile-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}
.avatar-container {
  font-size: 40px;
  background: #2d3748;
  padding: 10px;
  border-radius: 50%;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.xp-section {
  background: #252836;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 15px;
}
.xp-labels {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  margin-bottom: 8px;
  color: #a0aec0;
}
.progress-bar {
  background: #1a1c23;
  height: 10px;
  border-radius: 5px;
  overflow: hidden;
}
.progress-fill {
  background: #ffd700;
  height: 100%;
  transition: width 0.3s;
}
.stats-card {
  background: #252836;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 15px;
  font-size: 14px;
}
.book-section h3 {
  margin-bottom: 10px;
  font-size: 16px;
}
.characters-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.char-badge {
  background: #2d3748;
  padding: 15px;
  text-align: center;
  border-radius: 8px;
  font-size: 12px;
  font-weight: bold;
}
.char-badge.locked {
  background: #1a1c23;
  color: #4a5568;
  border: 1px dashed #4a5568;
}
</style>
