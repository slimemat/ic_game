<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useGameSessionStore } from "../../stores/gameSession";
import { useRestSummary } from "../../composables/useRestSummary";
import LobbySectionHeader from "../ui/lobby/LobbySectionHeader.vue";
import AeroGlassCard from "../ui/lobby/AeroGlassCard.vue";
import ArmCustomizerSection from "../ui/lobby/ArmCustomizerSection.vue";
import AppIcon from "../ui/AppIcon.vue";

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
    <LobbySectionHeader :title="$t('hub.profile.title')" />

    <AeroGlassCard variant="elevated" padding="md" class="profile-card">
      <div class="profile-top">
        <div
          class="profile-avatar"
          :style="{ '--rank-color': summary.rank.badgeColor }"
          aria-hidden="true"
        >
          <AppIcon name="user" :size="28" />
        </div>
        <div class="profile-info">
          <strong class="profile-name">{{ playerName }}</strong>
          <span class="profile-rank-pill">{{ summary.rank.title }}</span>
          <span class="profile-hint">{{ nextRankHint }}</span>
        </div>
      </div>

      <div
        class="profile-xp-bar"
        role="progressbar"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-valuenow="summary.xp.percent"
        :aria-label="$t('story.dashboard.career_title')"
      >
        <div
          class="profile-xp-fill"
          :style="{ width: summary.xp.percent + '%' }"
        ></div>
      </div>
    </AeroGlassCard>

    <dl class="stats-grid">
      <AeroGlassCard
        v-for="stat in stats"
        :key="stat.key"
        as="div"
        padding="sm"
        class="stat"
      >
        <dt>{{ stat.label }}</dt>
        <dd>{{ stat.value }}</dd>
      </AeroGlassCard>
    </dl>

    <ArmCustomizerSection />
  </div>
</template>

<style scoped>
.profile-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.profile-top {
  display: flex;
  align-items: center;
  gap: 14px;
}

.profile-avatar {
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  color: #ffffff;
  background: linear-gradient(
    135deg,
    #38bdf8 0%,
    var(--rank-color, #0d9488) 100%
  );
  border: 2px solid rgba(255, 255, 255, 0.9);
  box-shadow:
    0 6px 14px rgba(14, 74, 110, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.7);
}

.profile-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
  min-width: 0;
}

.profile-name {
  font-size: 1.18rem;
  font-weight: 700;
  color: var(--aero-text-primary, #0f172a);
  overflow-wrap: anywhere;
}

.profile-rank-pill {
  padding: 2px 10px;
  border-radius: 999px;
  background: rgba(20, 184, 166, 0.16);
  border: 1px solid rgba(15, 118, 110, 0.25);
  color: var(--aero-teal-deep, #0f766e);
  font-size: 0.78rem;
  font-weight: 700;
}

.profile-hint {
  font-family: var(--font-mono);
  font-size: 0.74rem;
  font-weight: 600;
  color: var(--aero-text-muted, #475569);
}

.profile-xp-bar {
  height: 10px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.09);
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: inset 0 1px 3px rgba(15, 23, 42, 0.14);
  overflow: hidden;
}

.profile-xp-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #38bdf8 0%, #14b8a6 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.55);
  transition: width 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin: 0;
}

.stat {
  text-align: center;
}

.stat dt {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--aero-text-muted, #475569);
}

.stat dd {
  margin: 4px 0 0;
  font-size: 1.32rem;
  font-weight: 700;
  color: var(--aero-accent, #0284c7);
}

@media (prefers-reduced-motion: reduce) {
  .profile-xp-fill {
    transition: none;
  }
}
</style>
