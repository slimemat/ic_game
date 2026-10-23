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
  position: relative;
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
  -webkit-tap-highlight-color: transparent;
  transition: color 0.2s ease;
}

/* Barrinha indicadora no topo do item ativo */
.nav-item::before {
  content: "";
  position: absolute;
  top: -2px;
  left: 25%;
  width: 50%;
  height: 3px;
  border-radius: 0 0 4px 4px;
  background: #ffd700;
  transform: scaleX(0);
  transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1);
}

.nav-item.active {
  color: #ffd700;
}

.nav-item.active::before {
  transform: scaleX(1);
}

.nav-icon {
  font-size: 22px;
  margin-bottom: 2px;
  transition: transform 0.2s ease;
}

.nav-item.active .nav-icon {
  transform: translateY(-2px) scale(1.15);
  filter: drop-shadow(0 0 6px rgba(255, 215, 0, 0.55));
}

.nav-item:active .nav-icon {
  transform: scale(0.9);
}

.nav-label {
  font-size: 11px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.nav-item:focus-visible {
  outline: 2px solid #ffd700;
  outline-offset: -4px;
  border-radius: 8px;
}

@media (prefers-reduced-motion: reduce) {
  .nav-item::before,
  .nav-icon {
    transition: none;
  }
}
</style>
