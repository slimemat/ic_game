<script setup>
defineEmits(["click"]);
</script>

<template>
  <button
    class="pause-button"
    type="button"
    :title="$t('global.buttons.pause')"
    :aria-label="$t('global.buttons.pause')"
    @click="$emit('click')"
  >
    <svg class="pause-icon" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="6" y="4" width="4" height="16" rx="1.5" />
      <rect x="14" y="4" width="4" height="16" rx="1.5" />
    </svg>
  </button>
</template>
