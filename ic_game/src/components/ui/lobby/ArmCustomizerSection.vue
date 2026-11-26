<script setup>
import { useI18n } from "vue-i18n";
import { useCustomizationStore } from "../../../stores/customization";
import AeroGlassCard from "./AeroGlassCard.vue";
import AppIcon from "../AppIcon.vue";

const { t } = useI18n();
const customization = useCustomizationStore();

function formatUnlockLabel(skin) {
  const { unlockCondition, unlock } = skin;
  if (unlockCondition?.type === "xp") {
    return t("customization.ui.unlock_xp", { xp: unlock.target });
  }
  return t("customization.ui.unlock_free");
}

function armPreviewStyle(skin) {
  return {
    backgroundColor: skin.arm.fillColor,
    backgroundImage: skin.arm.tileSrc ? `url(${skin.arm.tileSrc})` : "none",
    borderLeftColor: skin.arm.borderColor,
    borderRightColor: skin.arm.borderColor,
  };
}

function handleSkinClick(skin) {
  if (!skin.isUnlocked || skin.isEquipped) return;
  customization.equipHandSkin(skin.id);
}
</script>

<template>
  <AeroGlassCard padding="md" class="arms-section">
    <div class="arms-header">
      <div class="arms-title-row">
        <span class="arms-icon-badge" aria-hidden="true">
          <AppIcon name="hand" :size="18" />
        </span>
        <div>
          <h3 class="arms-title">{{ $t("customization.ui.title") }}</h3>
          <p class="arms-subtitle">{{ $t("customization.ui.subtitle") }}</p>
        </div>
      </div>
    </div>

    <div class="arms-grid" role="list">
      <button
        v-for="skin in customization.handSkins"
        :key="skin.id"
        type="button"
        role="listitem"
        class="arm-card"
        :class="{
          'is-equipped': skin.isEquipped,
          'is-unlocked': skin.isUnlocked && !skin.isEquipped,
          'is-locked': !skin.isUnlocked,
        }"
        :disabled="!skin.isUnlocked"
        :aria-pressed="skin.isEquipped"
        @click="handleSkinClick(skin)"
      >
        <div class="arm-preview-stage" aria-hidden="true">
          <div class="arm-preview-sleeve" :style="armPreviewStyle(skin)"></div>
          <img
            :src="skin.palmBackSrc"
            alt=""
            class="arm-preview-sprite arm-preview-back"
            draggable="false"
          />
          <div class="arm-preview-note"></div>
          <img
            :src="skin.thumbSrc"
            alt=""
            class="arm-preview-sprite arm-preview-front"
            draggable="false"
          />

          <span v-if="!skin.isUnlocked" class="lock-overlay">
            <AppIcon name="lock" :size="15" />
          </span>
        </div>

        <strong class="arm-name">{{ $t(skin.nameKey) }}</strong>

        <span v-if="skin.isEquipped" class="status-pill is-equipped">
          <AppIcon name="check" :size="12" />
          <span>{{ $t("customization.ui.equipped") }}</span>
        </span>
        <span v-else-if="skin.isUnlocked" class="status-pill is-available">
          {{ $t("customization.ui.equip") }}
        </span>
        <span v-else class="status-pill is-locked">
          {{ formatUnlockLabel(skin) }}
        </span>

        <div v-if="!skin.isUnlocked" class="unlock-progress-wrap">
          <div class="unlock-bar">
            <div
              class="unlock-bar-fill"
              :style="{ width: skin.unlock.progressPercent + '%' }"
            ></div>
          </div>
          <span class="unlock-bar-caption">
            {{
              $t("customization.ui.progress_xp", {
                current: Math.min(skin.unlock.current, skin.unlock.target),
                target: skin.unlock.target,
              })
            }}
          </span>
        </div>
      </button>
    </div>
  </AeroGlassCard>
</template>

<style scoped>
.arms-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.arms-title-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.arms-icon-badge {
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  color: #ffffff;
  background: linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%);
  box-shadow:
    0 4px 10px rgba(14, 165, 233, 0.24),
    inset 0 1px 0 rgba(255, 255, 255, 0.65);
}

