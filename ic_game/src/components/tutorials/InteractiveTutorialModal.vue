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

// Ordem dos passos guiados do Rardi:
// 1. Horário (↷) -> 2. Anti-horário (↶) -> 3. Espelho H (⇄) -> 4. Espelho V (⇅)
const GUIDED_STEPS = ["rotate_cw", "rotate_ccw", "flip_h", "flip_v"];
const currentStepIndex = ref(0);

const rardiNotes = computed(() => props.tutorial?.rardiNotes || []);

// Nota atualmente ampliada em tela inteira (inicia com a Nota 1 em zoom)
const activeZoomedNoteId = ref("note_1");

// Estado de feedback e indução da próxima nota
const lastCompletedNoteIndex = ref(-1);
const isNextNoteInvited = ref(false);

const activeZoomedNote = computed(() => {
  if (!activeZoomedNoteId.value) return null;
  return (
    rardiNotes.value.find((n) => n.id === activeZoomedNoteId.value) || null
  );
});

const isAllStepsCompleted = computed(
  () => currentStepIndex.value >= GUIDED_STEPS.length,
);

const currentTargetStep = computed(() => {
  if (isAllStepsCompleted.value) return null;
  return GUIDED_STEPS[currentStepIndex.value];
});

const currentNotificationMessage = computed(() => {
  if (isAllStepsCompleted.value) {
    return t("tutorials.desk.step_prompt_done");
  }
  if (isNextNoteInvited.value) {
    return t("tutorials.desk.tap_next_note");
  }
  const currentNote = rardiNotes.value[currentStepIndex.value];
  return currentNote?.promptKey ? t(currentNote.promptKey) : "";
});

// Detecção do gesto de arrastar para cima (Swipe Up) para minimizar nota
let touchStartY = 0;
let touchStartX = 0;

function handleTouchStart(e) {
  if (!e.touches || e.touches.length === 0) return;
  touchStartY = e.touches[0].clientY;
  touchStartX = e.touches[0].clientX;
}

function handleTouchEnd(e) {
  if (!e.changedTouches || e.changedTouches.length === 0) return;
  const deltaY = touchStartY - e.changedTouches[0].clientY;
  const deltaX = Math.abs(touchStartX - e.changedTouches[0].clientX);
  // Arrastou para cima mais de 45px e movimento vertical foi predominante
  if (deltaY > 45 && deltaY > deltaX) {
    minimizeZoomedNote();
  }
}

function openNoteZoom(noteId) {
  activeZoomedNoteId.value = noteId;
  const currentNote = rardiNotes.value[currentStepIndex.value];
  if (currentNote && currentNote.id === noteId) {
    isNextNoteInvited.value = false;
  }
  playActionSfx();
}

function minimizeZoomedNote() {
  if (activeZoomedNoteId.value) {
    activeZoomedNoteId.value = null;
    playActionSfx();
  }
}

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
    lastCompletedNoteIndex.value = currentStepIndex.value;
    currentStepIndex.value++;
    playStepSuccessSfx();

    // Fecha o zoom se estiver aberto
    activeZoomedNoteId.value = null;

    // Se ainda houver passos, induz visualmente a próxima nota sem forçar tela cheia abrupta
    if (currentStepIndex.value < GUIDED_STEPS.length) {
      isNextNoteInvited.value = true;
    } else {
      isNextNoteInvited.value = false;
    }
  } else {
    playActionSfx();
  }
}

function rotateCw() {
  if (isActionCoolingDown.value) return;
  startCooldown();
  currentAngle.value += 90;
  lastAction.value = "rotate_cw";
  advanceGuidedStep("rotate_cw");
}

