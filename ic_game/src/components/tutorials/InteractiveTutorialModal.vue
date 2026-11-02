<script setup>
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import spritepaintImg from "../../assets/images/spritepaint.png";
import assistantAvatar from "../../assets/sprites/assistant_explaining.png";
import AudioManager from "../../game/managers/AudioManager";

const props = defineProps({
  tutorial: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["complete", "skip"]);

const { t } = useI18n();

// Transformação acumulativa contínua (+90 / -90)
const currentAngle = ref(0);
const scaleX = ref(1);
const scaleY = ref(1);
const lastAction = ref("init");
const isActionCoolingDown = ref(false);
const showSkipDialog = ref(false);
const isSubmitting = ref(false);

const COOLDOWN_MS = 380;

// Máquina de estados do onboarding guiado obrigatório
// Ordem exigida: 1. Anti-horário (↶) -> 2. Horário (↷) -> 3. Espelho H (⇄) -> 4. Espelho V (⇅)
const GUIDED_STEPS = ["rotate_ccw", "rotate_cw", "flip_h", "flip_v"];
const currentStepIndex = ref(0); // 0 a 3, ou 4 quando todos concluídos

const isAllStepsCompleted = computed(
  () => currentStepIndex.value >= GUIDED_STEPS.length,
);

const currentTargetStep = computed(() => {
  if (isAllStepsCompleted.value) return null;
  return GUIDED_STEPS[currentStepIndex.value];
});

const notificationMessage = computed(() => {
  if (isAllStepsCompleted.value) {
    return t("tutorials.notification.completed");
  }
  const stepNum = currentStepIndex.value + 1;
  return t(`tutorials.notification.step_${stepNum}`);
});

const transformStyle = computed(() => ({
  transform: `rotate(${currentAngle.value}deg) scaleX(${scaleX.value}) scaleY(${scaleY.value})`,
  transition: "transform 0.38s cubic-bezier(0.34, 1.56, 0.64, 1)",
}));

const normalizedAngle = computed(() => {
  return ((currentAngle.value % 360) + 360) % 360;
});

const currentOrientationLabel = computed(() => {
  const parts = [];
  const angle = normalizedAngle.value;
  if (angle !== 0) {
    parts.push(`${angle}°`);
  }
  if (scaleX.value === -1) {
    parts.push("Espelho ⇄");
  }
  if (scaleY.value === -1) {
    parts.push("Espelho ⇅");
  }
  return parts.length > 0 ? parts.join(" + ") : "Original (0°)";
});

const dynamicExplanation = computed(() => {
  if (lastAction.value === "init") {
    return t("tutorials.degree_steps.deg_0");
  }

  if (lastAction.value === "rotate_cw") {
    const angle = normalizedAngle.value;
    if (angle === 90) return t("tutorials.degree_steps.deg_90");
    if (angle === 180) return t("tutorials.degree_steps.deg_180");
    if (angle === 270) return t("tutorials.degree_steps.deg_270");
    if (angle === 0) return t("tutorials.degree_steps.deg_360");
    return t("tutorials.degree_steps.deg_cycle");
  }

  if (lastAction.value === "rotate_ccw") {
    const angle = normalizedAngle.value;
    if (angle === 270) return t("tutorials.degree_steps.deg_ccw_90");
    if (angle === 180) return t("tutorials.degree_steps.deg_180");
    if (angle === 90) return t("tutorials.degree_steps.deg_270");
    if (angle === 0) return t("tutorials.degree_steps.deg_360");
    return t("tutorials.degree_steps.deg_cycle");
  }

  if (lastAction.value === "flip_h") {
    return scaleX.value === -1
      ? t("tutorials.degree_steps.flip_h_done")
      : t("tutorials.degree_steps.flip_h_normal");
  }

  if (lastAction.value === "flip_v") {
    return scaleY.value === -1
      ? t("tutorials.degree_steps.flip_v_done")
      : t("tutorials.degree_steps.flip_v_normal");
  }

  return t("tutorials.degree_steps.deg_0");
});

function playActionSfx() {
  try {
    AudioManager.play("swipe", { volume: 0.45 });
  } catch (e) {}
}

function playStepSuccessSfx() {
  try {
    AudioManager.play("connect", { volume: 0.65 });
  } catch (e) {}
}

function startCooldown() {
  isActionCoolingDown.value = true;
  setTimeout(() => {
    isActionCoolingDown.value = false;
  }, COOLDOWN_MS);
}

function advanceGuidedStep(actionKey) {
  if (currentTargetStep.value === actionKey) {
    currentStepIndex.value++;
    playStepSuccessSfx();
  } else {
    playActionSfx();
  }
}

function rotateCcw() {
  if (isActionCoolingDown.value) return;
  startCooldown();
  currentAngle.value -= 90;
  lastAction.value = "rotate_ccw";
  advanceGuidedStep("rotate_ccw");
}

function rotateCw() {
  if (isActionCoolingDown.value) return;
  startCooldown();
  currentAngle.value += 90;
  lastAction.value = "rotate_cw";
  advanceGuidedStep("rotate_cw");
}

function flipHorizontal() {
  if (isActionCoolingDown.value) return;
  startCooldown();
  scaleX.value *= -1;
  lastAction.value = "flip_h";
  advanceGuidedStep("flip_h");
}

function flipVertical() {
  if (isActionCoolingDown.value) return;
  startCooldown();
  scaleY.value *= -1;
  lastAction.value = "flip_v";
  advanceGuidedStep("flip_v");
}

function resetCanvas() {
  if (isActionCoolingDown.value) return;
  startCooldown();
  currentAngle.value = 0;
  scaleX.value = 1;
  scaleY.value = 1;
  lastAction.value = "init";
  playActionSfx();
}

function handleStartChallenge() {
  if (isSubmitting.value) return;
  isSubmitting.value = true;
  try {
    AudioManager.play("stamp", { volume: 0.7 });
  } catch (e) {}
  emit("complete");
}

function handleConfirmSkip() {
  if (isSubmitting.value) return;
  isSubmitting.value = true;
  emit("skip");
}
</script>

<template>
  <div class="tutorial-overlay" role="dialog" aria-modal="true">
    <div class="paper-card retro-paper">
      <!-- Fita adesiva decorativa de topo (Estilo Post-it Tape do jogo) -->
      <div class="paper-tape" aria-hidden="true"></div>

      <!-- Cabeçalho estilo memorando corporativo -->
      <header class="paper-header">
        <div class="header-stamp">
          <span class="stamp-icon">📋</span>
          <div>
            <span class="stamp-badge">{{ $t("tutorials.unified.badge") }}</span>
            <h3 class="paper-title">{{ $t("tutorials.unified.title") }}</h3>
          </div>
        </div>
        <button
          type="button"
          class="btn-close-paper"
          :title="$t('tutorials.unified.btn_skip')"
          @click="showSkipDialog = true"
        >
          ✕
        </button>
      </header>

      <!-- Notificação Push da Assistente Malu (Desliza de cima com avatar pixel art) -->
      <div
        class="assistant-push-notification"
        :class="{ 'is-completed': isAllStepsCompleted }"
      >
        <div class="push-avatar-box">
          <img
            :src="assistantAvatar"
            alt="Malu"
            class="assistant-push-avatar"
          />
          <span class="online-indicator" aria-hidden="true"></span>
        </div>
        <div class="push-content">
          <div class="push-header-row">
            <span class="push-sender">{{
              $t("tutorials.notification.sender")
            }}</span>
            <span class="push-step-tag" :class="{ done: isAllStepsCompleted }">
              {{
                isAllStepsCompleted
                  ? "Concluído ✓"
                  : $t("tutorials.notification.step_counter", {
                      current: currentStepIndex + 1,
                      total: GUIDED_STEPS.length,
                    })
              }}
            </span>
          </div>
          <transition name="push-slide" mode="out-in">
            <p :key="currentStepIndex" class="push-message-text">
              {{ notificationMessage }}
            </p>
          </transition>
        </div>
      </div>

      <!-- Prancheta Ampliada de Testes com o Sprite -->
      <div class="drafting-board">
        <!-- Display de Selo de Orientação -->
        <div class="orientation-badge">
          <span class="badge-dot">●</span>
          {{ currentOrientationLabel }}
        </div>

        <!-- Eixo de reflexão horizontal sutil (Flip V) -->
        <div v-if="scaleY === -1" class="mirror-line horizontal"></div>

        <!-- Eixo de reflexão vertical sutil (Flip H) -->
        <div v-if="scaleX === -1" class="mirror-line vertical"></div>

        <!-- O sprite do personagem na prancheta ampliada -->
        <div class="sprite-wrapper" :style="transformStyle">
          <img :src="spritepaintImg" alt="Sprite em teste" class="sprite-img" />
        </div>
      </div>

      <!-- Banner Dinâmico em estilo Post-it explicativo (1 linha, muda a cada toque) -->
      <div class="memo-dynamic-tip">
        <span class="memo-pin">💡</span>
        <span class="memo-text">{{ dynamicExplanation }}</span>
      </div>

      <!-- Caixa de Ferramentas / Carimbos de Transformação
           Ordem Intuitiva: 1. Anti-horário (Esquerda) | 2. Horário (Direita) | 3. Espelho H | 4. Espelho V | 5. Reset -->
      <div class="paper-tools-grid">
        <!-- 1. Girar 90° Anti-horário (À Esquerda) -->
        <button
          type="button"
          class="tool-stamp-btn"
          :class="{
            'is-guided-target': currentTargetStep === 'rotate_ccw',
            'is-busy': isActionCoolingDown,
          }"
          :title="$t('tutorials.unified.tool_ccw')"
          @click="rotateCcw"
        >
          <span class="stamp-icon-sym">↶</span>
          <span class="stamp-label">90° Anti-horário</span>
        </button>

        <!-- 2. Girar 90° Horário (À Direita de ↶) -->
        <button
          type="button"
          class="tool-stamp-btn"
          :class="{
            'is-guided-target': currentTargetStep === 'rotate_cw',
            'is-busy': isActionCoolingDown,
          }"
          :title="$t('tutorials.unified.tool_cw')"
          @click="rotateCw"
        >
          <span class="stamp-icon-sym">↷</span>
          <span class="stamp-label">90° Horário</span>
        </button>

        <!-- 3. Espelhar Horizontal -->
        <button
          type="button"
          class="tool-stamp-btn"
          :class="{
            'is-guided-target': currentTargetStep === 'flip_h',
            active: scaleX === -1,
            'is-busy': isActionCoolingDown,
          }"
          :title="$t('tutorials.unified.tool_flip_h')"
          @click="flipHorizontal"
        >
          <span class="stamp-icon-sym">⇄</span>
          <span class="stamp-label">Espelho H</span>
        </button>

        <!-- 4. Espelhar Vertical -->
        <button
          type="button"
          class="tool-stamp-btn"
          :class="{
            'is-guided-target': currentTargetStep === 'flip_v',
            active: scaleY === -1,
            'is-busy': isActionCoolingDown,
          }"
          :title="$t('tutorials.unified.tool_flip_v')"
          @click="flipVertical"
        >
          <span class="stamp-icon-sym">⇅</span>
          <span class="stamp-label">Espelho V</span>
        </button>

        <!-- 5. Restaurar Original -->
        <button
          type="button"
          class="tool-stamp-btn btn-reset-stamp"
          :class="{ 'is-busy': isActionCoolingDown }"
          :title="$t('tutorials.unified.btn_reset')"
          @click="resetCanvas"
        >
          <span class="stamp-icon-sym">↺</span>
          <span class="stamp-label">{{
            $t("tutorials.unified.btn_reset")
          }}</span>
        </button>
      </div>

      <!-- Rodapé Compacto -->
      <footer class="paper-footer">
        <button
          type="button"
          class="btn-text-skip"
          @click="showSkipDialog = true"
        >
          {{ $t("tutorials.unified.btn_skip") }}
        </button>

        <!-- O botão de iniciar SÓ fica visível quando o jogador completa todos os 4 passos obrigatórios -->
        <transition name="fade">
          <button
            v-if="isAllStepsCompleted"
            type="button"
            class="btn-start-challenge"
            :disabled="isSubmitting"
            @click="handleStartChallenge"
          >
            <span>{{ $t("tutorials.unified.btn_start") }}</span>
            <span class="arrow-sym">→</span>
          </button>
        </transition>
      </footer>

      <!-- Modal Interno de Confirmação para Pular -->
      <transition name="fade">
        <div v-if="showSkipDialog" class="confirm-skip-modal">
          <div class="confirm-box">
            <h4 class="confirm-h">{{ $t("tutorials.confirm_skip.title") }}</h4>
            <p class="confirm-p">{{ $t("tutorials.confirm_skip.message") }}</p>
            <div class="confirm-btns">
              <button
                type="button"
                class="btn-back-tut"
                :disabled="isSubmitting"
                @click="showSkipDialog = false"
              >
                {{ $t("tutorials.confirm_skip.btn_stay") }}
              </button>
              <button
                type="button"
                class="btn-confirm-skip"
                :disabled="isSubmitting"
                @click="handleConfirmSkip"
              >
                {{ $t("tutorials.confirm_skip.btn_confirm") }}
              </button>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<style scoped>
