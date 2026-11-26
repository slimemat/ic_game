<script setup>
import AppIcon from "./AppIcon.vue";

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
      <span class="nav-pill">
        <span class="nav-icon" aria-hidden="true">
          <AppIcon :name="tab.icon" :size="22" />
        </span>
        <span class="nav-label">{{ tab.label }}</span>
      </span>
    </button>
  </nav>
</template>

<style scoped>
.bottom-nav {
  position: relative;
  z-index: 10;
  flex-shrink: 0;
  display: flex;
  padding: 6px 8px calc(6px + env(safe-area-inset-bottom));
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.86) 0%,
    rgba(240, 249, 255, 0.92) 100%
  );
  border-top: 1.5px solid rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  box-shadow:
    0 -8px 24px rgba(14, 74, 110, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 1);
}

.nav-item {
  position: relative;
  flex: 1;
  min-height: 58px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
  background: none;
  border: none;
  color: var(--aero-text-muted, #475569);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: color 0.2s ease;
}

.nav-pill {
  position: relative;
  width: 100%;
  max-width: 78px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 6px 4px;
  border-radius: 14px;
  border: 1px solid transparent;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.16s ease;
}

/* Crisp top indicator inside active dock pill */
.nav-item::before {
  content: "";
  position: absolute;
  top: -6px;
  left: 28%;
  width: 44%;
  height: 3px;
  border-radius: 0 0 4px 4px;
  background: linear-gradient(90deg, #0ea5e9, #14b8a6);
  transform: scaleX(0);
  transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1);
}

.nav-item.active {
  color: var(--aero-accent, #0284c7);
}

.nav-item.active::before {
  transform: scaleX(1);
}

.nav-item.active .nav-pill {
  background: linear-gradient(
    180deg,
    rgba(224, 242, 254, 0.95) 0%,
    rgba(204, 251, 241, 0.78) 100%
  );
  border-color: rgba(14, 165, 233, 0.35);
  box-shadow:
    0 4px 12px rgba(14, 165, 233, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.95);
}

.nav-item:hover:not(.active) .nav-pill {
  background: rgba(255, 255, 255, 0.55);
}

.nav-icon {
  display: grid;
  place-items: center;
  transition: transform 0.2s ease;
}

.nav-item.active .nav-icon {
  transform: translateY(-1px) scale(1.08);
  filter: drop-shadow(0 2px 6px rgba(14, 165, 233, 0.35));
}

.nav-item:active .nav-pill {
  transform: scale(0.94);
}

.nav-label {
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.02em;
  line-height: 1.1;
  white-space: nowrap;
}

.nav-item:focus-visible {
  outline: 2px solid var(--aero-accent, #0284c7);
  outline-offset: -3px;
  border-radius: 14px;
}

@media (prefers-reduced-motion: reduce) {
  .nav-item::before,
  .nav-pill,
  .nav-icon {
    transition: none;
  }
}
</style>