function rotateCcw() {
  if (isActionCoolingDown.value) return;
  startCooldown();
  currentAngle.value -= 90;
  lastAction.value = "rotate_ccw";
  advanceGuidedStep("rotate_ccw");
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
    <!-- TODO: Arte final da mesa vista de cima será desenhada futuramente pelo usuário -->
    <!-- Layout Full Screen Mobile (Sem caixotes, aproveita toda a tela do celular) -->
    <div class="desk-surface fullscreen-desk">
      <!-- 1. NOTIFICAÇÃO PUSH DA MALU (Topo absoluto, desliza de cima como notificação de celular) -->
      <header class="assistant-top-push">
        <div class="push-avatar-box">
          <img :src="assistantAvatar" alt="Malu" class="push-avatar-img" />
          <span class="online-indicator" aria-hidden="true"></span>
        </div>

        <div class="push-content-box">
          <div class="push-header-row">
            <span class="push-sender-title">{{
              $t("tutorials.desk.sender", { assistantName: "Malu" })
            }}</span>
            <span
              class="push-counter-tag"
              :class="{ done: isAllStepsCompleted }"
            >
              {{
                isAllStepsCompleted
                  ? $t("tutorials.desk.note_status_done")
                  : $t("tutorials.desk.step_counter", {
                      current: currentStepIndex + 1,
                      total: GUIDED_STEPS.length,
                    })
              }}
            </span>
          </div>

          <transition name="push-down" mode="out-in">
            <p
              :key="currentStepIndex + (isNextNoteInvited ? '-invite' : '')"
              class="push-message-text"
            >
              {{ currentNotificationMessage }}
            </p>
          </transition>
        </div>
      </header>

      <!-- 2. CABEÇALHO LIMPO (Sem o botão 'X' de pular, sem emoji de armário) -->
      <div class="tutorial-header-bar">
        <h3 class="tutorial-title">{{ $t("tutorials.desk.desk_title") }}</h3>
        <span class="tutorial-badge">{{
          $t("tutorials.desk.desk_badge")
        }}</span>
      </div>

      <!-- 3. BANDEJA DE NOTAS DO RARDI (Alinhadas de forma orgânica no topo) -->
      <div
        class="desk-notes-tray"
        :title="$t('tutorials.desk.notes_tray_title')"
      >
        <div
          v-for="(note, idx) in rardiNotes"
          :key="note.id"
          class="rardi-mini-note"
          :class="{
            'is-focus':
              idx === currentStepIndex &&
              !isAllStepsCompleted &&
              !isNextNoteInvited,
            'is-next-invited': idx === currentStepIndex && isNextNoteInvited,
            'is-done': idx < currentStepIndex,
            'just-completed': idx === lastCompletedNoteIndex,
            'is-active-reading': activeZoomedNoteId === note.id,
          }"
          :style="{
            '--note-color': note.color,
            '--note-tilt': note.tilt,
          }"
          @click="openNoteZoom(note.id)"
        >
          <!-- TODO: Substituir emoji 👇 por sprite/ícone SVG definitivo -->
          <div
            v-if="idx === currentStepIndex && isNextNoteInvited"
            class="next-note-arrow-indicator"
            aria-hidden="true"
          >
            <span>👇</span>
          </div>

          <!-- Fita adesiva decorativa -->
          <div class="mini-tape" aria-hidden="true"></div>

          <div class="mini-note-content">
            <span class="mini-icon">{{ note.icon }}</span>
            <span class="mini-title">{{ $t(note.shortTagKey) }}</span>
          </div>

          <div class="mini-status-badge">
            <span v-if="idx < currentStepIndex" class="status-done">✓</span>
            <span
              v-else-if="idx === currentStepIndex && isNextNoteInvited"
              class="status-invite"
            >
              ● Ler Nota
            </span>
            <span v-else-if="idx === currentStepIndex" class="status-focus">
              ● {{ $t("tutorials.desk.note_status_focus") }}
            </span>
            <span v-else class="status-pending">⏳</span>
          </div>
        </div>
      </div>

      <!-- 4. PALCO TÉCNICO DE CALIBRAÇÃO (Grid milimetrado RESTRIÇÃO EXCLUSIVA AQUI) -->
      <div class="sprite-canvas-box">
        <!-- Barra de controle superior do palco: Orientação (Esquerda) + Restaurar (Direita) -->
        <div class="canvas-top-bar">
          <div class="orientation-badge">
            <span class="badge-dot">●</span>
            {{ currentOrientationLabel }}
          </div>

          <!-- Botão Restaurar posicionado ao lado da orientação da imagem -->
          <button
            type="button"
            class="btn-reset-inline"
            :class="{ 'is-busy': isActionCoolingDown }"
            :title="$t('tutorials.unified.btn_reset')"
            @click="resetCanvas"
          >
            <span class="reset-sym">↺</span>
            <span class="reset-text">{{
              $t("tutorials.unified.btn_reset")
            }}</span>
          </button>
        </div>

        <!-- Eixos de reflexão sutis -->
        <div v-if="scaleY === -1" class="mirror-line horizontal"></div>
        <div v-if="scaleX === -1" class="mirror-line vertical"></div>

        <!-- Sprite flutuando livremente no centro da área técnica -->
        <div class="sprite-wrapper" :style="transformStyle">
          <img :src="spritepaintImg" alt="Sprite em teste" class="sprite-img" />
        </div>
      </div>

      <!-- 5. BANNER DINÂMICO DE GRAUS (1 linha) -->
      <!-- TODO: Substituir emoji 💡 por sprite/ícone SVG definitivo -->
      <div class="memo-dynamic-tip">
        <span class="memo-pin">💡</span>
        <span class="memo-text">{{ dynamicExplanation }}</span>
      </div>

      <!-- 6. GRADE 2x2 DE BOTÕES DE TRANSFORMAÇÃO (Maiores, gordinhos e espaçosos) -->
      <div class="paper-tools-grid-2x2">
        <!-- 1. Girar 90° Anti-horário (Linha 1, Coluna 1) -->
        <button
          type="button"
          class="tool-stamp-btn-chunky"
          :class="{
            'is-guided-target':
              currentTargetStep === 'rotate_ccw' && !isNextNoteInvited,
            'is-busy': isActionCoolingDown,
          }"
          :title="$t('tutorials.unified.tool_ccw')"
          @click="rotateCcw"
        >
          <span class="stamp-icon-sym">↶</span>
          <span class="stamp-label">90° Anti-horário</span>
        </button>

        <!-- 2. Girar 90° Horário (Linha 1, Coluna 2) -->
        <button
          type="button"
          class="tool-stamp-btn-chunky"
          :class="{
            'is-guided-target':
              currentTargetStep === 'rotate_cw' && !isNextNoteInvited,
            'is-busy': isActionCoolingDown,
          }"
          :title="$t('tutorials.unified.tool_cw')"
          @click="rotateCw"
        >
          <span class="stamp-icon-sym">↷</span>
          <span class="stamp-label">90° Horário</span>
        </button>

        <!-- 3. Espelhar Horizontal (Linha 2, Coluna 1) -->
        <button
          type="button"
          class="tool-stamp-btn-chunky"
          :class="{
            'is-guided-target':
              currentTargetStep === 'flip_h' && !isNextNoteInvited,
            active: scaleX === -1,
            'is-busy': isActionCoolingDown,
          }"
          :title="$t('tutorials.unified.tool_flip_h')"
          @click="flipHorizontal"
        >
          <span class="stamp-icon-sym">⇄</span>
          <span class="stamp-label">Espelho Horizontal</span>
        </button>

        <!-- 4. Espelhar Vertical (Linha 2, Coluna 2) -->
        <button
          type="button"
          class="tool-stamp-btn-chunky"
          :class="{
            'is-guided-target':
              currentTargetStep === 'flip_v' && !isNextNoteInvited,
            active: scaleY === -1,
            'is-busy': isActionCoolingDown,
          }"
          :title="$t('tutorials.unified.tool_flip_v')"
          @click="flipVertical"
        >
          <span class="stamp-icon-sym">⇅</span>
          <span class="stamp-label">Espelho Vertical</span>
        </button>
      </div>

      <!-- 7. RODAPÉ DA TELA (Pular Tutorial à esquerda + Iniciar Desafio à direita) -->
      <footer class="fullscreen-footer">
        <button
          type="button"
          class="btn-text-skip"
          @click="showSkipDialog = true"
        >
          {{ $t("tutorials.unified.btn_skip") }}
        </button>

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
    </div>

    <!-- OVERLAY DE ZOOM DA NOTA (Tela Inteira, desfoque global, botão X flutuante no topo) -->
    <transition name="note-zoom">
      <div
        v-if="activeZoomedNote"
        class="zoomed-note-backdrop-global"
        @click.self="minimizeZoomedNote"
      >
        <div
          class="zoomed-note-card"
          :style="{ '--note-color': activeZoomedNote.color }"
          @touchstart.passive="handleTouchStart"
          @touchend.passive="handleTouchEnd"
        >
          <!-- Botão "X" Flutuante Elegante no Topo da Nota -->
          <button
            type="button"
            class="btn-floating-close-note"
            :title="$t('tutorials.desk.close_note')"
            @click.stop="minimizeZoomedNote"
          >
            ✕
          </button>

          <!-- Fita decorativa grande -->
          <div class="zoomed-tape" aria-hidden="true"></div>

          <header class="zoomed-header">
            <span class="zoomed-icon">{{ activeZoomedNote.icon }}</span>
            <h4 class="zoomed-title">{{ $t(activeZoomedNote.titleKey) }}</h4>
          </header>

          <div class="zoomed-body">
            <p class="zoomed-text">{{ $t(activeZoomedNote.textKey) }}</p>
          </div>

          <div class="zoomed-swipe-hint">
            <span class="swipe-arrow">⬆</span>
            <span>{{ $t("tutorials.desk.swipe_tip") }}</span>
          </div>
        </div>
      </div>
    </transition>

    <!-- MODAL INTERNO DE CONFIRMAÇÃO PARA PULAR -->
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
</template>

