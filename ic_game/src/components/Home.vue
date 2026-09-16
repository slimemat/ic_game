<script setup>
import { computed } from "vue";
import gamesData from "../data/games.json";

const emit = defineEmits(["play", "choose-games"]);

const suggestedGame = computed(() => gamesData[0]);
const totalGames = gamesData.length;
</script>

<template>
  <main class="home-screen">
    <div class="home-content">
      <div class="header">
        <p class="eyebrow">{{ $t("home.welcome") }}</p>
        <h1>{{ $t("home.title") }}</h1>
      </div>

      <div class="suggested-game">
        <img
          :src="suggestedGame.previewImage"
          :alt="$t(`games.${suggestedGame.id}.title`)"
          class="preview-image"
        />
        <div class="game-info">
          <h2>{{ $t(`games.${suggestedGame.id}.title`) }}</h2>
          <p>{{ $t(`global.categories.${suggestedGame.category}`) }}</p>
        </div>
      </div>

      <div class="actions">
        <button class="btn-primary" @click="$emit('play', suggestedGame.id)">
          {{ $t("global.buttons.play") }}
        </button>
        <button class="btn-secondary" @click="$emit('choose-games')">
          {{ $t("global.buttons.choose_games") }}
        </button>
      </div>

      <div class="stats">
        <p>
          <strong>{{ totalGames }}</strong>
          {{ $t("home.available_games").replace("{count}", "") }}
        </p>
        <p>
          {{ $t("home.level") }}
          <span class="highlight">{{ $t("home.beginner") }}</span>
        </p>
      </div>
    </div>
  </main>
</template>

<style scoped>
.home-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: clamp(24px, 6vw, 40px);
  max-width: 600px;
  margin: 0 auto;
  width: 100%;
}

.home-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
  gap: 32px;
}

.header {
  text-align: center;
}

.header h1 {
  font-size: clamp(2rem, 8vw, 3.5rem);
  margin-top: 8px;
}

.suggested-game {
  background: var(--background-dark);
  border: 1px solid #36535b;
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.preview-image {
  width: 100%;
  aspect-ratio: 4/3;
  object-fit: cover;
}

.game-info {
  padding: 16px;
  text-align: center;
}

.game-info h2 {
  margin: 0 0 4px;
  font-size: 1.5rem;
}

.game-info p {
  margin: 0;
  color: var(--accent-color);
  font-size: 0.9rem;
  font-weight: 500;
}

.actions {
  display: flex;
  gap: 16px;
  flex-direction: column;
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
  padding: 16px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1.1rem;
  cursor: pointer;
  transition:
    transform 0.1s,
    opacity 0.2s;
  border: none;
}

.btn-primary:active,
.btn-secondary:active {
  transform: scale(0.98);
}

.btn-primary {
  background: var(--accent-color);
  color: #fff;
}

.btn-secondary {
  background: var(--background-dark);
  color: var(--light-green);
  border: 1px solid var(--light-green);
}

.stats {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--background-light);
  font-size: 0.9rem;
}

.stats p {
  margin: 0;
}

.highlight {
  color: var(--medium-green);
  font-weight: bold;
}
</style>
