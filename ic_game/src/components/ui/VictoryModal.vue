<template>
  <div v-if="isOpen" class="modal-overlay">
    <div
      class="victory-card"
      :class="themeClassName"
      :style="customThemeStyle"
      role="dialog"
      aria-modal="true"
      :aria-label="$t('global.modals.victory_title')"
    >
      <!-- ── Placeholders / Sprites Decorativos (pointer-events: none) ── -->
      <!-- Nuvem Decorativa Frutiger Aero -->
      <div class="sprite-placeholder placeholder-cloud" aria-hidden="true">
        <img :src="cloudImg" alt="" class="frutiger-cloud" />
      </div>

      <!-- Clipe de Papel em Pixel Art -->
      <div
        class="sprite-placeholder placeholder-clip"
        aria-hidden="true"
        title="Clipe de Papel"
      >
        <img :src="paperclipImg" alt="" class="pixelart-clip" />
      </div>

      <!-- ── Barra Superior Estilo Frutiger Aero OS / Janela ── -->
      <header class="card-header">
        <div class="window-controls" aria-hidden="true">
          <span class="dot dot-red"></span>
          <span class="dot dot-yellow"></span>
          <span class="dot dot-green"></span>
        </div>
        <div class="window-title">
          {{ $t("global.modals.victory_window_title") }}
        </div>
      </header>

      <!-- ── Corpo do Relatório / Certificado de Vitória ── -->
      <div class="card-body">
        <!-- Badge / Selo de Aprovação Frutiger Aero -->
        <div class="stamp-container" aria-hidden="true">
          <div class="victory-stamp">
            <svg
              class="stamp-star-icon"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path
                d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
              />
            </svg>
            <span class="stamp-text">{{
              $t("global.modals.victory_tag")
            }}</span>
          </div>
        </div>

        <div class="victory-eyebrow">
          {{ $t("global.modals.victory_memo") }}
        </div>

        <h2 class="modal-title">
          {{ title || $t("global.modals.victory_title") }}
        </h2>

        <p class="modal-description">
          {{ description || $t("global.modals.victory_desc") }}
        </p>

        <!-- Slot para Estatísticas da Partida (estilo ficha técnica) -->
        <div v-if="$slots.stats" class="modal-stats-panel">
          <slot name="stats"></slot>
        </div>

        <!-- Ações do Modal com Hierarquia Mobile-First -->
        <div class="modal-actions">
          <slot name="actions">
            <!-- Ação Primária Hero: Avançar para a Próxima Fase -->
            <button
              type="button"
              @click="$emit('next')"
              class="btn-modal btn-next"
              autofocus
            >
              <span class="btn-shine"></span>
              <span class="btn-text">
                {{ nextLabel || $t("global.buttons.next_level") }}
              </span>
            </button>

            <!-- Ação Secundária: Voltar ao Menu -->
            <button
              type="button"
              @click="$emit('menu')"
              class="btn-modal btn-menu"
            >
              <span class="btn-text">
                {{ menuLabel || $t("global.buttons.back_to_menu") }}
              </span>
            </button>
          </slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import paperclipImg from "../../assets/images/paperclip.png";
import cloudImg from "../../assets/images/cloud.png";

const props = defineProps({
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
  nextLabel: {
    type: String,
    default: "",
  },
  menuLabel: {
    type: String,
    default: "",
  },
  /**
   * Identificador de tema ('default', 'purple', 'taskGiver02', 'drHelena', etc.)
   * ou objeto com custom tokens { accent, glow, hover }.
   */
  theme: {
    type: [String, Object],
    default: "default",
  },
});

defineEmits(["next", "menu"]);

const THEME_PRESETS = {
  default: "theme-default",
  sky: "theme-default",
  drHelena: "theme-default",
  purple: "theme-purple",
  taskGiver02: "theme-purple",
  green: "theme-green",
};

const themeClassName = computed(() => {
  if (typeof props.theme === "string") {
    return THEME_PRESETS[props.theme] || "theme-default";
  }
  return "theme-custom";
});