<style scoped>
.tutorial-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(16, 24, 32, 0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  padding: 6px;
  animation: overlayFade 0.2s ease-out;
}

/* Layout Full Screen Mobile: preenche a tela com margens mínimas de respiro */
.desk-surface.fullscreen-desk {
  position: relative;
  width: 100%;
  height: 100%;
  max-width: 500px;
  max-height: 860px;
  background-color: #fbf9f4;
  /* Sem grid geral na mesa - fundo liso e limpo */
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow:
    0 16px 40px -10px rgba(0, 0, 0, 0.4),
    0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 8px 10px 10px 10px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 6px;
  overflow: hidden;
  animation: cardSlideUp 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}

/* 1. NOTIFICAÇÃO PUSH DA MALU (Topo Absoluto estilo celular) */
.assistant-top-push {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #ffffff;
  border: 1.5px solid #e2e8f0;
  border-radius: 14px;
  padding: 8px 12px;
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.08),
    0 1px 3px rgba(0, 0, 0, 0.04);
}

.push-avatar-box {
  position: relative;
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: #f1f5f9;
  border: 1.5px solid #cbd5e1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.push-avatar-img {
  width: 32px;
  height: 32px;
  object-fit: contain;
  image-rendering: pixelated;
}

.online-indicator {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 10px;
  height: 10px;
  background: #22c55e;
  border: 2px solid #ffffff;
  border-radius: 50%;
}

