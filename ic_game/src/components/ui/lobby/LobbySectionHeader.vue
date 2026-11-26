<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    default: "",
  },
  eyebrow: {
    type: String,
    default: "",
  },
});
</script>

<template>
  <header class="lobby-section-header">
    <div class="header-copy">
      <span v-if="eyebrow" class="header-eyebrow">{{ eyebrow }}</span>
      <h2 class="header-title">{{ title }}</h2>
      <p v-if="subtitle" class="header-subtitle">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.action" class="header-action">
      <slot name="action" />
    </div>
  </header>
</template>

<style scoped>
.lobby-section-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
}

.header-copy {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.header-eyebrow {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--aero-accent, #0284c7);
}

.header-title {
  margin: 0;
  font-size: 1.45rem;
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.02em;
  color: var(--aero-text-primary, #0f172a);
}

.header-subtitle {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.35;
  color: var(--aero-text-secondary, #334155);
}

.header-action {
  flex-shrink: 0;
}
</style>
