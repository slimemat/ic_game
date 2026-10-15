<script setup>
import { onMounted, ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import { useGameSessionStore } from "../stores/gameSession";
import { useStoryStore } from "../stores/story";
import { useProgressionStore } from "../stores/progression";
import {
  TASK_TAGS,
  calculateStageTotalPayout,
} from "../game/data/progressionConfig";
import PauseModal from "./ui/PauseModal.vue";
import PauseButton from "./ui/PauseButton.vue";

const emit = defineEmits(["play"]);
const { t } = useI18n();
const session = useGameSessionStore();
const story = useStoryStore();
const progression = useProgressionStore();

const showAssistant = ref(true);

onMounted(() => story.setPaused(false));

function quitDashboard() {
  story.setPaused(false);
  session.setActiveMode("menu");
}

function getSpriteUrl(char, emotion) {
  return new URL(
    `../assets/sprites/${char}_${emotion || "neutral"}.png`,
    import.meta.url,
  ).href;
}

const currentStage = computed(() => story.currentStage);

const stageTitle = computed(() => {
  const key = currentStage.value?.titleKey;
  return key ? t(key) : "Padrões Corrompidos";
});

const stageDescription = computed(() => {
  const key = currentStage.value?.descriptionKey;
  return key ? t(key) : "Restaure a integridade dos padrões geométricos.";
});

const stagePayout = computed(() => {
  return calculateStageTotalPayout(currentStage.value);
});

const stageTags = computed(() => {
  const tags = currentStage.value?.tags || [];
  return tags.map((tagId) => TASK_TAGS[tagId]).filter(Boolean);
});

const rankTitle = computed(() => {
  const key = progression.currentRank?.titleKey;
  return key ? t(key) : "Estagiário(a)";
});
</script>

<template>
  <!-- O dashboard agora volta a ser um overlay (sobreposição) -->
  <div class="dashboard-overlay">
    <PauseButton class="pause-btn-fixed" @click="story.setPaused(true)" />

    <PauseModal
      :isOpen="story.isPaused"
      @resume="story.setPaused(false)"
      @quit="quitDashboard"
      :showRestart="false"
    />

    <div class="backdrop"></div>

    <div class="os-window">
      <header class="window-header">
        <div class="window-controls">
          <span
            class="dot dot-red"
            @click="story.setPaused(true)"
            title="Menu"
          ></span>
          <span class="dot dot-yellow"></span>
          <span class="dot dot-green"></span>
        </div>
        <div class="window-title">LogicHub - Painel de Chamados</div>
      </header>

      <div class="window-body">
        <!-- Career HUD: Rank & XP Progress -->
        <div class="career-hud">
          <div class="career-left">
            <span class="career-label">{{
              $t("story.dashboard.career_title")
            }}</span>
            <div
              class="career-rank-badge"
              :style="{
                borderColor: progression.currentRank?.badgeColor || '#718096',
              }"
            >
              <span
                class="badge-dot"
                :style="{
                  backgroundColor:
                    progression.currentRank?.badgeColor || '#718096',
                }"
              ></span>
              <span class="rank-name">{{ rankTitle }}</span>
            </div>
          </div>

          <div class="career-right">
            <div class="xp-row">
              <span class="xp-text">{{
                $t("story.dashboard.current_xp", { xp: progression.totalXp })
              }}</span>
              <span class="xp-next" v-if="progression.nextRank">
                {{
                  $t("story.dashboard.xp_progress", {
                    current: progression.totalXp,
                    target: progression.nextRank.requiredTotalXp,
                  })
                }}
              </span>
              <span class="xp-next max-rank" v-else>
                {{ $t("story.dashboard.max_rank") }}
              </span>
            </div>
            <div class="progress-bar-container">
              <div
                class="progress-bar-fill"
                :style="{
                  width: `${progression.rankProgressPercent}%`,
                  backgroundColor:
                    progression.currentRank?.badgeColor || '#319795',
                }"
              ></div>
            </div>
          </div>
        </div>

        <div class="assistant-chat-bubble anim-fade-in" v-if="showAssistant">
          <button
            class="btn-close"
            @click="showAssistant = false"
            title="Dispensar"
          >
            &times;
          </button>

          <div class="avatar-container anim-bounce">
            <img
              :src="getSpriteUrl('assistant', 'explaining')"
              class="avatar-icon"
              alt="Assistente"
            />
          </div>

          <span class="sender-name">Assistente</span>
          <div class="text-content">
            {{ stageDescription }}
          </div>
        </div>

        <div class="mission-card">
          <div class="mission-icon-placeholder"></div>

          <div class="mission-info">
            <h3>{{ stageTitle }}</h3>
            <div class="mission-meta">
              <span class="meta-goal">
                {{
                  $t("story.dashboard.task_goal", {
                    count: currentStage.targetChallengesCount,
                  })
                }}
              </span>
              <span class="meta-payout">
                {{ $t("story.dashboard.task_reward", { xp: stagePayout }) }}
              </span>
            </div>
            <div class="tags">
              <span
                v-for="tag in stageTags"
                :key="tag.id"
                class="tag"
                :class="tag.bgClass"
              >
                {{ $t(tag.labelKey) }}
              </span>
            </div>
          </div>

          <div class="mission-action">
            <button
              class="btn-primary"
              @click="$emit('play', currentStage.gameId)"
            >
              {{ $t("story.dashboard.btn_start") }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── VOLTAMOS PARA O OVERLAY (Sobreposição) ── */
.dashboard-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
}