.push-content-box {
  flex: 1;
  min-width: 0;
}

.push-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2px;
}

.push-sender-title {
  font-size: 0.74rem;
  font-weight: 800;
  color: #1e293b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.push-counter-tag {
  font-size: 0.65rem;
  font-weight: 800;
  color: #0369a1;
  background: #e0f2fe;
  padding: 1px 7px;
  border-radius: 10px;
}

.push-counter-tag.done {
  color: #15803d;
  background: #dcfce7;
}

.push-message-text {
  font-size: 0.78rem;
  font-weight: 700;
  color: #334155;
  margin: 0;
  line-height: 1.25;
}

/* Transição vindo de cima para a notificação */
.push-down-enter-active,
.push-down-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.24s cubic-bezier(0.16, 1, 0.3, 1);
}

.push-down-enter-from {
  opacity: 0;
  transform: translateY(-16px);
}

.push-down-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

/* 2. CABEÇALHO LIMPO (Sem 'X' de pular, sem emoji) */
.tutorial-header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px;
}

.tutorial-title {
  font-size: 0.92rem;
  font-weight: 800;
  color: #1e293b;
  margin: 0;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.tutorial-badge {
  font-size: 0.65rem;
  font-weight: 800;
  color: #64748b;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 2px 6px;
  border-radius: 6px;
  letter-spacing: 0.04em;
}

/* 3. BANDEJA DE NOTAS DO RARDI */
.desk-notes-tray {
  display: flex;
  gap: 6px;
  justify-content: space-between;
  padding: 4px 2px 2px 2px;
}

.rardi-mini-note {
  flex: 1;
  min-width: 0;
  background-color: var(--note-color, #fef08a);
  transform: rotate(var(--note-tilt, 0deg));
  border-radius: 6px;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.12);
  cursor: pointer;
  padding: 5px 3px 3px 3px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  transition: all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
  user-select: none;
  -webkit-user-select: none;
}

.rardi-mini-note:hover {
  transform: scale(1.08) rotate(0deg);
  z-index: 5;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.2);
}

