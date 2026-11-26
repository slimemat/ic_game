<script setup>
import { computed } from "vue";
import { LOBBY_THEMES } from "../../../game/data/lobbyThemes";

const props = defineProps({
  theme: {
    type: Object,
    default: () => LOBBY_THEMES.chapter1,
  },
});

const backdropStyle = computed(() => ({
  "--lobby-sky-top": props.theme.skyTop,
  "--lobby-sky-mid": props.theme.skyMid,
  "--lobby-sky-bottom": props.theme.skyBottom,
  "--lobby-sun-glow": props.theme.sunGlow,
  "--lobby-horizon-glow": props.theme.horizonGlow,
  "--lobby-cloud-opacity": props.theme.cloudOpacity,
  "--lobby-orb-color": props.theme.orbColor,
}));
</script>

<template>
  <div class="lobby-backdrop" :style="backdropStyle" aria-hidden="true">
    <div class="sky-gradient"></div>
    <div class="sun-bloom"></div>
    <div class="horizon-wash"></div>

    <!-- Lightweight GPU-animated cloud sprites reused from src/assets/images/cloud.png -->
    <div v-if="theme.cloudSprite" class="cloud-layer">
      <img
        :src="theme.cloudSprite"
        alt=""
        draggable="false"
        class="aero-cloud cloud-1"
      />
      <img
        :src="theme.cloudSprite"
        alt=""
        draggable="false"
        class="aero-cloud cloud-2"
      />
      <img
        :src="theme.cloudSprite"
        alt=""
        draggable="false"
        class="aero-cloud cloud-3"
      />
    </div>

    <!-- Subtle Frutiger Aero translucent light bubbles -->
    <div class="aero-orb orb-1"></div>
    <div class="aero-orb orb-2"></div>
  </div>
</template>

<style scoped>
.lobby-backdrop {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

.sky-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    var(--lobby-sky-top, #67c8f8) 0%,
    var(--lobby-sky-mid, #bae6fd) 54%,
    var(--lobby-sky-bottom, #f0f9ff) 100%
  );
}

.sun-bloom {
  position: absolute;
  top: -12%;
  right: -10%;
  width: 340px;
  height: 340px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    var(--lobby-sun-glow, rgba(255, 250, 214, 0.85)) 0%,
    rgba(255, 255, 255, 0.25) 45%,
    transparent 72%
  );
}

.horizon-wash {
  position: absolute;
  inset: auto 0 0 0;
  height: 44%;
  background: radial-gradient(
    ellipse at 50% 100%,
    var(--lobby-horizon-glow, rgba(160, 236, 208, 0.42)) 0%,
    transparent 72%
  );
}

.cloud-layer {
  position: absolute;
  inset: 0;
  opacity: var(--lobby-cloud-opacity, 0.9);
}

.aero-cloud {
  position: absolute;
  height: auto;
  display: block;
  image-rendering: pixelated;
  filter: drop-shadow(0 8px 16px rgba(14, 116, 144, 0.14));
  will-change: transform;
}

.cloud-1 {
  top: 11%;
  left: -18%;
  width: 150px;
  animation: cloudDriftSlow 46s linear infinite;
}

.cloud-2 {
  top: 26%;
  left: -24%;
  width: 190px;
  opacity: 0.82;
  animation: cloudDriftMed 62s linear infinite;
  animation-delay: -26s;
}

.cloud-3 {
  top: 44%;
  left: -16%;
  width: 124px;
  opacity: 0.68;
  animation: cloudDriftSlow 54s linear infinite;
  animation-delay: -14s;
}

.aero-orb {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.7);
  background: radial-gradient(
    circle at 30% 30%,
    rgba(255, 255, 255, 0.8),
    var(--lobby-orb-color, rgba(255, 255, 255, 0.35)) 60%,
    rgba(255, 255, 255, 0.05) 100%
  );
  will-change: transform, opacity;
}

.orb-1 {
  width: 110px;
  height: 110px;
  bottom: 20%;
  left: -24px;
  opacity: 0.48;
  animation: orbFloat 11s ease-in-out infinite;
}

.orb-2 {
  width: 72px;
  height: 72px;
  top: 56%;
  right: -12px;
  opacity: 0.42;
  animation: orbFloat 9s ease-in-out infinite reverse;
}

@keyframes cloudDriftSlow {
  0% {
    transform: translate3d(-10vw, 0, 0);
  }
  100% {
    transform: translate3d(135vw, 0, 0);
  }
}

@keyframes cloudDriftMed {
  0% {
    transform: translate3d(-15vw, 0, 0);
  }
  100% {
    transform: translate3d(140vw, 0, 0);
  }
}

@keyframes orbFloat {
  0%,
  100% {
    transform: translate3d(0, 0, 0);
  }
  50% {
    transform: translate3d(0, -10px, 0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .aero-cloud,
  .aero-orb {
    animation: none;
  }
  .cloud-1 {
    transform: translate3d(28vw, 0, 0);
  }
  .cloud-2 {
    transform: translate3d(62vw, 0, 0);
  }
  .cloud-3 {
    transform: translate3d(14vw, 0, 0);
  }
}
</style>
