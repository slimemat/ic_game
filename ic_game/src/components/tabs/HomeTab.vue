<script setup>
import AeroGlassCard from "../ui/lobby/AeroGlassCard.vue";
import AeroActionButton from "../ui/lobby/AeroActionButton.vue";
import AppIcon from "../ui/AppIcon.vue";
import { useRestSummary } from "../../composables/useRestSummary";

defineEmits(["start-story"]);

const { summary } = useRestSummary();
</script>

<template>
  <div class="tab-content home-hero">
    <!-- 1. Compact Top Status Card (Glass) -->
    <AeroGlassCard padding="sm" class="status-card">
      <div class="status-top-row">
        <div class="role-emblem" aria-hidden="true">
          <AppIcon name="briefcase" :size="20" />
        </div>
        <div class="role-meta">
          <span class="role-eyebrow">{{ $t("restPanel.rank_label") }}</span>
          <strong class="role-title">{{ summary.rank.title }}</strong>
        </div>
        <span class="xp-total-pill">
          {{ $t("hub.ranking.xp", { xp: summary.totalXp }) }}
        </span>
      </div>

      <div class="xp-progress-block">
        <div
          class="aero-xp-bar"
          role="progressbar"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-valuenow="summary.xp.percent"
          :aria-label="$t('story.dashboard.career_title')"
        >
          <div
            class="aero-xp-fill"
            :style="{ width: summary.xp.percent + '%' }"
          ></div>
        </div>
        <p class="xp-caption">
          <template v-if="summary.xp.isMax">
            {{ $t("story.dashboard.max_rank") }}
          </template>
          <template v-else>
            {{
              $t("story.dashboard.xp_progress", {
                current: summary.xp.current,
                target: summary.xp.target,
              })
            }}
          </template>
        </p>
      </div>
    </AeroGlassCard>

    <!-- 2. Airy Center Space showcasing Chapter Sky Backdrop -->
    <div class="hero-spacer">
      <span class="chapter-pill">
        <AppIcon name="sparkles" :size="14" />
        <span>
          {{
            $t("hub.home.chapter_badge", {
              chapter: summary.chapterNumber,
              day: summary.currentDay,
            })
          }}
        </span>
      </span>
    </div>

    <!-- 3. Bottom Floating Primary Play Card -->
    <AeroGlassCard variant="elevated" padding="md" class="play-card">
      <template v-if="summary.mission">
        <div class="mission-row">
          <div class="mission-icon-badge" aria-hidden="true">
            <AppIcon name="story" :size="22" />
          </div>
          <div class="mission-copy">
            <div class="mission-meta-line">
              <span class="mission-eyebrow">
                {{
                  $t("story.dashboard.ticket_eyebrow", {
                    num: summary.mission.number,
                  })
                }}
                &middot;
                {{
                  $t("story.dashboard.task_goal", {
                    count: summary.mission.goal,
                  })
                }}
              </span>
              <span class="reward-pill">
                {{
                  $t("story.dashboard.reward_short", {
                    xp: summary.mission.reward,
                  })
                }}
              </span>
            </div>
            <h2 class="mission-title">{{ summary.mission.title }}</h2>
          </div>
        </div>

        <AeroActionButton
          variant="primary"
          size="lg"
          block
          icon="play"
          @click="$emit('start-story')"
        >
          {{
            summary.hasProgress
              ? $t("hub.home.btn_continue")
              : $t("hub.home.btn_start")
          }}
        </AeroActionButton>
      </template>

      <div v-else class="all-done-block">
        <p class="all-done-copy">{{ $t("hub.home.all_done") }}</p>
        <AeroActionButton
          variant="secondary"
          size="md"
          block
          icon="play"
          @click="$emit('start-story')"
        >
          {{ $t("hub.home.btn_continue") }}
        </AeroActionButton>
      </div>
    </AeroGlassCard>
  </div>
</template>

<style scoped>
.home-hero {
  min-height: 100%;
  justify-content: space-between;
  gap: 14px;
}

/* ── Top Status Card ── */
.status-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.status-top-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.role-emblem {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  color: #ffffff;
  background: linear-gradient(135deg, #38bdf8 0%, #0d9488 100%);
  border: 1px solid rgba(255, 255, 255, 0.75);
  box-shadow:
    0 4px 10px rgba(14, 165, 233, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.65);
}

.role-meta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.role-eyebrow {
  font-family: var(--font-mono);
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--aero-text-muted, #475569);
}

.role-title {
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1.2;
  color: var(--aero-text-primary, #0f172a);
}

.xp-total-pill {
  flex-shrink: 0;
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(14, 165, 233, 0.14);
  border: 1px solid rgba(14, 165, 233, 0.32);
  font-family: var(--font-mono);
  font-size: 0.74rem;
  font-weight: 700;
  color: #0369a1;
}

.xp-progress-block {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.aero-xp-bar {
  height: 10px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.09);
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: inset 0 1px 3px rgba(15, 23, 42, 0.14);
  overflow: hidden;
}

.aero-xp-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #38bdf8 0%, #14b8a6 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.55);
  transition: width 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.xp-caption {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--aero-text-secondary, #334155);
}

/* ── Airy Center Hero Space ── */
.hero-spacer {
  flex: 1;
  min-height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chapter-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 6px 18px rgba(14, 74, 110, 0.12);
  font-family: var(--font-mono);
  font-size: 0.74rem;
  font-weight: 700;
  color: #0369a1;
}

/* ── Bottom Floating Play Card ── */
.play-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.mission-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mission-icon-badge {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  color: #ffffff;
  background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
  border: 1px solid rgba(255, 255, 255, 0.75);
  box-shadow:
    0 5px 12px rgba(2, 132, 199, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.65);
}

.mission-copy {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.mission-meta-line {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.mission-eyebrow {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--aero-accent, #0284c7);
}

.reward-pill {
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(20, 184, 166, 0.16);
  border: 1px solid rgba(15, 118, 110, 0.25);
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--aero-teal-deep, #0f766e);
}

.mission-title {
  margin: 0;
  font-size: 1.08rem;
  font-weight: 700;
  line-height: 1.25;
  color: var(--aero-text-primary, #0f172a);
}

.all-done-block {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.all-done-copy {
  margin: 0;
  font-size: 0.94rem;
  line-height: 1.4;
  color: var(--aero-text-secondary, #334155);
}

@media (prefers-reduced-motion: reduce) {
  .aero-xp-fill {
    transition: none;
  }
}
</style>