.rardi-mini-note.is-active-reading {
  box-shadow:
    0 0 0 2px #0284c7,
    0 6px 14px rgba(0, 0, 0, 0.2);
}

.rardi-mini-note.is-focus {
  outline: 2px solid #0284c7;
  animation: pulseFocusNote 2s infinite ease-in-out;
}

.rardi-mini-note.is-next-invited {
  outline: 2.5px solid #0284c7;
  animation: pulseInvited 1.5s infinite ease-in-out;
  z-index: 6;
}

.rardi-mini-note.is-done {
  opacity: 0.9;
}

.next-note-arrow-indicator {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 1.1rem;
  line-height: 1;
  animation: bounceDown 1s infinite ease-in-out;
  pointer-events: none;
  z-index: 10;
}

.mini-tape {
  position: absolute;
  top: -4px;
  width: 24px;
  height: 8px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px dashed rgba(0, 0, 0, 0.15);
  border-radius: 2px;
}

.mini-note-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 2px;
}

.mini-icon {
  font-size: 1.1rem;
  font-weight: 800;
  line-height: 1;
  color: #1e293b;
}

.mini-title {
  font-size: 0.6rem;
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  text-align: center;
  color: #334155;
  margin-top: 1px;
}

.mini-status-badge {
  font-size: 0.56rem;
  font-weight: 800;
  margin-top: 2px;
  padding: 1px 3px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.06);
}

.status-done {
  color: #15803d;
  font-weight: 900;
  display: inline-block;
}

