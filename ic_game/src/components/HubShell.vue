<script setup>
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useGameSessionStore } from "../stores/gameSession";
import { useStoryStore } from "../stores/story";
import { resolveLobbyTheme } from "../game/data/lobbyThemes";
import LobbyBackdrop from "./ui/lobby/LobbyBackdrop.vue";
import BottomNav from "./ui/BottomNav.vue";
import ChallengesTab from "./tabs/ChallengesTab.vue";
import StoryTab from "./tabs/StoryTab.vue";
import HomeTab from "./tabs/HomeTab.vue";
import ProfileTab from "./tabs/ProfileTab.vue";
import RankingTab from "./tabs/RankingTab.vue";
import { useSwipe } from "../composables/useSwipe";

const emit = defineEmits(["mode-selected", "play"]);

const { t } = useI18n();
const session = useGameSessionStore();
const story = useStoryStore();

const TABS = [
  { id: "challenges", icon: "challenges", component: ChallengesTab },
  { id: "story", icon: "story", component: StoryTab },
  { id: "home", icon: "home", component: HomeTab },
  { id: "profile", icon: "profile", component: ProfileTab },
  { id: "ranking", icon: "ranking", component: RankingTab },
];

const activeTab = ref(TABS.findIndex((tab) => tab.id === "home"));

const navTabs = computed(() =>
  TABS.map(({ id, icon }) => ({ icon, label: t(`hub.tabs.${id}`) })),
);

const lobbyTheme = computed(() =>
  resolveLobbyTheme(story.currentStage?.stageNumber, story.storyDecisions),
);

function goToIndex(index) {
  if (index >= 0 && index < TABS.length) activeTab.value = index;
}

const swipe = useSwipe({
  onSwipeLeft: () => goToIndex(activeTab.value + 1),
  onSwipeRight: () => goToIndex(activeTab.value - 1),
});

function selectMode(mode) {
  session.setActiveMode(mode);
  emit("mode-selected", mode);
}

function playGame(gameId) {
  emit("play", gameId);
}
</script>

<template>
  <div class="hub-shell">
    <LobbyBackdrop :theme="lobbyTheme" />

    <header class="hub-header">
      <div class="brand-pill">
        <span class="brand-dot" aria-hidden="true"></span>
        <h1>{{ $t("mainMenu.title") }}</h1>
      </div>
    </header>

    <div
      class="tab-viewport"
      @touchstart.passive="swipe.onStart"
      @touchend.passive="swipe.onEnd"
    >
      <div
        class="tab-track"
        :style="{ transform: `translateX(-${activeTab * 100}%)` }"
      >
        <section
          v-for="(tab, index) in TABS"
          :key="tab.id"
          class="tab-pane"
          :inert="index !== activeTab ? '' : null"
        >
          <component
            :is="tab.component"
            @start-story="selectMode('story')"
            @select-game="playGame"
          />
        </section>
      </div>
    </div>

    <BottomNav v-model="activeTab" :tabs="navTabs" />
  </div>
</template>

<style scoped>
.hub-shell {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* fallback */
  overflow: clip;
  color: var(--aero-text-primary, #0f172a);
}

.hub-header {
  position: relative;
  z-index: 2;
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  padding: max(10px, env(safe-area-inset-top)) 16px 8px;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.72) 0%,
    rgba(255, 255, 255, 0.36) 100%
  );
  border-bottom: 1px solid rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.brand-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 16px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.92);
  box-shadow:
    0 4px 12px rgba(14, 74, 110, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 1);
}

.brand-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: linear-gradient(135deg, #38bdf8 0%, #14b8a6 100%);
  box-shadow: 0 0 8px rgba(14, 165, 233, 0.65);
}

.hub-header h1 {
  max-width: none;
  margin: 0;
  font-size: 1.08rem;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: 0.08em;
  color: var(--aero-text-primary, #0f172a);
}

.tab-viewport {
  position: relative;
  z-index: 1;
  flex: 1;
  min-height: 0;
  overflow: hidden; /* fallback */
  overflow: clip;
}

.tab-track {
  position: absolute;
  inset: 0;
  display: flex;
  transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform;
}

/* Cada aba rola sozinha e mantém a posição de scroll ao trocar */
.tab-pane {
  flex: 0 0 100%;
  min-width: 0;
  overflow-x: hidden;
  height: 100%;
  overflow-y: auto;
  overscroll-behavior-y: contain;
  touch-action: pan-y;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* Edge antigo */
}

.tab-pane::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Edge */
}

@media (prefers-reduced-motion: reduce) {
  .tab-track {
    transition: none;
  }
}
</style>
