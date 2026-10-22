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

function goToTab(id) {
  const index = TABS.findIndex((tab) => tab.id === id);
  if (index !== -1) activeTab.value = index;
}

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

    <div class="tab-viewport">
      <component
        :is="TABS[activeTab].component"
        :key="TABS[activeTab].id"
        @start-story="selectMode('story')"
        @select-game="playGame"
        @navigate="goToTab"
      />
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
  overflow-y: auto;
  overscroll-behavior: contain;
}
</style>
