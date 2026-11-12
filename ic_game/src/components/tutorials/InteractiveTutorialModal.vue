<script setup>
import { ref, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import AudioManager from "../../game/managers/AudioManager";
import AssistantPushBanner from "./AssistantPushBanner.vue";
import SpatialProjectionArena from "./SpatialProjectionArena.vue";

const props = defineProps({
  tutorial: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["complete", "skip"]);

const { t } = useI18n();

const rardiNotes = computed(() => props.tutorial?.rardiNotes || []);

// Índice do passo atualmente ativo em tela (0 ou 1)
const activeStepIndex = ref(0);
// Maior índice desbloqueado até o momento (inicia em 0; quando conclui todos = rardiNotes.length)
const unlockedMaxStepIndex = ref(0);
// Mapa de opções corretas já marcadas por índice de passo: { [stepIdx]: optionId }
const solvedOptionByStep = ref({});
// Passo recém-concluído para animação de carimbo ✓ na aba
const lastCompletedNoteIndex = ref(-1);

// Estado de bloqueio (shake em aba trancada) e dica de erro da peça atual
const shakingNoteIndex = ref(-1);
const activeErrorTipKey = ref(null);

// Modal opcional de zoom da nota e confirmação de pular
const activeZoomedNoteId = ref(null);
const zoomOriginStyle = ref({});
const showSkipDialog = ref(false);
const isSubmitting = ref(false);

watch(
  () => props.tutorial?.id,
  () => {
    activeStepIndex.value = 0;
    unlockedMaxStepIndex.value = 0;
    solvedOptionByStep.value = {};
    lastCompletedNoteIndex.value = -1;
    shakingNoteIndex.value = -1;
    activeErrorTipKey.value = null;
    activeZoomedNoteId.value = null;
  },
);

const totalSteps = computed(() => rardiNotes.value.length || 1);

const isAllStepsCompleted = computed(
  () => unlockedMaxStepIndex.value >= rardiNotes.value.length,
);

const currentActiveNote = computed(
  () => rardiNotes.value[activeStepIndex.value] || rardiNotes.value[0] || null,
);

const currentStepOptions = computed(
  () => currentActiveNote.value?.options || [],
);

const currentStepSolvedOptionId = computed(
  () => solvedOptionByStep.value[activeStepIndex.value] || null,
);

const canGoToNextStep = computed(
  () =>
    Boolean(currentStepSolvedOptionId.value) &&
    activeStepIndex.value < rardiNotes.value.length - 1,
);

function isNoteUnlocked(idx) {
  return idx <= unlockedMaxStepIndex.value;
}

function isNoteCompleted(idx) {
  return Boolean(solvedOptionByStep.value[idx]);
}

const activeZoomedNote = computed(() => {
  if (!activeZoomedNoteId.value) return null;
  return (
    rardiNotes.value.find((n) => n.id === activeZoomedNoteId.value) || null
  );
});

const counterLabel = computed(() =>
  isAllStepsCompleted.value
    ? t("tutorials.desk.note_status_done")
    : t("tutorials.desk.step_counter", {
        current: activeStepIndex.value + 1,
        total: totalSteps.value,
      }),
);

const currentNotificationMessage = computed(() => {
  if (activeErrorTipKey.value) {
    return t(activeErrorTipKey.value);
  }
  if (isAllStepsCompleted.value) {
    return t("tutorials.desk.step_prompt_done");
  }
  if (canGoToNextStep.value) {
    return t("tutorials.desk.step_1_solved_prompt");
  }
  const note = currentActiveNote.value;
  return note?.promptKey ? t(note.promptKey) : "";
});

const notificationKey = computed(() => {
  if (activeErrorTipKey.value) return `err-${activeErrorTipKey.value}`;
  if (isAllStepsCompleted.value) return "done";
  if (canGoToNextStep.value) return `solved-${activeStepIndex.value}`;
  return `step-${activeStepIndex.value}`;
});

function playSfx(key, volume = 0.5) {
  try {
    AudioManager.play(key, { volume });
  } catch (e) {}
}

function handleNoteTabClick(note, idx, event) {
  if (!isNoteUnlocked(idx)) {
    shakingNoteIndex.value = idx;
    playSfx("error", 0.4);
    setTimeout(() => {
      if (shakingNoteIndex.value === idx) {
        shakingNoteIndex.value = -1;
      }
    }, 450);
    return;
  }

  activeErrorTipKey.value = null;

  if (activeStepIndex.value === idx) {
    openNoteZoom(note, event);
    return;
  }

  activeStepIndex.value = idx;
  playSfx("swipe", 0.45);
}

function goToNextStep() {
  if (activeStepIndex.value < rardiNotes.value.length - 1) {
    activeErrorTipKey.value = null;
    activeStepIndex.value += 1;
    playSfx("swipe", 0.5);
  }
}

function openNoteZoom(note, event) {
  if (event && event.currentTarget) {
    const rect = event.currentTarget.getBoundingClientRect();
    const dx = rect.left + rect.width / 2 - window.innerWidth / 2;
    const dy = rect.top + rect.height / 2 - window.innerHeight / 2;
    zoomOriginStyle.value = {
      "--dx": `${dx.toFixed(1)}px`,
      "--dy": `${dy.toFixed(1)}px`,
    };
  }
  activeZoomedNoteId.value = note.id;
  playSfx("swipe", 0.45);
}

function minimizeZoomedNote() {
  if (activeZoomedNoteId.value) {
    activeZoomedNoteId.value = null;
    playSfx("swipe", 0.45);
  }
}

function handleOptionPlaced(option) {
  if (option.isCorrect) {
    activeErrorTipKey.value = null;
    const stepIdx = activeStepIndex.value;
    solvedOptionByStep.value = {
      ...solvedOptionByStep.value,
      [stepIdx]: option.id,
    };
    lastCompletedNoteIndex.value = stepIdx;
    playSfx("connect", 0.7);

    if (stepIdx >= unlockedMaxStepIndex.value) {
      unlockedMaxStepIndex.value = stepIdx + 1;
    }
  } else {
    activeErrorTipKey.value = option.errorTipKey || null;
    playSfx("error", 0.45);
  }
}

function handleOptionRemoved() {
  activeErrorTipKey.value = null;
}

function handleStartChallenge() {
  if (isSubmitting.value) return;
  isSubmitting.value = true;
  playSfx("stamp", 0.7);
  emit("complete");
}

function handleConfirmSkip() {
  if (isSubmitting.value) return;
  isSubmitting.value = true;
  emit("skip");
}
</script>

<template>
  <div
    class="tutorial-overlay modal-backdrop-blur"
    role="dialog"
    aria-modal="true"
  >
    <div class="desk-surface fullscreen-desk">
      <!-- 1. NOTIFICAÇÃO PUSH DA MALU (Componente Modular SRP) -->
      <AssistantPushBanner
        :message="currentNotificationMessage"
        :messageKey="notificationKey"
        :counterLabel="counterLabel"
        :isError="Boolean(activeErrorTipKey)"
        :isDone="isAllStepsCompleted || Boolean(currentStepSolvedOptionId)"
      />

      <!-- 2. CABEÇALHO + ABAS DE NOTAS DO RARDI -->
      <div class="top-notes-header-row">
        <div class="tutorial-header-bar">
          <h3 class="tutorial-title">
            {{
              tutorial?.id === "spatial_reflection"
                ? $t("tutorials.desk.reflection_title")
                : $t("tutorials.desk.desk_title")
            }}
          </h3>
          <span class="tutorial-badge">
            {{
              tutorial?.id === "spatial_reflection"
                ? $t("tutorials.desk.reflection_badge")
                : $t("tutorials.desk.desk_badge")
            }}
          </span>
        </div>

        <div
          class="desk-notes-tray"
          :title="$t('tutorials.desk.notes_tray_title')"
        >
          <button
            v-for="(note, idx) in rardiNotes"
            :key="note.id"
            type="button"
            class="rardi-mini-note-tab"
            :class="{
              'is-locked': !isNoteUnlocked(idx),
              'is-shaking': shakingNoteIndex === idx,
              'is-active': idx === activeStepIndex,
              'is-done': isNoteCompleted(idx),
              'is-next-invited': canGoToNextStep && idx === activeStepIndex + 1,
              'just-completed': idx === lastCompletedNoteIndex,
            }"
            :style="{ '--note-color': note.color }"
            :title="
              !isNoteUnlocked(idx) ? $t('tutorials.desk.note_locked_tip') : ''
            "
            @click="handleNoteTabClick(note, idx, $event)"
          >
            <span class="mini-tab-title">{{ $t(note.shortTagKey) }}</span>
            <span v-if="isNoteCompleted(idx)" class="tab-status-done">✓</span>
            <span v-else-if="!isNoteUnlocked(idx)" class="tab-status-locked"
              >🔒</span
            >
            <span v-else class="tab-status-active">●</span>
          </button>
        </div>
      </div>

      <!-- 3. POST-IT VISUAL DO RARDI (Diagrama animado com marcador ▲ + Regra de Ouro) -->
      <section
        v-if="currentActiveNote"
        class="rardi-visual-note-card"
        :style="{ '--note-color': currentActiveNote.color }"
        @click="openNoteZoom(currentActiveNote, $event)"
      >
        <div class="postit-tape-strip" aria-hidden="true"></div>

        <div class="visual-note-body">
          <div class="visual-note-text-col">
            <h4 class="note-card-title">
              {{ $t(currentActiveNote.titleKey) }}
            </h4>

            <!-- Sequência de rabiscos desenhados à mão no post-it (ex.: relógio -> 1/4 -> seta) -->
            <div
              v-if="currentActiveNote.sketchImages?.length"
              class="note-sketch-strip"
              aria-hidden="true"
            >
              <template
                v-for="(sketch, sIdx) in currentActiveNote.sketchImages"
                :key="sIdx"
              >
                <div
                  class="sketch-step-item"
                  :style="{
                    '--sketch-tilt': sketch.tilt || '-1.5deg',
                    '--step-delay': `${sIdx * 0.8}s`,
                  }"
                >
                  <img
                    :src="sketch.src"
                    :alt="sketch.label || ''"
                    class="sketch-ink-img"
                    draggable="false"
                  />
                  <span v-if="sketch.label" class="sketch-step-label">
                    {{ sketch.label }}
                  </span>
                </div>

                <span
                  v-if="sIdx < currentActiveNote.sketchImages.length - 1"
                  class="sketch-drawn-arrow"
                >
                  →
                </span>
              </template>
            </div>

            <p
              v-else-if="
                currentActiveNote.goldenRuleKey &&
                $t(currentActiveNote.goldenRuleKey)
              "
              class="note-golden-rule-pill"
            >
              {{ $t(currentActiveNote.goldenRuleKey) }}
            </p>

            <p class="note-short-explanation">
              {{ $t(currentActiveNote.textKey) }}
            </p>
          </div>
        </div>
      </section>

      <!-- 4. PALCO DE PROJEÇÃO E DRAG-AND-DROP (Componente Modular SRP) -->
      <SpatialProjectionArena
        v-if="currentActiveNote"
        :options="currentStepOptions"
        :actionKey="currentActiveNote.actionKey"
        :initialPlacedOptionId="currentStepSolvedOptionId"
        @option-placed="handleOptionPlaced"
        @option-removed="handleOptionRemoved"
      />

      <!-- 5. RODAPÉ DA TELA (Pular Tutorial à esquerda + Próximo Passo / Iniciar Desafio à direita) -->
      <footer class="fullscreen-footer">
        <button
          type="button"
          class="btn-text-skip"
          @click="showSkipDialog = true"
        >
          {{ $t("tutorials.unified.btn_skip") }}
        </button>

        <transition name="fade" mode="out-in">
          <button
            v-if="canGoToNextStep"
            key="btn-next-step"
            type="button"
            class="btn-next-step"
            @click="goToNextStep"
          >
            <span>{{ $t("tutorials.desk.btn_next_step") }}</span>
            <span class="arrow-sym">→</span>
          </button>

          <button
            v-else-if="isAllStepsCompleted"
            key="btn-start-challenge"
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

    <!-- OVERLAY DE ZOOM OPCIONAL DA NOTA DO RARDI -->
    <transition name="note-zoom">
      <div
        v-if="activeZoomedNote"
        class="zoomed-note-backdrop modal-backdrop-blur"
        @click.self="minimizeZoomedNote"
      >
        <div
          class="zoomed-note-card"
          :style="[{ '--note-color': activeZoomedNote.color }, zoomOriginStyle]"
        >
          <button
            type="button"
            class="btn-floating-close-note"
            :title="$t('tutorials.desk.close_note')"
            @click.stop="minimizeZoomedNote"
          >
            ✕
          </button>

          <div class="postit-tape-strip zoomed-tape" aria-hidden="true"></div>

          <header class="zoomed-header">
            <h4 class="zoomed-title">{{ $t(activeZoomedNote.titleKey) }}</h4>
          </header>

          <div
            v-if="activeZoomedNote.sketchImages?.length"
            class="note-sketch-strip is-zoomed"
            aria-hidden="true"
          >
            <template
              v-for="(sketch, sIdx) in activeZoomedNote.sketchImages"
              :key="sIdx"
            >
              <div
                class="sketch-step-item"
                :style="{
                  '--sketch-tilt': sketch.tilt || '-1.5deg',
                  '--step-delay': `${sIdx * 0.8}s`,
                }"
              >
                <img
                  :src="sketch.src"
                  :alt="sketch.label || ''"
                  class="sketch-ink-img"
                  draggable="false"
                />
                <span v-if="sketch.label" class="sketch-step-label">
                  {{ sketch.label }}
                </span>
              </div>

              <span
                v-if="sIdx < activeZoomedNote.sketchImages.length - 1"
                class="sketch-drawn-arrow"
              >
                →
              </span>
            </template>
          </div>

          <p
            v-else-if="
              activeZoomedNote.goldenRuleKey &&
              $t(activeZoomedNote.goldenRuleKey)
            "
            class="note-golden-rule-pill"
          >
            {{ $t(activeZoomedNote.goldenRuleKey) }}
          </p>

          <div class="zoomed-body">
            <p class="zoomed-text">{{ $t(activeZoomedNote.textKey) }}</p>
          </div>
        </div>
      </div>
    </transition>

    <!-- MODAL INTERNO DE CONFIRMAÇÃO PARA PULAR -->
    <transition name="fade">
      <div v-if="showSkipDialog" class="confirm-skip-modal modal-backdrop-blur">
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
  z-index: 2000;
  padding: 6px;
}

