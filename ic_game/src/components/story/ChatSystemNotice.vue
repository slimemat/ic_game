<script setup>
/**
 * ChatSystemNotice: pílula centralizada para avisos de sistema no chat
 * (ex.: "Criptografia ativada", "<nome> entrou no chat").
 *
 * Props:
 *   variant – "system" (padrão) | "join" | "leave" (muda o indicador)
 */
defineProps({
  variant: {
    type: String,
    default: "system",
    validator: (v) => ["system", "join", "leave"].includes(v),
  },
});
</script>

<template>
  <div class="chat-system-notice" :class="`notice-${variant}`" role="status">
    <span v-if="variant !== 'system'" class="notice-dot" aria-hidden="true" />
    <slot />
  </div>
</template>

<style scoped>
.chat-system-notice {
  align-self: center;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 90%;
  padding: 4px 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.4);
  color: #666;
  font-size: 0.85rem;
  text-align: center;
  line-height: 1.3;
}

.notice-dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.notice-join .notice-dot {
  background: #38a169;
}

.notice-leave .notice-dot {
  background: transparent;
  border: 2px solid #a0aec0;
}
</style>
