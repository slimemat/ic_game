<template>
  <div
    class="pixel-stars-container"
    role="img"
    :aria-label="`${clampedStars} / ${maxStars}`"
  >
    <div class="pixel-stars-row" aria-hidden="true">
      <div
        v-for="index in maxStars"
        :key="index"
        class="pixel-star-slot"
        :class="{
          'pixel-star-slot--filled': index <= clampedStars,
          'pixel-star-slot--center': index === 2 && maxStars === 3,
        }"
        :style="{ animationDelay: `${(index - 1) * 130 + 60}ms` }"
      >
        <svg
          class="pixel-star-svg"
          viewBox="0 0 16 16"
          shape-rendering="crispEdges"
          xmlns="http://www.w3.org/2000/svg"
        >
          <!-- Contorno externo em Pixel Art (16x16 grid) -->
          <path
            d="M7 1h2v2h2v2h4v2h-1v2h-1v2h1v3h-3v-1H9v-1H7v1H5v1H2v-3h1V9H2V7H1V5h4V3h2V1z"
            :fill="index <= clampedStars ? '#0f172a' : '#475569'"
          />

          <!-- Corpo interno da estrela -->
          <path
            d="M7 2h2v2h2v2h3v1h-1v2h-1v3h-1v-1H9v-1H7v1H5v1H4V9H3V7H2V6h3V4h2V2z"
            :fill="index <= clampedStars ? '#facc15' : '#cbd5e1'"
          />

          <!-- Brilho superior esquerdo em Pixel Art -->
          <path
            v-if="index <= clampedStars"
            d="M7 2h1v2H6v2H3v1h3V5h2V2z"
            fill="#fef08a"
          />
          <path v-else d="M7 2h1v2H6v2H3v1h3V5h2V2z" fill="#e2e8f0" />

          <!-- Sombreamento inferior direito em Pixel Art -->
          <path
            v-if="index <= clampedStars"
            d="M9 10h2v2h1v-2h1V7h1V6h-1v1h-2v2H9v1zm-4 1h2v-1H5v1z"
            fill="#ca8a04"
          />
          <path
            v-else
            d="M9 10h2v2h1v-2h1V7h1V6h-1v1h-2v2H9v1zm-4 1h2v-1H5v1z"
            fill="#94a3b8"
          />
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { MAX_STARS } from "../../game/logic/performanceRating";

const props = defineProps({
  stars: {
    type: Number,
    default: MAX_STARS,
  },
  maxStars: {
    type: Number,
    default: MAX_STARS,
  },
});

const clampedStars = computed(() => {
  return Math.min(
    props.maxStars,
    Math.max(1, Math.trunc(Number(props.stars) || MAX_STARS)),
  );
});
</script>

<style scoped>
.pixel-stars-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  user-select: none;
}

.pixel-stars-row {
  display: inline-flex;
  align-items: flex-end;
  justify-content: center;
  gap: 8px;
  padding: 6px 14px;
  background: #f1f5f9;
  border: 2px solid #0f172a;
  border-radius: 8px;
  box-shadow: 0 4px 0 #0f172a;
}

.pixel-star-slot {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.55;
  transform: scale(0.92);
}

.pixel-star-slot--center {
  width: 40px;
  height: 40px;
  margin-bottom: 3px;
}

.pixel-star-slot--filled {
  opacity: 1;
  transform: scale(1);
  animation: pixel-star-pop 0.36s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    backwards;
}

.pixel-star-svg {
  width: 100%;
  height: 100%;
  display: block;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  filter: drop-shadow(0 2px 0 rgba(15, 23, 42, 0.25));
}

@keyframes pixel-star-pop {
  0% {
    opacity: 0;
    transform: scale(0.3) translateY(6px);
  }
  70% {
    opacity: 1;
    transform: scale(1.16) translateY(-2px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@media (max-width: 420px) {
  .pixel-star-slot {
    width: 30px;
    height: 30px;
  }
  .pixel-star-slot--center {
    width: 36px;
    height: 36px;
  }
}
</style>
