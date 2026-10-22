<script setup>
defineProps({
  modelValue: { type: Number, required: true },
  tabs: { type: Array, required: true },
});
defineEmits(["update:modelValue"]);
</script>

<template>
  <nav class="bottom-nav" :aria-label="$t('hub.nav_aria_label')">
    <button
      v-for="(tab, index) in tabs"
      :key="tab.label"
      type="button"
      class="nav-item"
      :class="{ active: modelValue === index }"
      :aria-current="modelValue === index ? 'page' : undefined"
      @click="$emit('update:modelValue', index)"
    >
      <span class="nav-icon" aria-hidden="true">{{ tab.icon }}</span>
      <span class="nav-label">{{ tab.label }}</span>
    </button>
  </nav>
</template>

<style scoped>
.bottom-nav {
  flex-shrink: 0;
  display: flex;
  background-color: #1a1c23;
  border-top: 2px solid #2d3139;
  padding-bottom: env(safe-area-inset-bottom);
  box-shadow: 0 -4px 10px rgba(0, 0, 0, 0.3);
  z-index: 10;
}

.nav-item {
  flex: 1;
  min-height: 65px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6px 2px;
  background: none;
  border: none;
  color: #8b92a5;
  cursor: pointer;
  transition:
    color 0.2s ease,
    transform 0.2s ease;
}

.nav-item.active {
  color: #ffd700;
  transform: translateY(-2px);
}

.nav-icon {
  font-size: 22px;
  margin-bottom: 2px;
}

.nav-label {
  font-size: 11px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
</style>