.tutorial-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(16, 24, 32, 0.78);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  padding: 12px;
  animation: overlayFade 0.2s ease-out;
}

/* Cartão com estética de papel corporativo / memorando ampliado */
.paper-card {
  position: relative;
  width: 100%;
  max-width: 540px;
  background-color: #fdfcf7;
  /* Grade sutil de papel milimetrado de escritório */
  background-image:
    linear-gradient(rgba(148, 163, 184, 0.12) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.12) 1px, transparent 1px);
  background-size: 16px 16px;
  border-radius: 14px;
  border: 2px solid #e2e8f0;
  border-left: 6px solid var(--accent-color, #0ea5e9);
  box-shadow:
    0 20px 48px -10px rgba(0, 0, 0, 0.55),
    0 2px 6px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.95);
  padding: 18px 20px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-family: var(--font-main, sans-serif);
  animation: modalPop 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: visible;
}

/* Fita adesiva branca no topo da folha */
.paper-tape {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 20px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.18);
  border-left: 1px dashed rgba(0, 0, 0, 0.15);
  border-right: 1px dashed rgba(0, 0, 0, 0.15);
  pointer-events: none;
}

/* Cabeçalho */
.paper-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.header-stamp {
  display: flex;
  align-items: center;
  gap: 10px;
}

