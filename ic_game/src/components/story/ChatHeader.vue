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
  background: rgba(252, 252, 252, 0.9);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  border-bottom: 1px dashed rgba(0, 0, 0, 0.15);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  color: #333;
  z-index: 10;
  overflow: hidden;
  transition: all 0.35s ease;
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
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.3s ease;
}

/* ── Variante Padrão (Chamado Corporativo / Pasta) ───────────────────────── */
.variant-default .chat-header-avatar {
  background: var(--folder-bg, #fef08a);
  border: 2px solid var(--folder-border, #ca8a04);
}
.variant-default .chat-header-eyebrow {
  color: var(--folder-shadow, #a16207);
}

/* ── Variante Morning (Bom Dia / Dia 2 - Céu Azul com Nuvens Pixel Art) ─── */
.variant-morning {
  background: linear-gradient(180deg, #38bdf8 0%, #7dd3fc 60%, #bae6fd 100%);
  border-bottom: 2px solid #0284c7;
  box-shadow: 0 4px 14px rgba(2, 132, 199, 0.28);
}

.variant-morning .chat-header-avatar {
  background: #fef08a;
  border: 2px solid #f59e0b;
  box-shadow: 0 0 14px rgba(250, 204, 21, 0.8);
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

/* ── Variante Bot (Tipster Bot / Turno Noturno) ─────────────────────────── */
.variant-bot {
  background: rgba(24, 24, 38, 0.93);
  border-bottom: 2px solid #8b5cf6;
  box-shadow: 0 4px 14px rgba(139, 92, 246, 0.3);
  color: #f5f3ff;
}

.variant-bot .chat-header-avatar {
  background: #2e1065;
  border: 2px solid #a855f7;
  box-shadow: 0 0 14px rgba(168, 85, 247, 0.6);
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