.arms-title {
  margin: 0;
  font-size: 1.04rem;
  font-weight: 700;
  line-height: 1.2;
  color: var(--aero-text-primary, #0f172a);
}

.arms-subtitle {
  margin: 2px 0 0;
  font-size: 0.8rem;
  line-height: 1.3;
  color: var(--aero-text-secondary, #334155);
}

.arms-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

@media (max-width: 430px) {
  .arms-grid {
    grid-template-columns: 1fr;
  }
}

.arm-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  padding: 10px 8px;
  border-radius: 14px;
  border: 1.5px solid rgba(255, 255, 255, 0.88);
  background: rgba(255, 255, 255, 0.66);
  box-shadow:
    0 4px 12px rgba(14, 74, 110, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.95);
  color: var(--aero-text-primary, #0f172a);
  cursor: pointer;
  transition:
    transform 0.16s ease,
    border-color 0.16s ease,
    box-shadow 0.16s ease;
}

.arm-card.is-unlocked:hover,
.arm-card.is-unlocked:focus-visible {
  border-color: rgba(14, 165, 233, 0.65);
  transform: translateY(-2px);
  box-shadow: 0 8px 18px rgba(2, 132, 199, 0.16);
}

.arm-card.is-equipped {
  border-color: rgba(20, 184, 166, 0.8);
  background: linear-gradient(
    180deg,
    rgba(240, 253, 250, 0.96) 0%,
    rgba(224, 242, 254, 0.88) 100%
  );
  box-shadow:
    0 6px 16px rgba(13, 148, 136, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.98);
  cursor: default;
}

.arm-card.is-locked {
  opacity: 0.78;
  cursor: not-allowed;
  background: rgba(241, 245, 249, 0.62);
}

.arm-card:focus-visible {
  outline: 2px solid var(--aero-accent, #0284c7);
  outline-offset: 2px;
}

/* Miniature live sprite preview */
.arm-preview-stage {
  position: relative;
  width: 72px;
  height: 72px;
  border-radius: 12px;
  overflow: hidden;
  background: linear-gradient(180deg, #e0f2fe 0%, #f8fafc 100%);
  border: 1px solid rgba(14, 165, 233, 0.22);
  box-shadow: inset 0 2px 6px rgba(14, 74, 110, 0.08);
}

.arm-preview-sleeve {
  position: absolute;
  right: 8px;
  bottom: -14px;
  width: 24px;
  height: 38px;
  background-repeat: repeat-y;
  background-size: 100% auto;
  image-rendering: pixelated;
  border-left: 2px solid;
  border-right: 2px solid;
  transform: rotate(-22deg);
  z-index: 1;
}

.arm-preview-note {
  position: absolute;
  left: 11px;
  top: 12px;
  width: 34px;
  height: 34px;
  border-radius: 3px;
  background: #fef08a;
  border: 1px solid #eab308;
  box-shadow: 0 2px 4px rgba(15, 23, 42, 0.14);
  transform: rotate(-4deg);
  z-index: 2;
}

.arm-preview-sprite {
  position: absolute;
  right: 4px;
  bottom: 4px;
  width: 44px;
  height: 44px;
  object-fit: contain;
  image-rendering: pixelated;
  transform: rotate(-22deg);
}

.arm-preview-back {
  z-index: 1;
}

.arm-preview-front {
  z-index: 3;
}

.lock-overlay {
  position: absolute;
  top: 5px;
  right: 5px;
  z-index: 4;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: rgba(15, 23, 42, 0.72);
  color: #ffffff;
}

.arm-name {
  font-size: 0.86rem;
  font-weight: 700;
  line-height: 1.2;
  text-align: center;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 9px;
  border-radius: 999px;
  font-family: var(--font-mono);
  font-size: 0.66rem;
  font-weight: 700;
  line-height: 1.1;
}

.status-pill.is-equipped {
  background: #0d9488;
  color: #ffffff;
}

.status-pill.is-available {
  background: rgba(14, 165, 233, 0.14);
  border: 1px solid rgba(14, 165, 233, 0.32);
  color: #0369a1;
}

.status-pill.is-locked {
  background: rgba(100, 116, 139, 0.14);
  color: var(--aero-text-muted, #475569);
}

.unlock-progress-wrap {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.unlock-bar {
  height: 6px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.1);
  overflow: hidden;
}

.unlock-bar-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #38bdf8 0%, #14b8a6 100%);
}

.unlock-bar-caption {
  font-family: var(--font-mono);
  font-size: 0.64rem;
  font-weight: 600;
  text-align: center;
  color: var(--aero-text-muted, #475569);
}

@media (prefers-reduced-motion: reduce) {
  .arm-card {
    transition: none;
  }
}
</style>
