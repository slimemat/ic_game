<script setup>
import AppIcon from "../ui/AppIcon.vue";
import LobbySectionHeader from "../ui/lobby/LobbySectionHeader.vue";
import AeroGlassCard from "../ui/lobby/AeroGlassCard.vue";
import { useLocalRanking } from "../../composables/useLocalRanking";

const MEDALS = ["medal1", "medal2", "medal3"];
const { ranking } = useLocalRanking();

function podiumClass(position) {
  if (position === 1) return "is-gold";
  if (position === 2) return "is-silver";
  if (position === 3) return "is-bronze";
  return "";
}
</script>

<template>
  <div class="tab-content">
    <LobbySectionHeader
      :title="$t('hub.ranking.title')"
      :subtitle="$t('hub.ranking.subtitle')"
    />

    <ol class="ranking-list">
      <li v-for="player in ranking" :key="player.id">
        <AeroGlassCard
          :variant="player.isMe ? 'accent' : 'default'"
          padding="sm"
          class="ranking-item"
          :class="[podiumClass(player.position), { 'is-me': player.isMe }]"
        >
          <span class="rank-pos" :class="podiumClass(player.position)">
            <AppIcon
              v-if="MEDALS[player.position - 1]"
              :name="MEDALS[player.position - 1]"
              :size="22"
            />
            <template v-else>#{{ player.position }}</template>
          </span>

          <div class="rank-avatar" aria-hidden="true">
            <img
              v-if="player.avatarSrc"
              :src="player.avatarSrc"
              alt=""
              class="rank-avatar-img"
            />
            <AppIcon v-else name="user" :size="18" />
          </div>

          <div class="rank-identity">
            <div class="rank-name-row">
              <strong class="rank-name">{{ player.name }}</strong>
              <span v-if="player.isMe" class="rank-you-pill">
                {{ $t("hub.ranking.you") }}
              </span>
            </div>
            <span v-if="player.roleLabel" class="rank-role">
              {{ player.roleLabel }}
            </span>
          </div>

          <span class="rank-score-pill">
            {{ $t("hub.ranking.xp", { xp: player.xp }) }}
          </span>
        </AeroGlassCard>
      </li>
    </ol>
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
}

.ranking-item.is-me {
  border-color: rgba(14, 165, 233, 0.72);
  box-shadow:
    0 10px 26px rgba(2, 132, 199, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.98);
}

.rank-pos {
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  font-family: var(--font-mono);
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--aero-text-secondary, #334155);
  background: rgba(15, 23, 42, 0.06);
}

.rank-pos.is-gold {
  background: rgba(250, 204, 21, 0.24);
  color: #b45309;
  border: 1px solid rgba(234, 179, 8, 0.45);
}

.rank-pos.is-silver {
  background: rgba(148, 163, 184, 0.22);
  color: #475569;
  border: 1px solid rgba(148, 163, 184, 0.45);
}

.rank-pos.is-bronze {
  background: rgba(217, 119, 6, 0.18);
  color: #9a3412;
  border: 1px solid rgba(217, 119, 6, 0.35);
}

.rank-avatar {
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: linear-gradient(135deg, #e0f2fe 0%, #ccfbf1 100%);
  border: 1.5px solid rgba(255, 255, 255, 0.92);
  color: #0369a1;
  box-shadow: 0 3px 8px rgba(14, 74, 110, 0.12);
}

.rank-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  image-rendering: pixelated;
}

.rank-identity {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.rank-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.rank-name {
  font-size: 0.96rem;
  font-weight: 700;
  color: var(--aero-text-primary, #0f172a);
  overflow-wrap: anywhere;
}

.rank-you-pill {
  padding: 2px 7px;
  border-radius: 999px;
  background: linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%);
  color: #ffffff;
  font-family: var(--font-mono);
  font-size: 0.64rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.rank-role {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--aero-text-muted, #475569);
}

.rank-score-pill {
  flex-shrink: 0;
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(20, 184, 166, 0.14);
  border: 1px solid rgba(15, 118, 110, 0.24);
  font-family: var(--font-mono);
  font-size: 0.76rem;
  font-weight: 700;
  color: var(--aero-teal-deep, #0f766e);
}
</style>