.just-completed .status-done {
  animation: stampPop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.status-focus {
  color: #0369a1;
  font-weight: 800;
}

.status-invite {
  color: #0284c7;
  font-weight: 900;
  background: #e0f2fe;
}

.status-pending {
  color: #64748b;
}

/* 4. PALCO TÉCNICO DE CALIBRAÇÃO (Grid milimetrado RESTRIÇÃO EXCLUSIVA AQUI) */
.sprite-canvas-box {
  position: relative;
  width: 100%;
  height: 180px;
  background-color: #ffffff;
  /* Linhas técnicas de prancheta milimetrada - EXCLUSIVAS DESTE PALCO */
  background-image:
    linear-gradient(rgba(14, 165, 233, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(14, 165, 233, 0.08) 1px, transparent 1px),
    linear-gradient(rgba(14, 165, 233, 0.16) 1px, transparent 1px),
    linear-gradient(90deg, rgba(14, 165, 233, 0.16) 1px, transparent 1px);
  background-size:
    8px 8px,
    8px 8px,
    40px 40px,
    40px 40px;
  border-radius: 12px;
  border: 1.5px solid #cbd5e1;
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.04);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

/* Barra superior da área técnica: Orientação (Esquerda) + Botão Restaurar (Direita) */
.canvas-top-bar {
  position: absolute;
  top: 6px;
  left: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 10;
}

.orientation-badge {
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(4px);
  color: #f8fafc;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

.badge-dot {
  color: #38bdf8;
  font-size: 0.55rem;
}

/* Botão Restaurar migrado para a área técnica ao lado do selo de orientação */
.btn-reset-inline {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #f8fafc;
  border: 1.5px solid #cbd5e1;
  border-radius: 8px;
  padding: 3px 8px;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  transition: all 0.15s ease;
}

.btn-reset-inline:hover:not(:disabled) {
  background: #f1f5f9;
  border-color: #94a3b8;
}

.btn-reset-inline:active:not(:disabled) {
  transform: translateY(1px);
}

.btn-reset-inline.is-busy {
  opacity: 0.6;
  pointer-events: none;
}

.reset-sym {
  font-size: 0.95rem;
  font-weight: 800;
  line-height: 1;
  color: #1e293b;
}

.reset-text {
  font-size: 0.68rem;
  font-weight: 700;
  color: #334155;
}

.mirror-line {
  position: absolute;
  pointer-events: none;
  z-index: 5;
}

.mirror-line.horizontal {
  left: 0;
  right: 0;
  top: 50%;
  height: 2px;
  background: repeating-linear-gradient(
    90deg,
    #0284c7,
    #0284c7 6px,
    transparent 6px,
    transparent 12px
  );
  animation: pulseAxis 1.5s infinite;
}

.mirror-line.vertical {
  top: 0;
  bottom: 0;
  left: 50%;
  width: 2px;
  background: repeating-linear-gradient(
    0deg,
    #0284c7,
    #0284c7 6px,
    transparent 6px,
    transparent 12px
  );
  animation: pulseAxis 1.5s infinite;
}

.sprite-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 115px;
  height: 115px;
  will-change: transform;
}

.sprite-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  image-rendering: pixelated;
  filter: drop-shadow(0 6px 10px rgba(0, 0, 0, 0.18));
}

/* 5. BANNER DINÂMICO DE GRAUS */
.memo-dynamic-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fef9c3;
  border: 1px solid #fde047;
  border-radius: 8px;
  padding: 5px 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.memo-pin {
  font-size: 0.95rem;
}

.memo-text {
  font-size: 0.76rem;
  font-weight: 700;
  color: #713f12;
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 6. GRADE 2x2 DE BOTÕES DE TRANSFORMAÇÃO (Gordinhos, altos e confortáveis) */
.paper-tools-grid-2x2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 8px;
  width: 100%;
}

.tool-stamp-btn-chunky {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 54px;
  padding: 8px 10px;
  background: #ffffff;
  border: 2px solid #cbd5e1;
  border-radius: 10px;
  cursor: pointer;
  box-shadow: 0 2px 0 #94a3b8;
  transition: all 0.12s ease;
  user-select: none;
  -webkit-user-select: none;
}

.tool-stamp-btn-chunky:hover:not(:disabled) {
  background: #f1f5f9;
  border-color: #94a3b8;
}

.tool-stamp-btn-chunky:active:not(:disabled) {
  transform: translateY(2px);
  box-shadow: 0 0 0 #94a3b8;
}

.tool-stamp-btn-chunky.active {
  background: #e0f2fe;
  border-color: #0284c7;
  box-shadow: 0 2px 0 #0369a1;
}

.tool-stamp-btn-chunky.is-guided-target {
  outline: 3px solid #22c55e;
  border-color: #16a34a;
  animation: pulseGuided 1.4s infinite ease-in-out;
}

.tool-stamp-btn-chunky.is-busy {
  pointer-events: none;
  opacity: 0.75;
}

.stamp-icon-sym {
  font-size: 1.35rem;
  font-weight: 800;
  line-height: 1;
  color: #1e293b;
}

.stamp-label {
  font-size: 0.74rem;
  font-weight: 700;
  color: #334155;
  white-space: nowrap;
}

/* 7. RODAPÉ DA TELA */
.fullscreen-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2px 4px 0 4px;
}

.btn-text-skip {
  background: none;
  border: none;
  font-size: 0.78rem;
  font-weight: 600;
  color: #94a3b8;
  text-decoration: underline;
  cursor: pointer;
  padding: 4px 6px;
}

.btn-text-skip:hover {
  color: #64748b;
}

.btn-start-challenge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #ffffff;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 0.86rem;
  font-weight: 800;
  box-shadow:
    0 3px 0 #047857,
    0 4px 10px rgba(16, 185, 129, 0.4);
  cursor: pointer;
  transition: all 0.15s ease;
  animation: pulseGreen 1.8s infinite;
}

.btn-start-challenge:hover:not(:disabled) {
  filter: brightness(1.08);
  transform: translateY(-1px);
}

.btn-start-challenge:active:not(:disabled) {
  transform: translateY(2px);
  box-shadow: 0 1px 0 #047857;
}

.arrow-sym {
  font-size: 1rem;
  line-height: 1;
}

/* OVERLAY DE ZOOM DA NOTA EM TELA INTEIRA (Global Blur) */
.zoomed-note-backdrop-global {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  z-index: 2200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  animation: overlayFade 0.22s ease-out;
}

