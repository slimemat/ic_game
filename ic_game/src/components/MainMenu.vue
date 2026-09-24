<script setup>
import { useI18n } from "vue-i18n";
import { useGameSessionStore } from "../stores/gameSession";
import spritePaint from "../assets/images/spritepaint.png";

const { t } = useI18n();
const session = useGameSessionStore();

const emit = defineEmits(["mode-selected"]);

function selectMode(mode) {
  session.setActiveMode(mode);
  emit("mode-selected", mode);
}
</script>

<template>
  <main class="main-menu">
    <div class="menu-content">
      <!-- Header -->
      <header class="menu-header">
        <h1 class="menu-title">{{ $t("mainMenu.title") }}</h1>
        <p class="menu-subtitle">{{ $t("mainMenu.subtitle") }}</p>
        <p v-if="session.playerName" class="player-info">
          {{ session.playerName }} &mdash;
          {{ $t("mainMenu.level_label") }}
          <span class="level-badge">{{ session.currentLevel }}</span>
        </p>
      </header>

      <!-- CTA buttons -->
      <nav class="menu-actions" :aria-label="$t('mainMenu.nav_aria_label')">
        <button
          class="btn-mode"
          :class="{ 'btn-mode--active': session.activeMode === 'story' }"
          @click="selectMode('story')"
        >
          <img
            :src="spritePaint"
            alt=""
            aria-hidden="true"
            class="btn-icon-img"
          />
          {{ $t("mainMenu.buttons.story_mode") }}
        </button>

        <button
          class="btn-mode"
          :class="{ 'btn-mode--active': session.activeMode === 'level-select' }"
          @click="selectMode('level-select')"
        >
          <img
            :src="spritePaint"
            alt=""
            aria-hidden="true"
            class="btn-icon-img"
          />
          {{ $t("mainMenu.buttons.level_select") }}
        </button>
      </nav>

      <!-- Selection feedback -->
      <Transition name="fade">
        <p v-if="session.activeMode !== 'menu'" class="active-mode-label">
          {{
            session.activeMode === "story"
              ? $t("mainMenu.active_mode.story")
              : $t("mainMenu.active_mode.level_select")
          }}
        </p>
      </Transition>
    </div>
  </main>
</template>

<style scoped>
.main-menu {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(24px, 6vw, 48px);
  min-height: 100vh;
}

.menu-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40px;
  width: 100%;
  max-width: 480px;
}

.menu-header {
  text-align: center;
}

.menu-title {
  font-size: clamp(2.4rem, 9vw, 4rem);
  margin: 0 0 8px;
  letter-spacing: -0.02em;
}

.menu-subtitle {
  margin: 0;
  color: var(--background-light, #94a3b8);
  font-size: 1rem;
}

.player-info {
  margin: 12px 0 0;
  font-size: 0.9rem;
  color: var(--background-light, #94a3b8);
}

.level-badge {
  color: var(--accent-color, #38bdf8);
  font-weight: 700;
}

.menu-actions {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.btn-mode {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  padding: 20px 24px;
  border-radius: 12px;
  font-size: 1.15rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 0.1s ease,
    background-color 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
  border: 2px solid var(--light-green, #4ade80);
  background: transparent;
  color: var(--light-green, #4ade80);
}

.btn-mode:hover {
  background: rgba(74, 222, 128, 0.08);
  box-shadow: 0 0 0 4px rgba(74, 222, 128, 0.15);
}

.btn-mode:active {
  transform: scale(0.97);
}

.btn-mode--active {
  background: var(--accent-color, #38bdf8);
  border-color: var(--accent-color, #38bdf8);
  color: #fff;
  box-shadow: 0 4px 20px rgba(56, 189, 248, 0.35);
}

.btn-mode--active:hover {
  box-shadow: 0 4px 24px rgba(56, 189, 248, 0.5);
}

/* Placeholder icon image — constrained so it doesn't blow up the button */
.btn-icon-img {
  width: 28px;
  height: 28px;
  object-fit: contain;
  /* Tint to match button color when inactive */
  filter: brightness(0) saturate(100%) invert(72%) sepia(47%) saturate(400%)
    hue-rotate(83deg) brightness(103%) contrast(92%);
  transition: filter 0.2s ease;
}

/* Remove the tint when button is active (white label context) */
.btn-mode--active .btn-icon-img {
  filter: brightness(0) invert(1);
}

.active-mode-label {
  margin: 0;
  font-size: 0.875rem;
  color: var(--medium-green, #86efac);
  font-style: italic;
  text-align: center;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
