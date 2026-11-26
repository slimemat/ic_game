<script setup>
import { computed } from "vue";
import cloudImg from "../../assets/images/cloud.png";
import sun8bitImg from "../../assets/sprites/sun_8bit.png";
import tipsterBotImg from "../../assets/sprites/tipster_bot_neutral.png";

/**
 * ChatHeader: header de "grupo" do chat no estilo app de mensagens.
 * Mostra o chamado atual ou contexto (eyebrow + título), participantes e avatar de pixel art.
 *
 * Props:
 *   eyebrow      – linha superior (ex.: "CHAMADO #01", "EXPEDIENTE")
 *   title        – nome do grupo (ex.: título da etapa atual, "Dia 2", "Tipster Bot")
 *   participants – texto já formatado (ex.: "Malu, Dra. Helena e você")
 *   avatarImg    – URL do sprite de pixel art (opcional; há fallback por variante)
 *   variant      – variante visual do header: 'default' | 'morning' | 'bot'
 */
const props = defineProps({
  eyebrow: { type: String, default: "" },
  title: { type: String, required: true },
  participants: { type: String, default: "" },
  avatarImg: { type: String, default: "" },
  variant: { type: String, default: "default" },
});

const resolvedAvatar = computed(() => {
  if (props.avatarImg) return props.avatarImg;
  if (props.variant === "morning") return sun8bitImg;
  if (props.variant === "bot") return tipsterBotImg;
  return null;
});
</script>

<template>
  <header class="chat-header anim-header-in" :class="`variant-${variant}`">
    <!-- Nuvens pixel art animadas no céu da variante matinal (Dia 2) -->
    <div
      v-if="variant === 'morning'"
      class="morning-sky-decor"
      aria-hidden="true"
    >
      <img :src="cloudImg" class="sky-cloud sky-cloud-1" alt="" />
      <img :src="cloudImg" class="sky-cloud sky-cloud-2" alt="" />
      <img :src="cloudImg" class="sky-cloud sky-cloud-3" alt="" />
    </div>

    <!-- Avatar Pixel Art -->
    <div class="chat-header-avatar" aria-hidden="true">
      <img
        v-if="resolvedAvatar"
        :src="resolvedAvatar"
        class="chat-header-sprite"
        :class="{ 'sun-pulse': variant === 'morning' }"
        alt=""
      />
      <!-- Ícone pixel art retrô para a pasta corporativa (sem emojis) -->
      <svg
        v-else
        class="chat-header-pixel-folder"
        viewBox="0 0 16 16"
        width="22"
        height="22"
      >
        <path fill="#f59e0b" d="M1 3h5l2 2h7v8H1z" />
        <path fill="#fef08a" d="M2 6h12v6H2z" />
        <path
          fill="#b45309"
          d="M1 3h5v1H2v8H1V3zm6 2h8v1H7V5zm7 1h1v7h-1V6zm-13 7h13v1H1v-1z"
        />
      </svg>
    </div>

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
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  /* espaço à direita para o botão de pausa (44px + margem) */
  padding: 0.75rem 4.5rem 0.75rem 1rem;
  min-height: 4.5rem;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.88) 0%,
    rgba(240, 249, 255, 0.78) 100%
  );
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1.5px solid rgba(255, 255, 255, 0.92);
  box-shadow:
    0 6px 20px rgba(14, 74, 110, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 1);
  color: var(--aero-text-primary, #0f172a);
  z-index: 10;
  overflow: hidden;
  transition: all 0.35s ease;
}

.chat-header::before {
  content: "";
  position: absolute;
  inset: 0 0 52% 0;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.42) 0%,
    rgba(255, 255, 255, 0) 100%
  );
  pointer-events: none;
  z-index: 0;
}

.chat-header-avatar {
  position: relative;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  z-index: 2;
  transition: all 0.3s ease;
}

.chat-header-sprite {
  width: 34px;
  height: 34px;
  object-fit: contain;
  image-rendering: pixelated;
}

.chat-header-pixel-folder {
  image-rendering: pixelated;
}

.chat-header-info {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.25;
  z-index: 2;
}

.chat-header-eyebrow {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  transition: color 0.3s ease;
}

.chat-header-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 900;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.3s ease;
}

