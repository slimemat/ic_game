<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useProgressionStore } from "../../stores/progression";

const props = defineProps({
  isOpen: { type: Boolean, default: false },
});

const emit = defineEmits(["continue"]);

const { t } = useI18n();
const progression = useProgressionStore();

const rankTitle = computed(() => {
  const key = progression.currentRank?.titleKey;
  return key ? t(key) : "Analista";
});

const badgeLabel = computed(() => {
  return progression.currentRank?.badgeLabel || "PROMOÇÃO";
});

const badgeColor = computed(() => {
  return progression.currentRank?.badgeColor || "#319795";
});
</script>

<template>
  <div v-if="isOpen" class="modal-overlay">
    <div class="modal-backdrop"></div>
    <div class="promotion-card anim-pop-in">
      <div class="card-header">
        <span class="badge" :style="{ backgroundColor: badgeColor }">
          {{ badgeLabel }}
        </span>
      </div>

      <div class="card-body">
        <h2 class="title">{{ $t("story.promotion.title") }}</h2>
        <div class="rank-display" :style="{ borderColor: badgeColor }">
          <span class="label">{{ $t("story.promotion.badge") }}</span>
          <span class="rank-name" :style="{ color: badgeColor }">{{
            rankTitle
          }}</span>
        </div>
        <p class="message">{{ $t("story.promotion.message") }}</p>
        <div class="xp-summary">
          <span>{{
            $t("story.dashboard.current_xp", { xp: progression.totalXp })
          }}</span>
        </div>
      </div>

      <div class="card-footer">
        <button class="btn-continue" @click="$emit('continue')">
          {{ $t("story.promotion.btn_continue") }} ➔
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
}

.modal-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(8px);
}

.promotion-card {
  position: relative;
  z-index: 10;
  width: 90%;
  max-width: 500px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
  overflow: hidden;
  text-align: center;
  border: 1px solid rgba(226, 232, 240, 0.8);
}

.card-header {
  padding: 1.5rem 1.5rem 0.5rem 1.5rem;
  display: flex;
  justify-content: center;
}

.badge {
  color: #fff;
  font-weight: 800;
  font-size: 0.8rem;
  letter-spacing: 1px;
  padding: 0.35rem 1rem;
  border-radius: 9999px;
  text-transform: uppercase;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.card-body {
  padding: 1rem 2rem;
}

.title {
  margin: 0 0 1rem 0;
  font-size: 1.6rem;
  color: #1a202c;
  font-weight: 800;
}

.rank-display {
  display: inline-flex;
  flex-direction: column;
  padding: 1rem 2rem;
  border-radius: 12px;
  background: #f7fafc;
  border: 2px solid #e2e8f0;
  margin-bottom: 1.25rem;
  min-width: 260px;
}

.rank-display .label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #718096;
  letter-spacing: 0.5px;
  margin-bottom: 0.25rem;
}

.rank-display .rank-name {
  font-size: 1.5rem;
  font-weight: 900;
}

.message {
  color: #4a5568;
  font-size: 1rem;
  line-height: 1.5;
  margin: 0 0 1.25rem 0;
}

.xp-summary {
  font-size: 0.95rem;
  font-weight: 700;
  color: #2b6cb0;
  background: #ebf8ff;
  display: inline-block;
  padding: 0.4rem 1rem;
  border-radius: 8px;
}

.card-footer {
  padding: 1.25rem 2rem 2rem 2rem;
}

.btn-continue {
  background: linear-gradient(180deg, #4fd1c5 0%, #319795 100%);
  color: #fff;
  border: none;
  font-size: 1.1rem;
  font-weight: 700;
  padding: 0.85rem 2rem;
  border-radius: 10px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(49, 151, 149, 0.35);
  transition:
    transform 0.2s,
    box-shadow 0.2s;
  width: 100%;
}

.btn-continue:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(49, 151, 149, 0.45);
}

.anim-pop-in {
  animation: pop-in 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes pop-in {
  from {
    transform: scale(0.85);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