.desk-surface.fullscreen-desk {
  position: relative;
  width: 100%;
  height: 100%;
  max-width: 500px;
  max-height: 860px;
  background-color: #fbf9f4;
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

/* CABEÇALHO + ABAS DE NOTAS DO RARDI */
.top-notes-header-row {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.tutorial-header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2px;
}

.tutorial-title {
  font-size: 0.86rem;
  font-weight: 800;
  color: #1e293b;
  margin: 0;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.tutorial-badge {
  font-size: 0.62rem;
  font-weight: 800;
  color: #64748b;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 2px 6px;
  border-radius: 6px;
  letter-spacing: 0.04em;
}

.desk-notes-tray {
  display: flex;
  gap: 8px;
}

.rardi-mini-note-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 6px 10px;
  background-color: var(--note-color, var(--folder-bg));
  border: 1.5px solid rgba(15, 23, 42, 0.15);
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.18s ease;
  height: 6vh;
}

.rardi-mini-note-tab.is-active {
  border-color: #0284c7;
  box-shadow:
    0 0 0 2px rgba(2, 132, 199, 0.25),
    0 3px 8px rgba(0, 0, 0, 0.12);
  transform: translateY(-1px);
}

.rardi-mini-note-tab.is-next-invited {
  border-color: var(--color-valid-border);
  box-shadow: 0 0 0 2.5px rgba(22, 163, 74, 0.35);
  animation: pulseGreen 1.6s infinite;
}

.rardi-mini-note-tab.is-locked {
  opacity: 0.45;
  cursor: not-allowed;
  filter: grayscale(0.25);
}

.rardi-mini-note-tab.is-shaking {
  animation: lockShake 0.45s ease-in-out !important;
}

.mini-tab-title {
  font-family: var(--font-handwritten);
  font-size: clamp(1rem, 3.6vw, 1.14rem);
  font-weight: 700;
  letter-spacing: 0.01em;
  color: #1e293b;
}

.tab-status-done {
  font-size: 0.78rem;
  font-weight: 900;
  color: var(--color-valid-shadow);
}

.just-completed .tab-status-done {
  animation: stampPop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.tab-status-locked {
  font-size: 0.68rem;
}

.tab-status-active {
  font-size: 0.65rem;
  color: #0284c7;
}

/* POST-IT VISUAL DO RARDI (EXPANDIDO MOBILE-FIRST) */
.rardi-visual-note-card {
  position: relative;
  flex: 1 1 auto;
  min-height: clamp(148px, 21vh, 210px);
  max-height: 235px;
  display: flex;
  align-items: center;
  background-color: var(--note-color, var(--folder-bg));
  background-image: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.32) 0%,
    rgba(161, 98, 7, 0.06) 100%
  );
  border-radius: 12px;
  border: 1.5px solid rgba(15, 23, 42, 0.14);
  box-shadow:
    0 5px 14px rgba(0, 0, 0, 0.1),
    0 1px 3px rgba(0, 0, 0, 0.06);
  padding: clamp(14px, 2.4vh, 22px) 12px;
  cursor: pointer;
}