.zoomed-note-card {
  position: relative;
  width: 100%;
  max-width: 380px;
  background-color: var(--note-color, #fef08a);
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.45),
    0 2px 6px rgba(0, 0, 0, 0.15);
  padding: 22px 18px 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  touch-action: pan-y;
  transform-origin: center top;
  animation: zoomCardIn 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Botão "X" Flutuante no Topo da Nota */
.btn-floating-close-note {
  position: absolute;
  top: -14px;
  right: -12px;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #0f172a;
  color: #f8fafc;
  border: 2.5px solid #ffffff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
  font-size: 0.95rem;
  font-weight: 800;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 20;
}

.btn-floating-close-note:hover {
  transform: scale(1.15) rotate(90deg);
  background: #ef4444;
}

.btn-floating-close-note:active {
  transform: scale(0.92);
}

.zoomed-tape {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 70px;
  height: 18px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px dashed rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.zoomed-header {
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1.5px dashed rgba(0, 0, 0, 0.15);
  padding-bottom: 8px;
}

.zoomed-icon {
  font-size: 1.4rem;
  font-weight: 800;
  line-height: 1;
  color: #0f172a;
}

.zoomed-title {
  font-size: 1rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}

.zoomed-body {
  font-size: 0.85rem;
  line-height: 1.45;
  color: #1e293b;
  font-weight: 600;
}

.zoomed-text {
  margin: 0;
}

.zoomed-swipe-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 0.72rem;
  font-weight: 700;
  color: #64748b;
  margin-top: 4px;
}

.swipe-arrow {
  animation: bounceUp 1.2s infinite ease-in-out;
}

/* Modal de Confirmação para Pular */
.confirm-skip-modal {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  z-index: 2300;
}

.confirm-box {
  background: #ffffff;
  border: 2px solid #cbd5e1;
  border-radius: 12px;
  padding: 18px 20px;
  max-width: 340px;
  width: 100%;
  text-align: center;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
  animation: popIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.confirm-h {
  font-size: 1rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 6px 0;
}

.confirm-p {
  font-size: 0.82rem;
  color: #475569;
  margin: 0 0 16px 0;
  line-height: 1.35;
}

.confirm-btns {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.btn-back-tut {
  flex: 1;
  padding: 8px 12px;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.82rem;
  font-weight: 700;
  color: #334155;
  cursor: pointer;
}

.btn-confirm-skip {
  flex: 1;
  padding: 8px 12px;
  background: #fee2e2;
  border: 1px solid #fca5a5;
  border-radius: 6px;
  font-size: 0.82rem;
  font-weight: 700;
  color: #dc2626;
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

@keyframes cardSlideUp {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes zoomCardIn {
  from {
    opacity: 0;
    transform: scale(0.35) translateY(-120px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes popIn {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes pulseGuided {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.6);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(34, 197, 94, 0);
  }
}

@keyframes pulseFocusNote {
  0%,
  100% {
    outline-color: #0284c7;
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.12);
  }
  50% {
    outline-color: #38bdf8;
    box-shadow: 0 0 10px rgba(14, 165, 233, 0.5);
  }
}

@keyframes pulseInvited {
  0%,
  100% {
    transform: scale(1.05) rotate(0deg);
    box-shadow: 0 4px 12px rgba(2, 132, 199, 0.45);
  }
  50% {
    transform: scale(1.1) rotate(0deg);
    box-shadow: 0 6px 18px rgba(2, 132, 199, 0.7);
  }
}

@keyframes stampPop {
  0% {
    transform: scale(0) rotate(-35deg);
    opacity: 0;
  }
  65% {
    transform: scale(1.45) rotate(10deg);
    opacity: 1;
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

@keyframes pulseAxis {
  0%,
  100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
}

@keyframes pulseGreen {
  0%,
  100% {
    box-shadow:
      0 3px 0 #047857,
      0 0 0 0 rgba(16, 185, 129, 0.6);
  }
  50% {
    box-shadow:
      0 3px 0 #047857,
      0 0 0 8px rgba(16, 185, 129, 0);
  }
}

@keyframes bounceUp {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}

@keyframes bounceDown {
  0%,
  100% {
    transform: translateX(-50%) translateY(0);
  }
  50% {
    transform: translateX(-50%) translateY(4px);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.note-zoom-enter-active,
.note-zoom-leave-active {
  transition:
    opacity 0.24s ease,
    transform 0.26s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.note-zoom-enter-from,
.note-zoom-leave-to {
  opacity: 0;
  transform: scale(0.35) translateY(-120px);
}
</style>
