<script setup>
defineProps({
  summary: { type: Object, required: true },
});
defineEmits(["continue"]);
</script>

<template>
  <section class="rest-panel" :aria-label="$t('restPanel.window_title')">
    <header class="rest-header">
      <div class="rest-controls" aria-hidden="true">
        <span class="dot dot-red"></span>
        <span class="dot dot-yellow"></span>
        <span class="dot dot-green"></span>
      </div>
      <span class="rest-window-title">{{ $t("restPanel.window_title") }}</span>
    </header>

    <div class="rest-body">
      <!-- Cargo + XP total -->
      <div class="rank-row">
        <div
          class="rank-badge"
          :style="{ '--rank-color': summary.rank.badgeColor }"
          aria-hidden="true"
        >
          {{ summary.rank.badgeLabel }}
        </div>
        <div class="rank-info">
          <span class="rank-eyebrow">{{ $t("restPanel.rank_label") }}</span>
          <strong class="rank-title">{{ summary.rank.title }}</strong>
          <span class="rank-xp">
            {{ $t("story.dashboard.current_xp", { xp: summary.totalXp }) }}
          </span>
        </div>
      </div>

      <!-- Barra de XP -->
      <div class="xp-block">
        <div
          class="xp-bar"
          role="progressbar"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-valuenow="summary.xp.percent"
          :aria-label="$t('story.dashboard.career_title')"
        >
          <div
            class="xp-fill"
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
            <span class="xp-next">
              {{
                $t("restPanel.next_rank", { rank: summary.xp.nextRankTitle })
              }}
            </span>
          </template>
        </p>
      </div>

      <!-- Chamados -->
      <div class="missions-block">
        <div class="mission-tabs">
          <span class="mission-tab mission-tab--main">
            {{ $t("restPanel.missions_available", summary.availableCount) }}
          </span>
          <span class="mission-tab mission-tab--meta">
            {{
              $t("restPanel.missions_done", {
                done: summary.completedCount,
                total: summary.totalCount,
              })
            }}
          </span>
        </div>

        <div class="mission-card">
          <div v-if="summary.mission" class="mission-sheet">
            <div class="mission-main">
              <div class="mission-icon" aria-hidden="true">DOC</div>
              <div class="mission-info">
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
                <h3>{{ summary.mission.title }}</h3>
                <span class="mission-reward">
                  {{
                    $t("story.dashboard.task_reward", {
                      xp: summary.mission.reward,
                    })
                  }}
                </span>
              </div>
            </div>
            <button
              type="button"
              class="btn-continue"
              @click="$emit('continue')"
            >
              {{ $t("restPanel.btn_continue") }}
            </button>
          </div>

          <p v-else class="mission-empty">{{ $t("restPanel.all_done") }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.rest-panel {
  width: 100%;
  background: #f8fafc;
  border: 2px solid #cbd5e1;
  border-radius: 14px;
  box-shadow: 0 6px 0 #1e293b;
  overflow: hidden;
  font-family: var(--font-main);
  color: #1e293b;
  text-align: left;
}

/* Cabeçalho estilo janela */
.rest-header {
  position: relative;
  display: flex;
  align-items: center;
  height: 40px;
  padding: 0 14px;
  background: linear-gradient(to bottom, #ffffff 0%, #e2e8f0 100%);
  border-bottom: 2px solid #cbd5e1;
}
.rest-controls {
  display: flex;
  gap: 7px;
}
.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}
.dot-red {
  background: #ff5f56;
  border: 1px solid #e0443e;
}
.dot-yellow {
  background: #ffbd2e;
  border: 1px solid #dea123;
}
.dot-green {
  background: #27c93f;
  border: 1px solid #1aab29;
}
.rest-window-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-family: var(--font-mono);
  font-size: 0.76rem;
  font-weight: 600;
  color: #334155;
  letter-spacing: 0.03em;
  white-space: nowrap;
}

.rest-body {
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
  padding: 1.15rem;
}