.visual-note-body {
  width: 100%;
  display: flex;
  align-items: center;
}

.visual-note-text-col {
  width: 100%;
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: clamp(6px, 1.2vh, 12px);
}

.note-card-title {
  margin: 0;
  font-family: var(--font-handwritten);
  font-size: clamp(1.32rem, 4.8vw, 1.55rem);
  font-weight: 700;
  line-height: 1.05;
  color: #292524;
}

/* TIRINHA DE DESENHOS MESCLADOS COM O POST-IT (EFEITO CANETA NO PAPEL AMARELO) */
.note-sketch-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 2px 6px 2px;
  margin: 2px 20px;
  border-bottom: 1.5px dashed rgba(68, 64, 60, 0.22);
}

.note-sketch-strip.is-zoomed {
  justify-content: center;
  gap: 12px;
  padding: 8px 14px;
  width: 100%;
}

.sketch-step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  transform: rotate(var(--sketch-tilt, -1.5deg));
  animation: sketchStepHighlight 3.6s infinite ease-in-out;
  animation-delay: var(--step-delay, 0s);
}

.sketch-ink-img {
  width: clamp(42px, 11.5vw, 50px);
  height: clamp(42px, 11.5vw, 50px);
  object-fit: contain;
  image-rendering: pixelated;
  /* Mescla o cinza da imagem com o fundo amarelo do post-it como tinta de caneta */
  mix-blend-mode: multiply;
  filter: sepia(0.58) hue-rotate(-8deg) saturate(1.55) brightness(1.12)
    contrast(0.95);
  opacity: 0.88;
  pointer-events: none;
}

