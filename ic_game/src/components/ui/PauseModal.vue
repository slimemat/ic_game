<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="$emit('resume')">
    <div
      class="pause-card"
      :class="themeClassName"
      :style="customThemeStyle"
      role="dialog"
      aria-modal="true"
      :aria-label="$t('global.modals.pause_title')"
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
          <span
            class="dot dot-red"
            @click="$emit('resume')"
            title="Fechar / Continuar"
          ></span>
          <span class="dot dot-yellow"></span>
          <span class="dot dot-green"></span>
        </div>
        <div class="window-title">
          {{ $t("global.modals.pause_window_title") }}
        </div>
      </header>

      <!-- ── Corpo do Memorando / Ficha de Escritório ── -->
      <div class="card-body">
        <!-- Badge / Sprite Consistente de Pausa -->
        <div class="pause-badge-container" aria-hidden="true">
          <div class="pause-badge">
            <svg class="pause-badge-icon" viewBox="0 0 24 24" fill="none">
              <rect
                x="6"
                y="5"
                width="4"
                height="14"
                rx="1.5"
                fill="currentColor"
              />
              <rect
                x="14"
                y="5"
                width="4"
                height="14"
                rx="1.5"
                fill="currentColor"
              />
            </svg>
          </div>
        </div>

        <!-- Frase de status divertida / aleatória -->
        <div class="pause-eyebrow">{{ currentMemo }}</div>

        <h2 class="modal-title">
          {{ title || $t("global.modals.pause_title") }}
        </h2>

        <p class="modal-description">
          {{ description || $t("global.modals.pause_desc") }}
        </p>

        <!-- Ações do Modal com Hierarquia de Botões Mobile-First -->
        <div class="modal-actions">
          <slot name="actions">
            <!-- Ação Primária: Continuar (Destaque Hero Frutiger Aero) -->
            <button
              type="button"
              @click="$emit('resume')"
              class="btn-modal btn-resume"
              autofocus
            >
              <span class="btn-shine"></span>
              <span class="btn-text">{{ $t("global.buttons.continue") }}</span>
            </button>

            <!-- Ação Secundária: Reiniciar Fase (quando aplicável) -->
            <button
              v-if="showRestart"
              type="button"
              @click="$emit('restart')"
              class="btn-modal btn-restart"
            >
              <span class="btn-text">
                {{ restartLabel || $t("global.buttons.restart_level") }}
              </span>
            </button>

            <!-- Ação Terciária / Escape Seguro: Voltar ao Menu / Sair -->
            <button
              type="button"
              @click="$emit('quit')"
              class="btn-modal btn-quit"
            >
              <span class="btn-text">
                {{ quitLabel || $t("global.buttons.back_to_menu") }}
              </span>
            </button>
          </slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
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
  showRestart: {
    type: Boolean,
    default: true,
  },
  restartLabel: {
    type: String,
    default: "",
  },
  quitLabel: {
    type: String,
    default: "",
  },
  /**
   * Identificador do tema ('default', 'purple', 'taskGiver02', 'drHelena', etc.)
   * ou objeto com custom tokens { accent, glow, hover }.
   */
  theme: {
    type: [String, Object],
    default: "default",
  },
});

defineEmits(["resume", "restart", "quit"]);

const { tm } = useI18n();

const DEFAULT_MEMOS = [
  "MEMO // PAUSA TÉCNICA AUTORIZADA",
  "CAFÉ ESFRIANDO NA COPA...",
  "PROCESSO SUSPENSO EM SEGUNDO PLANO",
  "ORGANIZANDO AS GAVETAS DO ESCRITÓRIO...",
  "ARQUIVANDO RELATÓRIOS TEMPORÁRIOS...",
  "SISTEMA EM MODO DE ESPERA...",
  "DESCARREGANDO MEMÓRIA VOLÁTIL...",
];

const currentMemo = ref(DEFAULT_MEMOS[0]);

function pickRandomMemo() {
  try {
    const memos = tm("global.modals.pause_memos");
    const list =
      Array.isArray(memos) && memos.length > 0 ? memos : DEFAULT_MEMOS;
    const randomIndex = Math.floor(Math.random() * list.length);
    currentMemo.value = list[randomIndex];
  } catch {
    currentMemo.value =
      DEFAULT_MEMOS[Math.floor(Math.random() * DEFAULT_MEMOS.length)];
  }
}

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      pickRandomMemo();
    }
  },
  { immediate: true },
);