/* Cargo */
.rank-row {
  display: flex;
  align-items: center;
  gap: 14px;
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
  color: #ffffff;
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  line-height: 1.15;
  text-align: center;
}
.rank-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.rank-eyebrow {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #64748b;
}
.rank-title {
  font-size: 1.25rem;
  line-height: 1.2;
}
.rank-xp {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  font-weight: 600;
  color: #2b6cb0;
}

/* Barra de XP */
.xp-bar {
  height: 18px;
  background: #e2e8f0;
  border: 2px solid #1e293b;
  border-radius: 6px;
  overflow: hidden;
}
.xp-fill {
  height: 100%;
  background: repeating-linear-gradient(
    90deg,
    #14b8a6 0 10px,
    #0d9488 10px 12px
  );
  transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}
.xp-caption {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 2px 10px;
  margin: 6px 0 0;
  font-family: var(--font-mono);
  font-size: 0.74rem;
  font-weight: 600;
  color: #334155;
}
.xp-next {
  color: #64748b;
}

/* Chamados (pasta) */
.mission-tabs {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 4px;
  padding: 0 8px;
  margin-bottom: -2px;
  position: relative;
  z-index: 2;
}
.mission-tab {
  padding: 5px 10px 6px;
  border: 2px solid var(--folder-border, #ca8a04);
  border-bottom: none;
  border-radius: 8px 8px 0 0;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  line-height: 1;
  white-space: nowrap;
}
.mission-tab--main {
  background: var(--folder-bg, #fef08a);
  color: var(--folder-text, #422006);
}
.mission-tab--meta {
  background: #e0f2fe;
  border-color: #0284c7;
  color: #0c4a6e;
}
.mission-card {
  position: relative;
  z-index: 1;
  padding: 10px;
  background: var(--folder-bg, #fef08a);
  border: 2px solid var(--folder-border, #ca8a04);
  border-radius: 10px;
  box-shadow: 0 6px 0 var(--folder-shadow, #a16207);
}
.mission-sheet {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 14px;
  background: var(--folder-surface, #fffbeb);
  border: 1.5px solid #fde047;
  border-radius: 7px;
}
.mission-main {
  display: flex;
  align-items: center;
  gap: 12px;
}
.mission-icon {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  background: #38bdf8;
  border: 2px solid #0284c7;
  border-radius: 10px;
  box-shadow: 0 3px 0 #0369a1;
  color: #ffffff;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 700;
}
.mission-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.mission-eyebrow {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--folder-shadow, #a16207);
}
.mission-info h3 {
  margin: 0;
  font-size: 1.05rem;
  line-height: 1.25;
  color: var(--folder-text, #422006);
}
.mission-reward {
  font-family: var(--font-mono);
  font-size: 0.74rem;
  font-weight: 600;
  color: #0f766e;
}
.mission-empty {
  margin: 0;
  padding: 14px;
  background: var(--folder-surface, #fffbeb);
  border-radius: 7px;
  color: var(--folder-text, #422006);
  font-size: 0.95rem;
  line-height: 1.4;
}

.btn-continue {
  width: 100%;
  min-height: 48px; /* alvo de toque confortável */
  padding: 0.75rem 1.25rem;
  background: #14b8a6;
  color: #ffffff;
  border: 2px solid #0f766e;
  border-radius: 8px;
  box-shadow: 0 4px 0 #0f766e;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition:
    transform 0.12s ease,
    background-color 0.15s ease,
    box-shadow 0.12s ease;
}
.btn-continue:hover {
  background: #0d9488;
  transform: translateY(-1px);
  box-shadow: 0 5px 0 #0f766e;
}
.btn-continue:active {
  transform: translateY(3px);
  box-shadow: 0 1px 0 #0f766e;
}

@media (max-width: 400px) {
  .rest-body {
    padding: 0.95rem;
  }
  .rank-badge {
    width: 56px;
    height: 56px;
  }
  .mission-tab {
    font-size: 0.64rem;
    padding: 4px 7px 5px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .xp-fill,
  .btn-continue {
    transition: none;
  }
}
</style>