.note-sketch-strip.is-zoomed .sketch-ink-img {
  width: 64px;
  height: 64px;
}

.sketch-step-label {
  font-family: var(--font-handwritten);
  font-size: clamp(0.88rem, 2.9vw, 1.02rem);
  font-weight: 700;
  line-height: 1;
  color: #44403c;
  white-space: nowrap;
}

.note-sketch-strip.is-zoomed .sketch-step-label {
  font-size: 1.12rem;
}

.sketch-drawn-arrow {
  font-family: var(--font-handwritten);
  font-size: 1.15rem;
  font-weight: 700;
  color: #b91c1c;
  opacity: 0.82;
  margin-bottom: 12px;
  user-select: none;
}

.note-sketch-strip.is-zoomed .sketch-drawn-arrow {
  font-size: 1.4rem;
  margin-bottom: 16px;
}

@keyframes sketchStepHighlight {
  0%,
  100% {
    transform: rotate(var(--sketch-tilt, -1.5deg)) scale(1);
  }
  18% {
    transform: rotate(0deg) scale(1.09);
  }
  36% {
    transform: rotate(var(--sketch-tilt, -1.5deg)) scale(1);
  }
}

.note-golden-rule-pill {
  margin: 0;
  padding: 5px 9px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.72);
  border-left: 3px solid #dc2626;
  font-family: var(--font-handwritten);
  font-size: clamp(1.04rem, 3.7vw, 1.18rem);
  font-weight: 700;
  line-height: 1.2;
  color: #0f172a;
}

