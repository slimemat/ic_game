<template>
  <div v-if="isOpen" class="modal-overlay">
    <div class="modal-content victory-content">
      <div class="icon-container">
        <!-- Ícone genérico de estrela/troféu. Idealmente, importaríamos um SVG. -->
        <span class="icon">⭐</span>
      </div>
      <h2 class="modal-title">{{ title }}</h2>
      <p v-if="description" class="modal-description">{{ description }}</p>
      
      <!-- Slot para exibir estatísticas personalizadas de cada jogo (score, tempo, etc) -->
      <div v-if="$slots.stats" class="modal-stats">
        <slot name="stats"></slot>
      </div>
      
      <div class="modal-actions">
        <slot name="actions">
          <button @click="$emit('next')" class="btn btn-primary">Próxima Fase</button>
          <button @click="$emit('menu')" class="btn btn-secondary">Voltar ao Menu</button>
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: 'Nível Concluído!'
  },
  description: {
    type: String,
    default: 'Excelente trabalho!'
  }
});

defineEmits(['next', 'menu']);
</script>

<style scoped>
.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.modal-content {
  background: #2d3748;
  padding: 2.5rem 2rem;
  border-radius: 12px;
  text-align: center;
  color: white;
  min-width: 320px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.25);
  border: 2px solid #ecc94b;
}

.icon-container {
  font-size: 4rem;
  margin-bottom: 1rem;
  animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

@keyframes popIn {
  0% { transform: scale(0); }
  100% { transform: scale(1); }
}

.modal-title {
  margin-top: 0;
  margin-bottom: 0.5rem;
  font-size: 1.8rem;
  color: #ecc94b;
}

.modal-description {
  margin-bottom: 1.5rem;
  color: #e2e8f0;
}

.modal-stats {
  background: rgba(0, 0, 0, 0.2);
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.modal-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.btn {
  padding: 12px 20px;
  border: none;
  border-radius: 6px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #ecc94b;
  color: #744210;
}
.btn-primary:hover {
  background: #d69e2e;
}

.btn-secondary {
  background: #4a5568;
  color: white;
}
.btn-secondary:hover {
  background: #2d3748;
}
</style>