.stamp-icon {
  font-size: 22px;
}

.stamp-badge {
  display: inline-block;
  font-size: 9.5px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: #0284c7;
  background: rgba(14, 165, 233, 0.12);
  padding: 1px 7px;
  border-radius: 4px;
}

.paper-title {
  margin: 1px 0 0 0;
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.2;
}

.btn-close-paper {
  background: transparent;
  border: none;
  font-size: 16px;
  color: #94a3b8;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  line-height: 1;
}
.btn-close-paper:hover {
  background: rgba(0, 0, 0, 0.06);
  color: #1e293b;
}

/* Notificação Push da Assistente Malu (Deslizando do Topo) */
.assistant-push-notification {
  display: flex;
  align-items: center;
  gap: 10px;
  background: linear-gradient(
    135deg,
    rgba(240, 249, 255, 0.95) 0%,
    rgba(224, 242, 254, 0.9) 100%
  );
  border: 1px solid #bae6fd;
  border-left: 4px solid #0284c7;
  border-radius: 8px;
  padding: 8px 12px;
  box-shadow: 0 2px 6px rgba(14, 165, 233, 0.08);
  animation: pushSlideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.assistant-push-notification.is-completed {
  background: linear-gradient(
    135deg,
    rgba(240, 253, 244, 0.95) 0%,
    rgba(220, 252, 231, 0.9) 100%
  );
  border-color: #bbf7d0;
  border-left-color: #16a34a;
}

.push-avatar-box {
  position: relative;
  width: 38px;
  height: 38px;
  flex-shrink: 0;
}

.assistant-push-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 1.5px solid #0ea5e9;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  background: #e2e8f0;
}

