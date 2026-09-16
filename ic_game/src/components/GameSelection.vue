<script setup>
import { ref, computed } from "vue";
import gamesData from "../data/games.json";

defineEmits(["select", "back"]);

const searchQuery = ref("");
const selectedCategory = ref("");

const categories = computed(() => {
  const cats = new Set(gamesData.map((g) => g.category));
  return Array.from(cats);
});

const filteredGames = computed(() => {
  return gamesData.filter((game) => {
    const matchesSearch = game.title
      .toLowerCase()
      .includes(searchQuery.value.toLowerCase());
    const matchesCategory = selectedCategory.value
      ? game.category === selectedCategory.value
      : true;
    return matchesSearch && matchesCategory;
  });
});
</script>

<template>
  <main class="selection-screen">
    <div class="header">
      <button class="back-btn" @click="$emit('back')">
        {{ $t("selection.back_button") }}
      </button>
      <div class="filters">
        <input
          type="text"
          v-model="searchQuery"
          :placeholder="$t('selection.search_placeholder')"
          class="search-input"
        />
        <select v-model="selectedCategory" class="category-select">
          <option value="">{{ $t("selection.all_categories") }}</option>
          <option v-for="cat in categories" :key="cat" :value="cat">
            {{ $t(`global.categories.${cat}`) }}
          </option>
        </select>
      </div>
    </div>

    <div class="game-grid-container">
      <div v-if="filteredGames.length === 0" class="no-results">
        {{ $t("selection.no_results") }}
      </div>
      <nav v-else class="game-grid" aria-label="Available games">
        <button
          v-for="game in filteredGames"
          :key="game.id"
          class="game-card"
          type="button"
          @click="$emit('select', game.id)"
        >
          <img
            :src="game.previewImage"
            :alt="$t(`games.${game.id}.title`)"
            class="game-img"
          />
          <div class="game-info">
            <span class="game-category">{{
              $t(`global.categories.${game.category}`)
            }}</span>
            <strong>{{ $t(`games.${game.id}.title`) }}</strong>
          </div>
        </button>
      </nav>
    </div>
  </main>
</template>

<style scoped>
.selection-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.header {
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.back-btn {
  align-self: flex-start;
  background: none;
  border: none;
  color: var(--light-green);
  cursor: pointer;
  padding: 8px 0;
  font-weight: 600;
}

.filters {
  display: flex;
  gap: 12px;
}

.search-input,
.category-select {
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #36535b;
  background: var(--background-dark);
  color: #edf2f4;
  font-family: inherit;
}

.search-input {
  flex: 1;
}

.game-grid-container {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 24px;
}

/* Esconde scrollbar no Chrome/Safari/Edge mas mantém funcionalidade */
.game-grid-container::-webkit-scrollbar {
  width: 6px;
}
.game-grid-container::-webkit-scrollbar-thumb {
  background-color: var(--accent-color);
  border-radius: 10px;
}

.game-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
}

.game-card {
  display: flex;
  flex-direction: column;
  background: var(--background-dark);
  border: 1px solid #36535b;
  border-radius: 12px;
  overflow: hidden;
  padding: 0;
  cursor: pointer;
  text-align: left;
  transition:
    transform 0.2s,
    border-color 0.2s;
}

.game-card:hover {
  transform: translateY(-4px);
  border-color: var(--accent-color);
}

.game-img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
}

.game-info {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.game-category {
  font-size: 0.75rem;
  color: var(--accent-color);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.game-info strong {
  font-size: 1rem;
  line-height: 1.2;
}

.no-results {
  text-align: center;
  color: var(--background-light);
  margin-top: 40px;
}
</style>