const customThemeStyle = computed(() => {
  if (typeof props.theme === "object" && props.theme !== null) {
    return {
      "--theme-accent": props.theme.accent || props.theme.optionBorderActive,
      "--theme-accent-glow": props.theme.glow || "rgba(16, 185, 129, 0.35)",
    };
  }
  return {};
});
</script>

<style scoped>
/* ── Overlay Escuro com Desfoque Frutiger Aero ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(16, 24, 32, 0.75);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  padding: 16px;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  animation: overlay-fade 0.2s ease-out;
}

/* ── Cartão do Relatório / Vitória (Mobile-First) ── */
.victory-card {
  --theme-accent: #10b981;
  --theme-accent-hover: #059669;
  --theme-accent-glow: rgba(16, 185, 129, 0.38);
  --theme-accent-subtle: rgba(16, 185, 129, 0.12);

  position: relative;
  width: 100%;
  max-width: 400px;
  max-height: 92vh;
  background-color: #f8fafc;
  /* Textura de papel pautado corporativo */
  background-image: linear-gradient(
    transparent,
    transparent 27px,
    rgba(168, 188, 194, 0.22) 27px,
    rgba(168, 188, 194, 0.22) 28px
  );
  background-size: 100% 28px;
  border-radius: 14px;
  border-left: 5px solid var(--theme-accent);
  box-shadow:
    0 20px 45px -10px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  overflow: visible;
  font-family: var(--font-main);
  animation: modal-pop 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  flex-direction: column;
}

/* Variantes de Tema */
.victory-card.theme-purple {
  --theme-accent: #8b5cf6;
  --theme-accent-hover: #7c3aed;
  --theme-accent-glow: rgba(139, 92, 246, 0.38);
  --theme-accent-subtle: rgba(139, 92, 246, 0.14);
}

.victory-card.theme-default {
  --theme-accent: #10b981; /* Verde de sucesso radiante como default */
  --theme-accent-hover: #059669;
  --theme-accent-glow: rgba(16, 185, 129, 0.38);
  --theme-accent-subtle: rgba(16, 185, 129, 0.12);
}

/* ── Placeholders para Sprites (pointer-events: none) ── */
.sprite-placeholder {
  position: absolute;
  pointer-events: none;
  z-index: 10;
  user-select: none;
}

.placeholder-cloud {
  top: -34px;
  left: -20px;
}

.frutiger-cloud {
  width: 90px;
  height: auto;
  opacity: 0.85;
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.18));
  animation: float-cloud 4s ease-in-out infinite alternate;
}

.placeholder-clip {
  top: -22px;
  right: 22px;
}

.pixelart-clip {
  width: 58px;
  height: 58px;
  display: block;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
  filter: drop-shadow(2px 3px 5px rgba(0, 0, 0, 0.35));
  transform: rotate(12deg);
}

/* ── Cabeçalho Frutiger Aero OS Window ── */
.card-header {
  height: 38px;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.98) 0%,
    rgba(235, 240, 246, 0.92) 50%,
    rgba(220, 228, 236, 0.95) 100%
  );
  border-top-left-radius: 9px;
  border-top-right-radius: 14px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  padding: 0 14px;
  position: relative;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 1);
  flex-shrink: 0;
}

.window-controls {
  display: flex;
  gap: 7px;
  align-items: center;
}

.dot {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  box-shadow:
    inset 0 1px 2px rgba(255, 255, 255, 0.8),
    inset 0 -1px 2px rgba(0, 0, 0, 0.25),
    0 1px 2px rgba(0, 0, 0, 0.12);
}