.note-short-explanation {
  margin: 0;
  font-family: var(--font-handwritten);
  font-size: clamp(1.3rem, 4vw, 1.28rem);
  font-weight: 600;
  line-height: 1.22;
  color: #292524;
}

/* RODAPÉ DA TELA */
.fullscreen-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 36px;
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

.btn-next-step,
.btn-start-challenge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 0.86rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-next-step {
  background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
  box-shadow:
    0 3px 0 #0369a1,
    0 4px 10px rgba(14, 165, 233, 0.35);
}

.btn-start-challenge {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  box-shadow:
    0 3px 0 #047857,
    0 4px 10px rgba(16, 185, 129, 0.4);
  animation: pulseGreen 1.8s infinite;
}

.btn-next-step:hover:not(:disabled),
.btn-start-challenge:hover:not(:disabled) {
  filter: brightness(1.08);
  transform: translateY(-1px);
}

.arrow-sym {
  font-size: 1rem;
  line-height: 1;
}

/* OVERLAY DE ZOOM DA NOTA */
.zoomed-note-backdrop {
  z-index: 2200;
  padding: 16px;
}

.zoomed-note-card {
  position: relative;
  width: 100%;
  max-width: 360px;
  background-color: var(--note-color, var(--folder-bg));
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.45);
  padding: 22px 18px 18px 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  animation: zoomCardFromOrigin 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.zoomed-tape {
  top: -10px;
  width: 70px;
  height: 18px;
}

