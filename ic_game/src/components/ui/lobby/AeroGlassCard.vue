<script setup>
defineProps({
  as: {
    type: String,
    default: "section",
  },
  variant: {
    type: String,
    default: "default",
    validator: (value) =>
      ["default", "elevated", "accent", "subtle"].includes(value),
  },
  padding: {
    type: String,
    default: "md",
    validator: (value) => ["none", "sm", "md", "lg"].includes(value),
  },
  interactive: {
    type: Boolean,
    default: false,
  },
});
</script>

<template>
  <component
    :is="as"
    class="aero-glass-card"
    :class="[
      `aero-glass-card--${variant}`,
      `aero-glass-card--pad-${padding}`,
      { 'is-interactive': interactive || as === 'button' },
    ]"
    :type="as === 'button' ? 'button' : undefined"
  >
    <slot />
  </component>
</template>

<style scoped>
.aero-glass-card {
  position: relative;
  border-radius: 18px;
  border: 1.5px solid var(--aero-glass-border, rgba(255, 255, 255, 0.85));
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.84) 0%,
    var(--aero-glass-bg, rgba(255, 255, 255, 0.72)) 100%
  );
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  box-shadow:
    var(--aero-glass-shadow),
    var(--aero-glass-highlight, inset 0 1px 0 rgba(255, 255, 255, 0.95));
  color: var(--aero-text-primary, #0f172a);
  text-align: left;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.aero-glass-card--elevated {
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.94) 0%,
    rgba(240, 249, 255, 0.84) 100%
  );
  box-shadow:
    0 16px 36px rgba(14, 74, 110, 0.18),
    0 4px 10px rgba(14, 74, 110, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.98);
}

.aero-glass-card--accent {
  border-color: rgba(14, 165, 233, 0.58);
  background: linear-gradient(
    180deg,
    rgba(224, 242, 254, 0.92) 0%,
    rgba(240, 253, 250, 0.82) 100%
  );
  box-shadow:
    0 12px 28px rgba(2, 132, 199, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.98);
}

.aero-glass-card--subtle {
  background: var(--aero-glass-bg-subtle, rgba(255, 255, 255, 0.54));
  border-color: rgba(255, 255, 255, 0.68);
  box-shadow:
    0 6px 18px rgba(14, 74, 110, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.85);
}

.aero-glass-card--pad-none {
  padding: 0;
}

.aero-glass-card--pad-sm {
  padding: 12px 14px;
}

.aero-glass-card--pad-md {
  padding: 16px;
}

.aero-glass-card--pad-lg {
  padding: 20px;
}

.aero-glass-card.is-interactive {
  cursor: pointer;
}

.aero-glass-card.is-interactive:hover,
.aero-glass-card.is-interactive:focus-visible {
  border-color: rgba(14, 165, 233, 0.68);
  transform: translateY(-2px);
  box-shadow:
    0 14px 32px rgba(2, 132, 199, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.98);
}

.aero-glass-card.is-interactive:focus-visible {
  outline: 2px solid var(--aero-accent, #0284c7);
  outline-offset: 2px;
}

.aero-glass-card.is-interactive:active {
  transform: scale(0.99);
}

@media (prefers-reduced-motion: reduce) {
  .aero-glass-card {
    transition: none;
  }
}
</style>
