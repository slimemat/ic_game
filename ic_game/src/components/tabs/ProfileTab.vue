<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useGameSessionStore } from "../../stores/gameSession";
import { useRestSummary } from "../../composables/useRestSummary";

const { t } = useI18n();
const session = useGameSessionStore();
const { summary } = useRestSummary();

const playerName = computed(
  () => session.playerName || t("hub.profile.player_fallback"),
);

const nextRankHint = computed(() => {
  const { xp } = summary.value;
  if (xp.isMax) return t("story.dashboard.max_rank");
  return t("hub.profile.next_rank_hint", {
    xp: Math.max(0, xp.target - xp.current),
    rank: xp.nextRankTitle,
  });
});

const stats = computed(() => [
  {
    key: "xp",
    label: t("hub.profile.stat_xp"),
    value: summary.value.totalXp,
  },
  {
    key: "stages",
    label: t("hub.profile.stat_stages"),
    value: `${summary.value.completedCount}/${summary.value.totalCount}`,
  },
  {
    key: "level",
    label: t("hub.profile.stat_level"),
    value: session.currentLevel,
  },
]);
</script>

<template>
  <div class="tab-content">
    <h2>{{ $t("hub.profile.title") }}</h2>

    <section class="profile-card">
      <div
        class="rank-badge"
        :style="{ '--rank-color': summary.rank.badgeColor }"
        aria-hidden="true"
      >
        {{ summary.rank.badgeLabel }}
      </div>
      <div class="profile-info">
        <strong class="profile-name">{{ playerName }}</strong>
        <span class="profile-rank">{{ summary.rank.title }}</span>
        <span class="profile-hint">{{ nextRankHint }}</span>
      </div>
    </section>

    <dl class="stats-grid">
      <div v-for="stat in stats" :key="stat.key" class="stat">
        <dt>{{ stat.label }}</dt>
        <dd>{{ stat.value }}</dd>
      </div>
    </dl>
  </div>
</template>

<style scoped>
.profile-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: var(--bg-panel);
  border: 1px solid var(--border-default);
  border-radius: 14px;
}

.rank-badge {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  padding: 4px;
  background: var(--rank-color, #718096);
  border: 2px solid rgba(0, 0, 0, 0.35);
  border-radius: 10px;
  box-shadow: 0 3px 0 rgba(0, 0, 0, 0.35);
  color: #fff;
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 700;
  line-height: 1.15;
  text-align: center;
}

.profile-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.profile-name {
  font-size: 1.2rem;
  overflow-wrap: anywhere;
}

.profile-rank {
  color: var(--light-green);
  font-weight: 600;
}

.profile-hint {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--text-muted);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin: 0;
}

.stat {
  padding: 12px 8px;
  text-align: center;
  background: var(--bg-panel);
  border: 1px solid var(--border-default);
  border-radius: 10px;
}

.stat dt {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.stat dd {
  margin: 4px 0 0;
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--color-warning);
}
</style>
