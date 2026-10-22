<template>
  <div class="tab-content">
    <h2>Modo História</h2>
    <button class="btn-story" @click="$emit('start-story')">
      Iniciar Jornada Épica
    </button>

    <div class="debug-panel">
      <span class="debug-badge">PAINEL DEBUG DEV</span>
      <button class="btn-debug" @click="$emit('reset-storage')">
        Resetar Progresso Pinia / Storage
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: "StoryTab",
};
</script>

<style scoped>
.tab-content {
  padding: 20px;
  padding-bottom: 90px;
  color: #fff;
  max-width: 600px;
  margin: 0 auto;
  text-align: center;
}
.btn-story {
  background: #48bb78;
  color: white;
  border: none;
  padding: 15px 30px;
  font-size: 16px;
  font-weight: bold;
  border-radius: 8px;
  cursor: pointer;
  width: 100%;
  margin-bottom: 30px;
}
.debug-panel {
  border: 1px dashed #e53e3e;
  padding: 15px;
  border-radius: 8px;
  background: rgba(229, 62, 62, 0.05);
}
.debug-badge {
  background: #e53e3e;
  color: white;
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: bold;
  display: inline-block;
  margin-bottom: 10px;
}
.btn-debug {
  background: #2d3748;
  color: #fc8181;
  border: 1px solid #e53e3e;
  padding: 10px;
  width: 100%;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
}
</style>