.dot-red {
  background: radial-gradient(circle at 35% 35%, #ff766e, #e0443e);
  border: 1px solid #d32f2f;
}
.dot-yellow {
  background: radial-gradient(circle at 35% 35%, #ffcf48, #dea123);
  border: 1px solid #c98c1d;
}
.dot-green {
  background: radial-gradient(circle at 35% 35%, #44e05b, #1aab29);
  border: 1px solid #148d21;
}

.window-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-family: var(--font-mono);
  font-size: 0.74rem;
  font-weight: 600;
  color: #334155;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.9);
  letter-spacing: 0.04em;
  white-space: nowrap;
  pointer-events: none;
}

/* ── Corpo do Modal ── */
.card-body {
  padding: 1.4rem 1.4rem 1.6rem;
  text-align: center;
  overflow-y: auto;
  overscroll-behavior: contain;
}

/* Selo / Carimbo de Vitória Frutiger Aero */
.stamp-container {
  display: flex;
  justify-content: center;
  margin-bottom: 0.5rem;
}

.victory-stamp {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%);
  border: 1.5px solid var(--theme-accent);
  color: var(--theme-accent);
  box-shadow:
    0 4px 12px var(--theme-accent-subtle),
    inset 0 1px 0 rgba(255, 255, 255, 1);
  animation: stamp-pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.stamp-star-icon {
  width: 18px;
  height: 18px;
  color: #f59e0b;
}

.stamp-text {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.victory-eyebrow {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 600;
  color: var(--theme-accent);
  letter-spacing: 0.08em;
  margin-bottom: 0.35rem;
  text-transform: uppercase;
}

.modal-title {
  margin: 0 0 0.35rem 0;
  font-size: 1.55rem;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.modal-description {
  margin: 0 0 1.2rem 0;
  font-size: 0.92rem;
  color: #64748b;
  font-family: var(--font-mono);
  line-height: 1.35;
}

/* Painel de Estatísticas Ficha Técnica */
.modal-stats-panel {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.85rem 1rem;
  margin-bottom: 1.2rem;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.03);
  font-family: var(--font-mono);
  font-size: 0.88rem;
  color: #334155;
  text-align: left;
}

/* ── Ações do Modal (Mobile-First) ── */
.modal-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.btn-modal {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 10px 18px;
  border-radius: 10px;
  font-family: var(--font-main);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  user-select: none;
  touch-action: manipulation;
  transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
  text-decoration: none;
}

.btn-modal:active {
  transform: scale(0.98);
}

/* ── Botão Hero (Próxima Fase) ── */
.btn-next {
  background: linear-gradient(
    180deg,
    var(--theme-accent) 0%,
    var(--theme-accent-hover) 100%
  );
  border: 1px solid var(--theme-accent-hover);
  color: #ffffff;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.45),
    inset 0 -1px 0 rgba(0, 0, 0, 0.15),
    0 6px 14px var(--theme-accent-glow);
}

.btn-next:hover {
  filter: brightness(1.06);
  transform: translateY(-1px);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.6),
    0 8px 18px var(--theme-accent-glow);
}

.btn-shine {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 48%;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.35) 0%,
    rgba(255, 255, 255, 0) 100%
  );
  border-top-left-radius: 9px;
  border-top-right-radius: 9px;
  pointer-events: none;
}

/* ── Botão Secundário (Voltar ao Menu) ── */
.btn-menu {
  background: transparent;
  border: 1px solid #e2e8f0;
  color: #64748b;
  margin-top: 4px;
}

.btn-menu:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
  color: #334155;
  transform: translateY(-1px);
}

/* ── Animações ── */
@keyframes overlay-fade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes modal-pop {
  from {
    transform: scale(0.93) translateY(8px);
    opacity: 0;
  }
  to {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}

@keyframes stamp-pop {
  0% {
    transform: scale(0.7) rotate(-4deg);
    opacity: 0;
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

@keyframes float-cloud {
  0% {
    transform: translateY(0px) rotate(-1deg);
  }
  100% {
    transform: translateY(6px) rotate(1deg);
  }
}

/* ── Ajustes para Telas Pequenas / Mobile ── */
@media (max-width: 420px) {
  .victory-card {
    border-radius: 12px;
  }
  .card-body {
    padding: 1.2rem 1rem 1.4rem;
  }
  .modal-title {
    font-size: 1.4rem;
  }
  .placeholder-cloud {
    top: -28px;
    left: -12px;
  }
  .frutiger-cloud {
    width: 76px;
  }
  .placeholder-clip {
    top: -18px;
    right: 16px;
  }
  .pixelart-clip {
    width: 48px;
    height: 48px;
  }
}
</style>
