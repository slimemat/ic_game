<script setup>
import gamesData from "../../data/games.json";

defineEmits(["select-game"]);
</script>

<template>
  <div class="tab-content">
    <h2>{{ $t("hub.challenges.title") }}</h2>
    <p class="subtitle">{{ $t("hub.challenges.subtitle") }}</p>

    <ul class="games-grid">
      <li v-for="game in gamesData" :key="game.id">
        <button
          type="button"
          class="game-card"
          @click="$emit('select-game', game.id)"
        >
          <img
            :src="game.previewImage"
            alt=""
            class="game-img"
            loading="lazy"
          />
          <span class="game-body">
            <span class="game-category">
              {{ $t(`global.categories.${game.category}`) }}
            </span>
            <strong>{{ $t(`games.${game.id}.title`) }}</strong>
            <span class="game-desc">
              {{ $t(`games.${game.id}.description`) }}
            </span>
            <span class="play-label">{{ $t("global.buttons.play") }}</span>
          </span>
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.subtitle {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.games-grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
}

@media (min-width: 520px) {
  .games-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.game-card {
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 0;
  overflow: hidden;
  text-align: left;
  color: inherit;
  background: var(--bg-panel);
  border: 1px solid var(--border-default);
  border-radius: 12px;
  cursor: pointer;
  transition:
    transform 0.2s,
    border-color 0.2s;
}

.game-card:hover,
.game-card:focus-visible {
  border-color: var(--accent-color);
  transform: translateY(-2px);
}

.game-card:active {
  transform: scale(0.98);
}

.game-img {
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
}

.game-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px 14px;
}

.game-category {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent-color);
}

.game-body strong {
  font-size: 1.05rem;
}

.game-desc {
  color: var(--text-muted);
  font-size: 0.88rem;
}

.play-label {
  align-self: flex-start;
  margin-top: 8px;
  padding: 8px 16px;
  border-radius: 6px;
  background: var(--accent-color);
  color: #fff;
  font-weight: 700;
  font-size: 0.9rem;
}
</style>
