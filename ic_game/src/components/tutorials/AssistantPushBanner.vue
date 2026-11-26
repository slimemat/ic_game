<script setup>
import assistantAvatar from "../../assets/sprites/assistant_explaining.png";

defineProps({
  /** Mensagem atual exibida pela Malu */
  message: {
    type: String,
    required: true,
  },
  /** Chave única para disparar a transição vindo de cima (push-down) */
  messageKey: {
    type: String,
    default: "default",
  },
  /** Texto do contador (ex: "Passo 1 de 2" ou "Concluído ✓") */
  counterLabel: {
    type: String,
    required: true,
  },
  /** Quando true, aplica estilo de erro/alerta pedagógico */
  isError: {
    type: Boolean,
    default: false,
  },
  /** Quando true, aplica estilo verde de conclusão */
  isDone: {
    type: Boolean,
    default: false,
  },
});
</script>

<template>
  <header
    class="assistant-top-push office-lined-card"
    :class="{
      'is-error-alert': isError,
      'is-done-alert': isDone && !isError,
    }"
  >
    <div class="push-avatar-box">
      <img :src="assistantAvatar" alt="Malu" class="push-avatar-img" />
    </div>

    <div class="push-content-box">
      <div class="push-header-row">
        <span class="push-sender-title">
          {{ $t("tutorials.desk.sender", { assistantName: "Malu" }) }}
        </span>
        <span class="push-counter-tag" :class="{ done: isDone && !isError }">
          {{ counterLabel }}
        </span>
      </div>

      <transition name="push-down" mode="out-in">
        <p :key="messageKey" class="push-message-text">
          {{ message }}
        </p>
      </transition>
    </div>
  </header>
</template>

<style scoped>
.assistant-top-push {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  border: 1px solid #cbd5e1;
  border-left: 3.5px solid #38bdf8;
  border-radius: 6px;
  padding: 7px 10px;
  box-shadow: 1px 2px 6px rgba(15, 23, 42, 0.08);
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.assistant-top-push.is-error-alert {
  background-color: #fef2f2;
  border-color: #fecaca;
  border-left-color: var(--color-invalid-border);
}

.assistant-top-push.is-done-alert {
  background-color: #f0fdfa;
  border-color: #99f6e4;
  border-left-color: #0d9488;
}

.push-avatar-box {
  position: relative;
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  border-radius: 6px;
  background: #ffffff;
  border: 1.5px solid #38bdf8;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.assistant-top-push.is-error-alert .push-avatar-box {
  border-color: var(--color-invalid-border);
}

.assistant-top-push.is-done-alert .push-avatar-box {
  border-color: #0d9488;
}

.push-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  image-rendering: pixelated;
}

.push-content-box {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.push-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.push-sender-title {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 700;
  color: #0369a1;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.assistant-top-push.is-error-alert .push-sender-title {
  color: var(--color-invalid-shadow);
}

.assistant-top-push.is-done-alert .push-sender-title {
  color: #0f766e;
}

.push-counter-tag {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  font-weight: 700;
  color: #0369a1;
  background: #e0f2fe;
  border: 1px solid #bae6fd;
  padding: 1px 7px;
  border-radius: 4px;
  white-space: nowrap;
}

.push-counter-tag.done {
  color: #0f766e;
  background: #ccfbf1;
  border-color: #5eead4;
}

.push-message-text {
  font-size: 0.78rem;
  font-weight: 500;
  color: #1e293b;
  margin: 0;
  line-height: 1.3;
}

.assistant-top-push.is-error-alert .push-message-text {
  color: var(--color-invalid-shadow);
}

.push-down-enter-active,
.push-down-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.push-down-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}

.push-down-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>
