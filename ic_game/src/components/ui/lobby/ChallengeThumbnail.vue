<script setup>
import { computed } from "vue";
import AppIcon from "../AppIcon.vue";

const props = defineProps({
  src: {
    type: String,
    default: null,
  },
  category: {
    type: String,
    default: "logic",
  },
  icon: {
    type: String,
    default: "gamepad",
  },
});

const CATEGORY_CLASS_MAP = {
  platform: "is-platform",
  logic: "is-logic",
  educational: "is-educational",
  arcade: "is-arcade",
};

const categoryClass = computed(
  () => CATEGORY_CLASS_MAP[props.category] || "is-logic",
);
</script>

<template>
  <div class="challenge-thumb" :class="categoryClass" aria-hidden="true">
    <img v-if="src" :src="src" alt="" class="thumb-img" loading="lazy" />
    <div v-else class="thumb-fallback">
      <span class="thumb-sheen"></span>
      <AppIcon :name="icon" :size="28" class="thumb-icon" />
    </div>
  </div>
</template>

<style scoped>
.challenge-thumb {
  position: relative;
  flex-shrink: 0;
  width: 82px;
  height: 72px;
  border-radius: 12px;
  overflow: hidden;
  border: 1.5px solid rgba(255, 255, 255, 0.88);
  box-shadow:
    0 4px 12px rgba(14, 74, 110, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.75);
}

.thumb-img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.thumb-fallback {
  position: relative;
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: #ffffff;
}

.challenge-thumb.is-platform .thumb-fallback {
  background: linear-gradient(135deg, #38bdf8 0%, #0284c7 100%);
}

.challenge-thumb.is-logic .thumb-fallback {
  background: linear-gradient(135deg, #2dd4bf 0%, #0d9488 100%);
}

.challenge-thumb.is-educational .thumb-fallback {
  background: linear-gradient(135deg, #60a5fa 0%, #4f46e5 100%);
}

.challenge-thumb.is-arcade .thumb-fallback {
  background: linear-gradient(135deg, #fbbf24 0%, #ea580c 100%);
}

.thumb-sheen {
  position: absolute;
  inset: 0 0 48% 0;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.42) 0%,
    rgba(255, 255, 255, 0) 100%
  );
  pointer-events: none;
}

.thumb-icon {
  position: relative;
  z-index: 1;
  filter: drop-shadow(0 2px 4px rgba(15, 23, 42, 0.25));
}
</style>
