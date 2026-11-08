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
    class="assistant-top-push"
    :class="{
      'is-error-alert': isError,
      'is-done-alert': isDone && !isError,
    }"
  >
    <div class="push-avatar-box">
      <img :src="assistantAvatar" alt="Malu" class="push-avatar-img" />
      <span class="online-indicator" aria-hidden="true"></span>
    </div>

    <div class="push-content-box">
      <div class="push-header-row">
        <span class="push-sender-title">
          {{ $t("tutorials.desk.sender", { assistantName: "Malu" }) }}
        </span>
        <span class="push-counter-tag" :class="{ done: isDone }">
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
  align-items: center;
  gap: 10px;
  background: #ffffff;
  border: 1.5px solid #e2e8f0;
  border-radius: 14px;
  padding: 7px 11px;
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.08),
    0 1px 3px rgba(0, 0, 0, 0.04);
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.assistant-top-push.is-error-alert {
  background: var(--color-invalid-bg);
  border-color: var(--color-invalid-border);
}

.assistant-top-push.is-done-alert {
  background: #f0fdf4;
  border-color: #86efac;
}

.push-avatar-box {
  position: relative;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #f1f5f9;
  border: 1.5px solid #cbd5e1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.push-avatar-img {
  width: 30px;
  height: 30px;
  object-fit: contain;
  image-rendering: pixelated;
}

.online-indicator {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 10px;
  height: 10px;
  background: #22c55e;
  border: 2px solid #ffffff;
  border-radius: 50%;
}

.push-content-box {
  flex: 1;
  min-width: 0;
}

.push-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2px;
}

.push-sender-title {
  font-size: 0.72rem;
  font-weight: 800;
  color: #1e293b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.push-counter-tag {
  font-size: 0.64rem;
  font-weight: 800;
  color: #0369a1;
  background: #e0f2fe;
  padding: 1px 7px;
  border-radius: 10px;
}

.push-counter-tag.done {
  color: #15803d;
  background: var(--color-valid-bg);
}

.push-message-text {
  font-size: 0.76rem;
  font-weight: 700;
  color: #334155;
  margin: 0;
  line-height: 1.25;
}

.assistant-top-push.is-error-alert .push-message-text {
  color: var(--color-invalid-shadow);
}

.push-down-enter-active,
.push-down-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}

.push-down-enter-from {
  opacity: 0;
  transform: translateY(-14px);
}

.push-down-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