.online-indicator {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #22c55e;
  border: 2px solid #ffffff;
}

.push-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
}

.push-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.push-sender {
  font-size: 11px;
  font-weight: 700;
  color: #0369a1;
}

.push-step-tag {
  font-size: 9.5px;
  font-weight: 700;
  color: #0284c7;
  background: #e0f2fe;
  padding: 1px 6px;
  border-radius: 4px;
}
.push-step-tag.done {
  background: #dcfce7;
  color: #15803d;
}

.push-message-text {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.35;
}

/* Prancheta Ampliada de desenho do sprite (height 220px) */
.drafting-board {
  position: relative;
  width: 100%;
  height: 220px;
  background: #ffffff;
  border: 1.5px solid #cbd5e1;
  border-radius: 10px;
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.orientation-badge {
  position: absolute;
  top: 8px;
  left: 10px;
  z-index: 5;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  padding: 2px 7px;
  font-family: var(--font-mono, monospace);
  font-size: 10.5px;
  font-weight: 700;
  color: #334155;
  display: flex;
  align-items: center;
  gap: 5px;
}

.badge-dot {
  color: #0ea5e9;
  font-size: 8px;
}

.mirror-line {
  position: absolute;
  pointer-events: none;
}
.mirror-line.vertical {
  top: 0;
  bottom: 0;
  left: 50%;
  width: 2px;
  border-left: 2px dashed #10b981;
}
.mirror-line.horizontal {
  left: 0;
  right: 0;
  top: 50%;
  height: 2px;
  border-top: 2px dashed #10b981;
}

.sprite-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  transform-origin: center center;
}

.sprite-img {
  width: 120px;
  height: 120px;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.22));
}

