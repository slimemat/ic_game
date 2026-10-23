<script setup>
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useGameSessionStore } from "../stores/gameSession";
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

const TABS = [
  { id: "challenges", icon: "⚔️", component: ChallengesTab },
  { id: "story", icon: "📜", component: StoryTab },
  { id: "home", icon: "🏠", component: HomeTab },
  { id: "profile", icon: "🛡️", component: ProfileTab },
  { id: "ranking", icon: "🏆", component: RankingTab },
];

const activeTab = ref(TABS.findIndex((tab) => tab.id === "home"));

const navTabs = computed(() =>
  TABS.map(({ id, icon }) => ({ icon, label: t(`hub.tabs.${id}`) })),
);

function goToIndex(index) {
  if (index >= 0 && index < TABS.length) activeTab.value = index;
}

function goToTab(id) {
  goToIndex(TABS.findIndex((tab) => tab.id === id));
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
    <header class="hub-header">
      <h1>{{ $t("mainMenu.title") }}</h1>
      <p>{{ $t("mainMenu.subtitle") }}</p>
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
            @navigate="goToTab"
          />
        </section>
      </div>
    </div>

    <BottomNav v-model="activeTab" :tabs="navTabs" />
  </div>
</template>
<style scoped>
.hub-shell {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* fallback */
  overflow: clip;
}

.tab-viewport {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden; /* fallback */
  overflow: clip;
}

.hub-header {
  flex-shrink: 0;
  text-align: center;
  padding: max(16px, env(safe-area-inset-top)) 16px 8px;
}

.hub-header h1 {
  max-width: none;
  font-size: 1.5rem;
  line-height: 1.2;
  letter-spacing: normal;
}

.hub-header p {
  margin: 4px 0 0;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.tab-viewport {
  flex: 1;
  min-height: 0;
  overflow: hidden;
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
