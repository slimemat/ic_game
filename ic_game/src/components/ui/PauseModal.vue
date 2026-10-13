<template>
  <div v-if="isOpen" class="modal-overlay">
    <div class="pause-card">
      <!-- ── Placeholders para Sprites (pointer-events: none) ── -->
      <!-- Clipe de Papel (Sprite real em pixel art) -->
      <div
        class="sprite-placeholder placeholder-clip"
        aria-hidden="true"
        title="Clipe de Papel"
      >
        <img :src="paperclipImg" alt="" class="pixelart-clip" />
      </div>

      <!-- ── Barra Superior Estilo Frutiger Aero OS / Janela ── -->
      <div class="card-header">
        <div class="window-controls" aria-hidden="true">
          <span class="dot dot-red"></span>
          <span class="dot dot-yellow"></span>
          <span class="dot dot-green"></span>
        </div>
        <div class="window-title">LogicHub // Sistema em Pausa</div>
      </div>

      <!-- ── Corpo do Memorando / Papelaria ── -->
      <div class="card-body">
        <div class="pause-eyebrow">MEMO #042 // ESTADO SUSPENSO</div>
        <h2 class="modal-title">
          {{ title || $t("global.modals.pause_title") }}
        </h2>
        <p class="modal-description">
          {{ description || $t("global.modals.pause_desc") }}
        </p>

        <div class="modal-actions">
          <slot name="actions">
            <button @click="$emit('resume')" class="btn-modal btn-resume">
              {{ $t("global.buttons.continue") }}
            </button>
            <button
              v-if="showRestart"
              @click="$emit('restart')"
              class="btn-modal btn-restart"
            >
              {{ restartLabel || $t("global.buttons.restart_level") }}
            </button>
            <button @click="$emit('quit')" class="btn-modal btn-quit">
              {{ $t("global.buttons.quit") }}
            </button>
          </slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import paperclipImg from "../../assets/images/paperclip.png";

defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: "",
  },
  description: {
    type: String,
    default: "",
  },
  showRestart: {
    type: Boolean,
    default: true,
  },
  restartLabel: {
    type: String,
    default: "",
  },
});

defineEmits(["resume", "restart", "quit"]);
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(16, 24, 32, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.pause-card {
  position: relative;
  width: 90%;
  max-width: 420px;
  background-color: #f8fafc;
  /* Textura sutil de papel pautado corporativo */
  background-image: linear-gradient(
    transparent,
    transparent 27px,
    rgba(168, 188, 194, 0.25) 27px,
    rgba(168, 188, 194, 0.25) 28px
  );
  background-size: 100% 28px;
  border-radius: 12px;
  border-left: 4px solid var(--accent-color);
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.45),
    0 0 0 1px rgba(255, 255, 255, 0.2);
  overflow: visible;
  font-family: var(--font-main);
  animation: modal-pop 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

/* ── Placeholders para Sprites (pointer-events: none nunca bloqueia cliques) ── */
.sprite-placeholder {
  position: absolute;
  pointer-events: none;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
}

.placeholder-clip {
  top: -24px;
  right: 28px;
}

.pixelart-clip {
  width: 64px;
  height: 64px;
  display: block;
  image-rendering: pixelated; /* Chrome, Edge, Safari */
  image-rendering: -moz-crisp-edges; /* Firefox */
  image-rendering: crisp-edges;
  filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.5));
  transform: rotate(12deg);
}

/* ── Cabeçalho Frutiger Aero (OS Window Header) ── */
.card-header {
  height: 38px;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(225, 230, 235, 0.8) 49%,
    rgba(200, 210, 220, 0.8) 50%,
    rgba(235, 240, 245, 0.95) 100%
  );
  border-top-left-radius: 8px;
  border-top-right-radius: 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  padding: 0 14px;
  position: relative;
}

.window-controls {
  display: flex;
  gap: 7px;
}
.dot {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  box-shadow:
    inset 0 1px 2px rgba(255, 255, 255, 0.7),
    inset 0 -1px 2px rgba(0, 0, 0, 0.2),
    0 1px 1px rgba(0, 0, 0, 0.1);
}
.dot-red {
  background-color: #ff5f56;
  border: 1px solid #e0443e;
}
.dot-yellow {
  background-color: #ffbd2e;
  border: 1px solid #dea123;
}
.dot-green {
  background-color: #27c93f;
  border: 1px solid #1aab29;
}

.window-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 600;
  color: #334155;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.8);
  white-space: nowrap;
}

/* ── Conteúdo do Modal ── */
.card-body {
  padding: 1.8rem 1.6rem;
  text-align: center;
}

.pause-eyebrow {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--accent-color);
  letter-spacing: 0.1em;
  margin-bottom: 6px;
}

.modal-title {
  margin: 0 0 6px 0;
  font-size: 1.6rem;
  font-weight: 700;
  color: #1e293b;
}

.modal-description {
  margin: 0 0 1.6rem 0;
  font-size: 0.95rem;
  color: #64748b;
  font-family: var(--font-mono);
}

.modal-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* ── Botões Frutiger Aero / Papelaria ── */
.btn-modal {
  padding: 12px 20px;
  border-radius: 8px;
  font-family: var(--font-main);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}

.btn-resume {
  background: linear-gradient(180deg, var(--accent-color) 0%, #0284c7 100%);
  border: 1px solid #0284c7;
  color: #ffffff;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.4),
    0 4px 10px rgba(14, 165, 233, 0.3);
}
.btn-resume:hover {
  background: linear-gradient(180deg, #38bdf8 0%, var(--accent-color) 100%);
  transform: translateY(-2px);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.5),
    0 6px 14px rgba(14, 165, 233, 0.4);
}

.btn-restart {
  background: linear-gradient(180deg, #ffffff 0%, #e2e8f0 100%);
  border: 1px solid #cbd5e1;
  color: #334155;
  box-shadow:
    inset 0 1px 0 #ffffff,
    0 2px 6px rgba(0, 0, 0, 0.06);
}
.btn-restart:hover {
  background: linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%);
  transform: translateY(-2px);
  box-shadow:
    inset 0 1px 0 #ffffff,
    0 4px 10px rgba(0, 0, 0, 0.1);
}

.btn-quit {
  background: linear-gradient(180deg, var(--color-danger) 0%, #dd6b20 100%);
  border: 1px solid #c05621;
  color: #ffffff;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.3),
    0 4px 10px rgba(237, 137, 54, 0.3);
}
.btn-quit:hover {
  background: linear-gradient(
    180deg,
    var(--color-danger-hover) 0%,
    var(--color-danger) 100%
  );
  transform: translateY(-2px);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.4),
    0 6px 14px rgba(237, 137, 54, 0.4);
}

.btn-modal:active {
  transform: translateY(0) scale(0.98);
}

@keyframes modal-pop {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
