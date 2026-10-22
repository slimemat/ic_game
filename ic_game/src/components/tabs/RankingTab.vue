<script setup>
import { useLocalRanking } from "../../composables/useLocalRanking";

const MEDALS = ["🥇", "🥈", "🥉"];
const { ranking } = useLocalRanking();
</script>

<template>
  <div class="tab-content">
    <h2>🏆 {{ $t("hub.ranking.title") }}</h2>

    <ol class="ranking-list">
      <li
        v-for="player in ranking"
        :key="player.id"
        class="ranking-item"
        :class="{ 'is-me': player.isMe }"
      >
        <span class="rank-pos">
          {{ MEDALS[player.position - 1] ?? `#${player.position}` }}
        </span>
        <span class="rank-name">
          {{ player.name }}
          <em v-if="player.isMe" class="rank-you">
            {{ $t("hub.ranking.you") }}
          </em>
        </span>
        <span class="rank-score">
          {{ $t("hub.ranking.xp", { xp: player.xp }) }}
        </span>
      </li>
    </ol>

    <p class="note">{{ $t("hub.ranking.note") }}</p>
  </div>
</template>

<style scoped>
.ranking-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: var(--bg-panel);
  border: 1px solid var(--border-default);
  border-radius: 8px;
}

.ranking-item.is-me {
  background: #2b4c7e;
  border-color: #ffd700;
}

.rank-pos {
  width: 40px;
  font-weight: 700;
  color: #ffd700;
}

.rank-name {
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
}

.rank-you {
  margin-left: 6px;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-style: normal;
  color: var(--light-green);
}

.rank-score {
  font-weight: 700;
  color: var(--color-success);
}

.note {
  margin: 0;
  font-size: 0.78rem;
  color: var(--text-dim);
}
</style>
