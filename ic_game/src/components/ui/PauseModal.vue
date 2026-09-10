<template>
  <div v-if="isOpen" class="modal-overlay">
    <div class="modal-content">
      <h2 class="modal-title">{{ title }}</h2>
      <p v-if="description" class="modal-description">{{ description }}</p>
      
      <div class="modal-actions">
        <slot name="actions">
          <button @click="$emit('resume')" class="btn btn-primary">Continuar</button>
          <button v-if="showRestart" @click="$emit('restart')" class="btn btn-secondary">Recomeçar</button>
          <button @click="$emit('quit')" class="btn btn-danger">Sair</button>
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
    default: 'Jogo Pausado'
  },
  description: {
    type: String,
    default: ''
  },
  showRestart: {
    type: Boolean,
    default: true
  }
});

defineEmits(['resume', 'restart', 'quit']);
</script>

<style scoped>
.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: #2d3748;
  padding: 2rem;
  border-radius: 8px;
  text-align: center;
  color: white;
  min-width: 300px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  border: 1px solid #4a5568;
}

.modal-title {
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1.5rem;
  color: #e2e8f0;
}

.modal-description {
  margin-bottom: 1.5rem;
  color: #a0aec0;
}

.modal-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #4fd1c5;
  color: #1a202c;
}
.btn-primary:hover {
  background: #38b2ac;
}

.btn-secondary {
  background: #4a5568;
  color: white;
}
.btn-secondary:hover {
  background: #2d3748;
}

.btn-danger {
  background: #fc8181;
  color: #1a202c;
}
.btn-danger:hover {
  background: #f56565;
}
</style>