.zoomed-diagram-showcase {
  display: flex;
  justify-content: center;
}

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
}

.zoomed-header {
  width: 100%;
  text-align: center;
  border-bottom: 1.5px dashed rgba(0, 0, 0, 0.15);
  padding-bottom: 6px;
}

.zoomed-title {
  font-family: var(--font-handwritten);
  font-size: 1.38rem;
  font-weight: 700;
  color: #292524;
  margin: 0;
}

.zoomed-body {
  font-family: var(--font-handwritten);
  font-size: 1.12rem;
  line-height: 1.28;
  color: #292524;
  font-weight: 600;
  text-align: center;
}

.zoomed-text {
  margin: 0;
}

/* Modal de Confirmação para Pular */
.confirm-skip-modal {
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
  background: var(--color-invalid-bg);
  border: 1px solid #fca5a5;
  border-radius: 6px;
  font-size: 0.82rem;
  font-weight: 700;
  color: #dc2626;
  cursor: pointer;
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

@keyframes zoomCardFromOrigin {
  0% {
    opacity: 0;
    transform: translate(var(--dx, 0px), var(--dy, -120px)) scale(0.25);
  }
  100% {
    opacity: 1;
    transform: translate(0, 0) scale(1);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.note-zoom-enter-active,
.note-zoom-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.24s cubic-bezier(0.16, 1, 0.3, 1);
}

.note-zoom-enter-from,
.note-zoom-leave-to {
  opacity: 0;
}
</style>