.backdrop {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(6px); /* Esse é o efeito de vidro lindo no fundo! */
}

.pause-btn-fixed {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 1050;
}

.os-window {
  position: relative;
  z-index: 10;
  width: 90%;
  max-width: 750px;
  background-color: #f4f5f7;
  border-radius: 12px;
  overflow: hidden;
  box-shadow:
    0 30px 60px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.2);
  display: flex;
  flex-direction: column;
}

.window-header {
  height: 45px;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(225, 230, 235, 0.7) 49%,
    rgba(195, 205, 215, 0.7) 50%,
    rgba(235, 240, 245, 0.9) 100%
  );
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  padding: 0 15px;
  position: relative;
}

.window-controls {
  display: flex;
  gap: 8px;
}
.dot {
  width: 13px;
  height: 13px;
  border-radius: 50%;
  box-shadow:
    inset 0 2px 4px rgba(255, 255, 255, 0.6),
    inset 0 -2px 4px rgba(0, 0, 0, 0.2),
    0 1px 1px rgba(0, 0, 0, 0.1);
}
.dot-red {
  background-color: #ff5f56;
  border: 1px solid #e0443e;
  cursor: pointer;
  transition: transform 0.2s;
}
.dot-red:hover {
  transform: scale(1.15);
}
.dot-yellow {
  background-color: #ffbd2e;
  border: 1px solid #dea123;
}
.dot-green {
  background-color: #27c93f;
  border: 1px solid #1aab29;
}

.window-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.9rem;
  font-weight: 600;
  color: #333;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.8);
}

.window-body {
  background-color: #ffffff;
  padding: 2.5rem 2rem;
}

.assistant-chat-bubble {
  position: relative;
  background-color: #ebf8ff;
  border-left: 4px solid #4a90e2;
  border-radius: 12px;
  border-bottom-left-radius: 0;
  padding: 15px 35px 15px 15px;
  margin-left: 25px;
  margin-bottom: 2rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
}

.assistant-chat-bubble::after {
  content: "";
  display: table;
  clear: both;
}

.btn-close {
  position: absolute;
  top: 8px;
  right: 12px;
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #718096;
  cursor: pointer;
  line-height: 1;
}
.btn-close:hover {
  color: #e53e3e;
}

.avatar-container {
  float: left;
  width: 65px;
  height: 65px;
  margin-top: -15px;
  margin-left: -35px;
  margin-right: 15px;
  margin-bottom: 5px;
  background-color: #fff;
  border-radius: 50%;
  border: 2px solid #4a90e2;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  position: relative;
  z-index: 2;
}