// Mapas de temas conhecidos (SOLID / Open for extension)
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
      "--theme-accent-glow": props.theme.glow || "rgba(14, 165, 233, 0.35)",
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
  background: rgba(16, 24, 32, 0.72);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  padding: 16px;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  animation: overlay-fade 0.2s ease-out;
}

/* ── Cartão do Memorando / Janela Frutiger Aero (Mobile-First) ── */
.pause-card {
  --theme-accent: #0ea5e9;
  --theme-accent-hover: #0284c7;
  --theme-accent-glow: rgba(14, 165, 233, 0.35);
  --theme-accent-subtle: rgba(14, 165, 233, 0.12);

  position: relative;
  width: 100%;
  max-width: 390px;
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

/* Variantes de Tema (SOLID & DRY) */
.pause-card.theme-purple {
  --theme-accent: #8b5cf6;
  --theme-accent-hover: #7c3aed;
  --theme-accent-glow: rgba(139, 92, 246, 0.38);
  --theme-accent-subtle: rgba(139, 92, 246, 0.14);
}

.pause-card.theme-green {
  --theme-accent: #10b981;
  --theme-accent-hover: #059669;
  --theme-accent-glow: rgba(16, 185, 129, 0.38);
  --theme-accent-subtle: rgba(16, 185, 129, 0.14);
}

/* ── Placeholders para Sprites (pointer-events: none) ── */
.sprite-placeholder {
  position: absolute;
  pointer-events: none;
  z-index: 10;
  user-select: none;
}

/* Nuvem Frutiger Aero */
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

/* Clipe de Papel */
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
  cursor: pointer;
  transition: transform 0.15s ease;
}

.dot:hover {
  transform: scale(1.15);
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

/* ── Corpo do Memorando ── */
.card-body {
  padding: 1.4rem 1.4rem 1.6rem;
  text-align: center;
  overflow-y: auto;
  overscroll-behavior: contain;
}

/* Badge / Sprite de Pausa */
.pause-badge-container {
  display: flex;
  justify-content: center;
  margin-bottom: 0.5rem;
}

.pause-badge {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%);
  border: 1px solid rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--theme-accent);
  box-shadow:
    0 4px 12px var(--theme-accent-subtle),
    inset 0 1px 0 rgba(255, 255, 255, 1),
    0 2px 4px rgba(0, 0, 0, 0.05);
}

.pause-badge-icon {
  width: 22px;
  height: 22px;
}

.pause-eyebrow {
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
  font-size: 1.45rem;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.modal-description {
  margin: 0 0 1.3rem 0;
  font-size: 0.9rem;
  color: #64748b;
  font-family: var(--font-mono);
  line-height: 1.35;
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

/* ── Botão Hero (Continuar) ── */
.btn-resume {
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

.btn-resume:hover {
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

/* ── Botão Secundário (Reiniciar) ── */
.btn-restart {
  background: linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%);
  border: 1px solid #cbd5e1;
  color: #334155;
  box-shadow:
    inset 0 1px 0 #ffffff,
    0 2px 4px rgba(0, 0, 0, 0.04);
}

.btn-restart:hover {
  background: linear-gradient(180deg, #ffffff 0%, #e2e8f0 100%);
  border-color: #94a3b8;
  transform: translateY(-1px);
  box-shadow:
    inset 0 1px 0 #ffffff,
    0 4px 8px rgba(0, 0, 0, 0.08);
}

/* ── Botão Terciário / Escape Seguro (Sair / Voltar ao Menu) ── */
.btn-quit {
  background: transparent;
  border: 1px solid #e2e8f0;
  color: #64748b;
  margin-top: 4px;
}

.btn-quit:hover {
  background: rgba(239, 68, 68, 0.08);
  border-color: rgba(239, 68, 68, 0.3);
  color: #dc2626;
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
  .pause-card {
    border-radius: 12px;
  }
  .card-body {
    padding: 1.2rem 1rem 1.4rem;
  }
  .modal-title {
    font-size: 1.35rem;
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
