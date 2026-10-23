<script setup>
import { computed } from "vue";
import gamesData from "../../data/games.json";
import RestPanel from "../ui/RestPanel.vue";
import { useRestSummary } from "../../composables/useRestSummary";

defineEmits(["start-story", "select-game", "navigate"]);

const { summary } = useRestSummary();

const featuredGame = computed(
  () => gamesData.find((g) => g.id === "pattern-recognition") ?? gamesData[0],
);
const totalGames = gamesData.length;
</script>

<template>
  <div class="tab-content">
    <RestPanel :summary="summary" @continue="$emit('start-story')" />

    <section class="featured" :aria-label="$t('home.pick_of_day')">
      <div class="featured-header">
        <p class="eyebrow">{{ $t("home.pick_of_day") }}</p>
        <p class="pick-subtitle">{{ $t("home.pick_subtitle") }}</p>
      </div>

      <article class="featured-card">
        <img
          :src="featuredGame.previewImage"
          alt=""
          class="featured-img"
          loading="lazy"
        />
        <div class="featured-info">
          <h3>{{ $t(`games.${featuredGame.id}.title`) }}</h3>
          <p>{{ $t(`global.categories.${featuredGame.category}`) }}</p>
        </div>
      </article>

      <div class="actions">
        <button
          type="button"
          class="btn-primary"
          @click="$emit('select-game', featuredGame.id)"
        >
          {{ $t("global.buttons.play") }}
        </button>
        <button
          type="button"
          class="btn-secondary"
          @click="$emit('navigate', 'challenges')"
        >
          {{ $t("home.cta_choose") }}
        </button>
      </div>

      <p class="stats">
        {{ $t("home.available_games", { count: totalGames }) }}
      </p>
    </section>
  </div>
</template>

<style scoped>
.featured {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.featured-header .eyebrow {
  margin-bottom: 6px;
}

.pick-subtitle {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.featured-card {
  overflow: hidden;
  background: var(--bg-panel);
  border: 1px solid var(--border-default);
  border-radius: 16px;
}

.featured-img {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
}

.featured-info {
  padding: 14px;
  text-align: center;
}

.featured-info h3 {
  margin: 0 0 4px;
  font-size: 1.3rem;
}

.featured-info p {
  margin: 0;
  color: var(--accent-color);
  font-size: 0.9rem;
  font-weight: 500;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

@media (min-width: 480px) {
  .actions {
    flex-direction: row;
  }
  .actions button {
    flex: 1;
  }
}

.btn-primary,
.btn-secondary {
  min-height: 52px;
  padding: 14px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1.05rem;
  cursor: pointer;
  transition: transform 0.1s;
}

.btn-primary:active,
.btn-secondary:active {
  transform: scale(0.98);
}

.btn-primary {
  background: var(--accent-color);
  color: #fff;
  border: none;
}

.btn-secondary {
  background: transparent;
  color: var(--light-green);
  border: 1px solid var(--light-green);
}

.stats {
  margin: 0;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--background-light);
  font-size: 0.9rem;
  text-align: center;
}
</style>
