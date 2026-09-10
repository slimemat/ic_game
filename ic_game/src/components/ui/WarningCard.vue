<template>
  <transition name="fade">
    <div v-if="isVisible" class="warning-card" :class="type">
      <div class="warning-icon">{{ icon }}</div>
      <div class="warning-content">
        <h4 v-if="title" class="warning-title">{{ title }}</h4>
        <p class="warning-message">{{ message }}</p>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  isVisible: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    default: 'info', // 'info', 'warning', 'error'
    validator: (val) => ['info', 'warning', 'error'].includes(val)
  },
  title: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    required: true
  }
});

const icon = computed(() => {
  switch (props.type) {
    case 'warning': return '⚠️';
    case 'error': return '❌';
    case 'info':
    default: return '💡';
  }
});
</script>

<style scoped>
.warning-card {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
  z-index: 2000;
  min-width: 250px;
  max-width: 80%;
}

/* Tipos */
.warning-card.info {
  background-color: #3182ce;
  color: #ebf8ff;
  border-left: 4px solid #90cdf4;
}

.warning-card.warning {
  background-color: #dd6b20;
  color: #fffff0;
  border-left: 4px solid #fbd38d;
}

.warning-card.error {
  background-color: #e53e3e;
  color: #fff5f5;
  border-left: 4px solid #feb2b2;
}

.warning-icon {
  font-size: 1.5rem;
}

.warning-content {
  display: flex;
  flex-direction: column;
}

.warning-title {
  margin: 0;
  font-size: 1rem;
  font-weight: bold;
}

.warning-message {
  margin: 0;
  font-size: 0.9rem;
}

/* Transições */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -20px);
}
</style>