/* Banner explicativo estilo Post-it Amarelo compacto */
.memo-dynamic-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 12px;
  background: #fefce8;
  border: 1px solid #fef08a;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.memo-pin {
  font-size: 13px;
  flex-shrink: 0;
}

.memo-text {
  font-size: 11.5px;
  font-weight: 600;
  color: #854d0e;
  line-height: 1.35;
}

/* Grid de Botões / Ferramentas em estilo carimbo de escritório */
.paper-tools-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
}

.tool-stamp-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  background: #ffffff;
  border: 1.5px solid #cbd5e1;
  border-radius: 8px;
  padding: 8px 3px;
  cursor: pointer;
  min-height: 52px;
  color: #1e293b;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.15s ease;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.tool-stamp-btn:hover {
  background: #f8fafc;
  border-color: #0ea5e9;
  transform: translateY(-1px);
}

.tool-stamp-btn:active {
  transform: scale(0.96);
}

.tool-stamp-btn.active {
  background: #e0f2fe;
  border-color: #0ea5e9;
  color: #0369a1;
}

.tool-stamp-btn.is-busy {
  opacity: 0.6;
  pointer-events: none;
}

/* Foco Ativo e Chamativo no Botão da Vez do Onboarding Guiado */
.tool-stamp-btn.is-guided-target {
  border-color: #f59e0b;
  background: #fffbeb;
  box-shadow: 0 0 14px rgba(245, 158, 11, 0.6);
  animation: pulseTargetGlow 1.4s infinite;
}

@keyframes pulseTargetGlow {
  0%,
  100% {
    border-color: #f59e0b;
    box-shadow: 0 0 8px rgba(245, 158, 11, 0.45);
    transform: translateY(0);
  }
  50% {
    border-color: #fbbf24;
    box-shadow: 0 0 18px rgba(245, 158, 11, 0.85);
    transform: translateY(-2px);
  }
}

.stamp-icon-sym {
  font-size: 16px;
  line-height: 1;
}

.stamp-label {
  font-size: 9.5px;
  font-weight: 700;
  text-align: center;
  line-height: 1.1;
  color: #334155;
}

.btn-reset-stamp {
  background: #f1f5f9;
  color: #64748b;
}

/* Rodapé Compacto */
.paper-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 4px;
  min-height: 42px;
}

.btn-text-skip {
  background: transparent;
  border: none;
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  padding: 5px 8px;
  border-radius: 4px;
}
.btn-text-skip:hover {
  color: #0f172a;
}

.btn-start-challenge {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #16a34a;
  border: none;
  border-radius: 7px;
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  padding: 9px 16px;
  cursor: pointer;
  box-shadow: 0 3px 8px rgba(22, 163, 74, 0.45);
  animation: pulseGreenReady 1.8s infinite;
  transition: all 0.15s ease;
}
.btn-start-challenge:hover {
  background: #15803d;
  transform: translateY(-1px);
}

@keyframes pulseGreenReady {
  0%,
  100% {
    box-shadow: 0 0 8px rgba(22, 163, 74, 0.45);
  }
  50% {
    box-shadow: 0 0 18px rgba(22, 163, 74, 0.85);
  }
}

.arrow-sym {
  font-size: 14px;
}

/* Modal Interno de Confirmação */
.confirm-skip-modal {
  position: absolute;
  inset: 0;
  z-index: 20;
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  border-radius: 14px;
}

.confirm-box {
  width: 100%;
  max-width: 300px;
  background: #ffffff;
  border: 1.5px solid #cbd5e1;
  border-radius: 10px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  padding: 16px;
  text-align: center;
}

.confirm-h {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
}

.confirm-p {
  margin: 0 0 12px 0;
  font-size: 11.5px;
  color: #64748b;
  line-height: 1.35;
}

.confirm-btns {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.btn-back-tut {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  color: #334155;
  font-size: 11.5px;
  font-weight: 600;
  padding: 7px 12px;
  border-radius: 6px;
  cursor: pointer;
}

.btn-confirm-skip {
  background: #ea580c;
  border: none;
  color: #ffffff;
  font-size: 11.5px;
  font-weight: 700;
  padding: 7px 14px;
  border-radius: 6px;
  cursor: pointer;
}

/* Animações */
@keyframes overlayFade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes modalPop {
  from {
    transform: scale(0.94) translateY(6px);
    opacity: 0;
  }
  to {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}

@keyframes pushSlideDown {
  from {
    transform: translateY(-8px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.push-slide-enter-active,
.push-slide-leave-active {
  transition: all 0.25s ease;
}
.push-slide-enter-from {
  opacity: 0;
  transform: translateY(-4px);
}
.push-slide-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
