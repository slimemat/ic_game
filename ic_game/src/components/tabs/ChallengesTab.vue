<script setup>
import gamesData from "../../data/games.json";
import LobbySectionHeader from "../ui/lobby/LobbySectionHeader.vue";
import AeroGlassCard from "../ui/lobby/AeroGlassCard.vue";
import ChallengeThumbnail from "../ui/lobby/ChallengeThumbnail.vue";
import AeroActionButton from "../ui/lobby/AeroActionButton.vue";

defineEmits(["select-game"]);
</script>

<template>
  <div class="tab-content">
    <LobbySectionHeader
      :title="$t('hub.challenges.title')"
      :subtitle="$t('hub.challenges.subtitle')"
    />

    <ul class="games-list">
      <li v-for="game in gamesData" :key="game.id">
        <AeroGlassCard padding="sm" class="game-row-card">
          <ChallengeThumbnail
            :src="game.previewImage"
            :category="game.category"
            :icon="game.icon"
          />

          <div class="game-info">
            <span class="game-category-pill">
              {{ $t(`global.categories.${game.category}`) }}
            </span>
            <strong class="game-title">{{
              $t(`games.${game.id}.title`)
            }}</strong>
            <p class="game-desc">
              {{ $t(`games.${game.id}.description`) }}
            </p>
          </div>

          <AeroActionButton
            variant="primary"
            size="sm"
            icon="play"
            class="game-play-btn"
            @click="$emit('select-game', game.id)"
          >
            {{ $t("global.buttons.play") }}
          </AeroActionButton>
        </AeroGlassCard>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.games-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.game-row-card {
  display: flex;
  align-items: center;
  gap: 12px;
}

.game-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.game-category-pill {
  align-self: flex-start;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(14, 165, 233, 0.14);
  border: 1px solid rgba(14, 165, 233, 0.25);
  font-family: var(--font-mono);
  font-size: 0.64rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #0369a1;
}

.game-title {
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.2;
  color: var(--aero-text-primary, #0f172a);
}

.game-desc {
  margin: 0;
  font-size: 0.82rem;
  line-height: 1.3;
  color: var(--aero-text-secondary, #334155);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.game-play-btn {
  flex-shrink: 0;
}

@media (max-width: 390px) {
  .game-row-card {
    gap: 10px;
  }
}
</style>