.chat-header-participants {
  font-size: 0.8rem;
  color: var(--aero-text-muted, #475569);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.3s ease;
}

/* ── Variante Padrão (Frutiger Aero Glass / Chamado Corporativo) ───────── */
.variant-default .chat-header-avatar {
  background: linear-gradient(135deg, #fef9c3 0%, #fde047 100%);
  border: 2px solid rgba(255, 255, 255, 0.95);
  box-shadow:
    0 4px 12px rgba(14, 74, 110, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.85);
}
.variant-default .chat-header-eyebrow {
  color: var(--aero-accent, #0284c7);
}
.variant-default .chat-header-title {
  color: var(--aero-text-primary, #0f172a);
}

/* ── Variante Morning (Bom Dia / Dia 2 - Céu Azul com Nuvens Pixel Art) ─── */
.variant-morning {
  background: linear-gradient(
    180deg,
    rgba(56, 189, 248, 0.9) 0%,
    rgba(125, 211, 252, 0.85) 60%,
    rgba(186, 230, 253, 0.88) 100%
  );
  border-bottom: 1.5px solid rgba(255, 255, 255, 0.85);
  box-shadow:
    0 6px 18px rgba(2, 132, 199, 0.24),
    inset 0 1px 0 rgba(255, 255, 255, 0.85);
}

.variant-morning .chat-header-avatar {
  background: linear-gradient(135deg, #fef9c3 0%, #fde047 100%);
  border: 2px solid rgba(255, 255, 255, 0.95);
  box-shadow: 0 0 14px rgba(250, 204, 21, 0.85);
}

.variant-morning .chat-header-eyebrow {
  color: #0369a1;
  font-weight: 800;
  text-shadow: 0 1px 1px rgba(255, 255, 255, 0.6);
}

.variant-morning .chat-header-title {
  color: #082f49;
  text-shadow: 0 1px 1px rgba(255, 255, 255, 0.7);
}

.variant-morning .chat-header-participants {
  color: #0c4a6e;
  font-weight: 600;
  opacity: 0.9;
}

/* Decoração do Céu Matinal (Nuvens animadas) */
.morning-sky-decor {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 1;
}

.sky-cloud {
  position: absolute;
  image-rendering: pixelated;
  filter: drop-shadow(0 2px 4px rgba(2, 132, 199, 0.2));
}

.sky-cloud-1 {
  top: -4px;
  right: 22%;
  width: 50px;
  height: 50px;
  opacity: 0.9;
  animation: cloud-float-1 12s ease-in-out infinite alternate;
}

.sky-cloud-2 {
  bottom: -8px;
  right: 46%;
  width: 38px;
  height: 38px;
  opacity: 0.7;
  animation: cloud-float-2 16s ease-in-out infinite alternate;
}

.sky-cloud-3 {
  top: 6px;
  left: 28%;
  width: 42px;
  height: 42px;
  opacity: 0.55;
  animation: cloud-float-1 20s ease-in-out infinite alternate-reverse;
}

@keyframes cloud-float-1 {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(18px);
  }
}

@keyframes cloud-float-2 {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-14px);
  }
}

.sun-pulse {
  animation: sun-pulse-anim 3s ease-in-out infinite;
}

@keyframes sun-pulse-anim {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.08);
  }
}

/* ── Variante Bot (Tipster Bot / Turno Noturno - Aero Glass Violeta) ────── */
.variant-bot {
  background: linear-gradient(
    180deg,
    rgba(30, 27, 75, 0.84) 0%,
    rgba(49, 46, 129, 0.76) 100%
  );
  border-bottom: 1.5px solid rgba(167, 139, 250, 0.65);
  box-shadow:
    0 6px 20px rgba(76, 29, 149, 0.32),
    inset 0 1px 0 rgba(255, 255, 255, 0.28);
  color: #f5f3ff;
}

.variant-bot::before {
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.16) 0%,
    rgba(255, 255, 255, 0) 100%
  );
}

.variant-bot .chat-header-avatar {
  background: rgba(46, 16, 101, 0.88);
  border: 2px solid rgba(196, 181, 253, 0.85);
  box-shadow: 0 0 14px rgba(168, 85, 247, 0.55);
}

.variant-bot .chat-header-eyebrow {
  color: #c084fc;
}

.variant-bot .chat-header-title {
  color: #ffffff;
}

.variant-bot .chat-header-participants {
  color: #ddd6fe;
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
