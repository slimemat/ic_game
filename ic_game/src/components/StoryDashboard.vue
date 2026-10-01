<script setup>
const emit = defineEmits(["play", "back"]);
</script>

<template>
  <div class="dashboard-container">
    <header class="dashboard-header">
      <h1>Painel de Chamados</h1>
      <button class="btn-secondary" @click="$emit('back')">
        Sair do Painel
      </button>
    </header>

    <div class="mission-list">
      <div class="mission-card">
        <h3>Chamado #001: Padrões Corrompidos</h3>
        <p>
          O cliente reportou falhas graves na sequência de inicialização do
          sistema. Use suas habilidades lógicas de reconhecimento para arrumar o
          padrão antes que os servidores caiam.
        </p>
        <!-- Lança o jogo do Phaser diretamente -->
        <button
          class="btn-primary"
          @click="$emit('play', 'pattern-recognition')"
        >
          Iniciar Atendimento
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-container {
  padding: 3rem;
  color: white;
  min-height: 100vh;
  background-color: #1a1a2e;
}
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3rem;
  border-bottom: 2px solid #333;
  padding-bottom: 1rem;
}
.mission-card {
  background: #2d3748;
  padding: 2rem;
  border-radius: 8px;
  border-left: 6px solid #4fd1c5;
  max-width: 600px;
}
.mission-card h3 {
  margin-top: 0;
  color: #e2e8f0;
  font-size: 1.5rem;
}
.mission-card p {
  color: #a0aec0;
  line-height: 1.5;
  margin-bottom: 2rem;
}
.btn-primary {
  background: #4fd1c5;
  color: #1a202c;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  font-size: 1.1rem;
}
.btn-primary:hover {
  background: #38b2ac;
}
.btn-secondary {
  background: #4a5568;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}
.btn-secondary:hover {
  background: #2d3748;
}
</style>