.avatar-icon {
  width: 100%;
  height: 100%;
  object-fit: contain;
  image-rendering: pixelated;
}

.sender-name {
  font-weight: 800;
  font-size: 0.95rem;
  color: #2b6cb0;
  display: block;
  margin-bottom: 4px;
  line-height: 1.2;
}
.text-content {
  color: #2d3748;
  font-size: 1.05rem;
  line-height: 1.5;
  display: block;
}

.mission-card {
  display: flex;
  gap: 1.5rem;
  align-items: center;
  background: #f8fafc;
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);
}

.mission-icon-placeholder {
  width: 90px;
  height: 90px;
  flex-shrink: 0;
  border-radius: 12px;
  background: linear-gradient(135deg, #4fd1c5, #2b6cb0);
  box-shadow:
    inset 0 4px 8px rgba(255, 255, 255, 0.4),
    inset 0 -4px 8px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
}
.mission-icon-placeholder::after {
  content: "SPRITE";
  color: white;
  font-weight: 800;
  font-size: 0.8rem;
  opacity: 0.8;
}

.mission-info {
  flex-grow: 1;
}
/* ── CAREER HUD ── */
.career-hud {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1rem 1.25rem;
  margin-bottom: 1.75rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
}

.career-left {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.career-label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #718096;
  letter-spacing: 0.5px;
}

.career-rank-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  border-radius: 8px;
  background: #ffffff;
  border: 2px solid;
}

.badge-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.rank-name {
  font-weight: 800;
  font-size: 1rem;
  color: #2d3748;
}

.career-right {
  flex-grow: 1;
  max-width: 380px;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.xp-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
}

.xp-text {
  font-weight: 800;
  color: #2b6cb0;
}

.xp-next {
  color: #718096;
  font-weight: 600;
}

.progress-bar-container {
  width: 100%;
  height: 10px;
  background: #edf2f7;
  border-radius: 999px;
  overflow: hidden;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
}

.progress-bar-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.4s ease-out;
}

/* ── MISSION INFO & META ── */
.mission-info h3 {
  margin: 0 0 0.25rem 0;
  color: #2d3748;
  font-size: 1.25rem;
}

.mission-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.85rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.meta-goal {
  color: #4a5568;
}

.meta-payout {
  color: #2b6cb0;
  background: #ebf8ff;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
}

.tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.tag {
  font-size: 0.75rem;
  font-weight: bold;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.tag-easy {
  background: #e6fffa;
  color: #319795;
  border: 1px solid #b2f5ea;
}
.tag-medium {
  background: #fefcbf;
  color: #b7791f;
  border: 1px solid #faf089;
}
.tag-hard {
  background: #fed7d7;
  color: #c53030;
  border: 1px solid #feb2b2;
}
.tag-special {
  background: #fef3c7;
  color: #b45309;
  border: 1px solid #fde68a;
  font-weight: 800;
}
.tag-urgent {
  background: #fee2e2;
  color: #b91c1c;
  border: 1px solid #fca5a5;
  font-weight: 800;
}

.mission-action {
  flex-shrink: 0;
}
.btn-primary {
  background: linear-gradient(180deg, #4fd1c5 0%, #38b2ac 100%);
  color: #fff;
  border: 1px solid #319795;
  padding: 0.8rem 2rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  font-size: 1.1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}
.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.anim-fade-in {
  animation: fade-in 0.4s ease-out;
}
.anim-bounce {
  animation: pop-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes pop-in {
  from {
    transform: scale(0.5);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

@media (max-width: 600px) {
  .os-window {
    width: 95%;
  }
  .window-body {
    padding: 2rem 1.5rem;
  }
  .assistant-chat-bubble {
    margin-left: 15px;
    padding-left: 12px;
  }
  .avatar-container {
    width: 55px;
    height: 55px;
    margin-left: -25px;
  }
  .mission-card {
    flex-wrap: wrap;
    padding: 1.2rem;
    gap: 1rem;
  }
  .mission-info {
    flex-grow: 1;
  }
  .mission-action {
    width: 100%;
  }
  .btn-primary {
    width: 100%;
  }
}
</style>
