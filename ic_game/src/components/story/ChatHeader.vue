<script setup>
/**
 * ChatHeader: header de "grupo" do chat, no estilo app de mensagens.
 * Mostra o chamado atual (eyebrow + título) e os participantes da conversa.
 *
 * Props:
 *   eyebrow      – linha superior (ex.: "CHAMADO #01")
 *   title        – nome do grupo (ex.: título da etapa atual)
 *   participants – texto já formatado (ex.: "Malu, Dra. Helena e você")
 */
defineProps({
  eyebrow: { type: String, default: "" },
  title: { type: String, required: true },
  participants: { type: String, default: "" },
});
</script>

<template>
  <header class="chat-header anim-header-in">
    <div class="chat-header-icon" aria-hidden="true">📁</div>
    <div class="chat-header-info">
      <span v-if="eyebrow" class="chat-header-eyebrow">{{ eyebrow }}</span>
      <h2 class="chat-header-title">{{ title }}</h2>
      <span v-if="participants" class="chat-header-participants">
        {{ participants }}
      </span>
    </div>
  </header>
</template>

<style scoped>
.chat-header {
  display: flex;
  align-items: center;
  gap: 12px;
  /* espaço à direita para o botão de pausa (44px + margem) */
  padding: 0.75rem 4.5rem 0.75rem 1rem;
  min-height: 4.5rem;
  background: rgba(252, 252, 252, 0.85);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  border-bottom: 1px dashed rgba(0, 0, 0, 0.15);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  color: #333;
  z-index: 10;
}

.chat-header-icon {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: var(--folder-bg, #fef08a);
  border: 2px solid var(--folder-border, #ca8a04);
  font-size: 1.2rem;
}

.chat-header-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.25;
}

.chat-header-eyebrow {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--folder-shadow, #a16207);
}

.chat-header-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 900;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-header-participants {
  font-size: 0.8rem;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.anim-header-in {
  animation: header-in 0.35s ease-out;
}

@keyframes header-in {
  from {
    opacity: 0;
    transform: translateY(-100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
