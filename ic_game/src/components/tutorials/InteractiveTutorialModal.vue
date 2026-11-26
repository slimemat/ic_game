<script setup>
import { ref, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import AudioManager from "../../game/managers/AudioManager";
import AssistantPushBanner from "./AssistantPushBanner.vue";
import PostItSketchDiagram from "./PostItSketchDiagram.vue";
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
    showSkipDialog.value = false;
    isSubmitting.value = false;
  },
);

const windowTitle = computed(() =>
  props.tutorial?.id === "spatial_reflection"
    ? t("tutorials.desk.window_title_reflection")
    : t("tutorials.desk.window_title_rotation"),
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
    :aria-label="windowTitle"
    @mousedown.stop
    @mouseup.stop
    @click.stop
    @keydown.stop
  >
    <div class="tutorial-window os-window-chrome">
      <!-- Barra superior estilo macOS (igual Painel de Chamados e Sala de Descanso) -->
      <header class="os-window-bar">
        <div class="os-window-dots">
          <button
            type="button"
            class="os-dot os-dot--red"
            :title="$t('tutorials.unified.btn_skip')"
            :aria-label="$t('tutorials.unified.btn_skip')"
            @click.stop="showSkipDialog = true"
          ></button>
          <span class="os-dot os-dot--yellow" aria-hidden="true"></span>
          <span class="os-dot os-dot--green" aria-hidden="true"></span>
        </div>
        <div class="os-window-bar-title">{{ windowTitle }}</div>
      </header>

      <div class="tutorial-window-body">
        <!-- 1. CABEÇALHO COMPACTO DE PAPELARIA DA MALU -->
        <AssistantPushBanner
          :message="currentNotificationMessage"
          :messageKey="notificationKey"
          :counterLabel="counterLabel"
          :isError="Boolean(activeErrorTipKey)"
          :isDone="isAllStepsCompleted || Boolean(currentStepSolvedOptionId)"
        />

        <!-- 2. PASTA SANFONADA: ABAS MANILA + POST-IT DE EXPLICAÇÃO -->
        <div class="notes-folder-block">
          <div
            class="manila-tabs-row"
            role="tablist"
            :aria-label="$t('tutorials.desk.notes_tray_title')"
          >
            <button
              v-for="(note, idx) in rardiNotes"
              :key="note.id"
              type="button"
              role="tab"
              :aria-selected="idx === activeStepIndex"
              class="manila-folder-tab"
              :class="{
                'is-locked': !isNoteUnlocked(idx),
                'is-shaking': shakingNoteIndex === idx,
                'is-active': idx === activeStepIndex,
                'is-done': isNoteCompleted(idx),
                'is-next-invited':
                  canGoToNextStep && idx === activeStepIndex + 1,
                'just-completed': idx === lastCompletedNoteIndex,
              }"
              :style="{ '--note-color': note.color }"
              :title="
                !isNoteUnlocked(idx) ? $t('tutorials.desk.note_locked_tip') : ''
              "
              @click="handleNoteTabClick(note, idx, $event)"
            >
              <span class="manila-tab-label">{{ $t(note.shortTagKey) }}</span>
              <span
                v-if="isNoteCompleted(idx)"
                class="tab-status-done"
                aria-hidden="true"
              >
                ✓
              </span>
              <svg
                v-else-if="!isNoteUnlocked(idx)"
                class="tab-lock-pixel-svg"
                viewBox="0 0 12 14"
                width="11"
                height="13"
                shape-rendering="crispEdges"
                aria-hidden="true"
              >
                <path
                  fill="currentColor"
                  d="M4 1h4v1H4zM3 2h1v3H3zM8 2h1v3H8zM1 5h10v8H1z"
                />
                <path fill="#e2e8f0" d="M5 8h2v2H5zM5 10h2v1H5z" />
              </svg>
              <span v-else class="tab-status-active" aria-hidden="true">●</span>
            </button>
          </div>

          <!-- 3. POST-IT DE EXPLICAÇÃO (Alinhado ao RardiHintPostIt) -->
          <section
            v-if="currentActiveNote"
            class="rardi-postit-card"
            :style="{ '--note-color': currentActiveNote.color }"
            @click="openNoteZoom(currentActiveNote, $event)"
          >
            <div class="postit-card-layout">
              <div class="postit-diagram-col">
                <PostItSketchDiagram :concept="currentActiveNote.actionKey" />
              </div>

              <div class="postit-copy-col">
                <h4 class="note-card-title">
                  {{ $t(currentActiveNote.titleKey) }}
                </h4>
                <p
                  v-if="
                    currentActiveNote.goldenRuleKey &&
                    $t(currentActiveNote.goldenRuleKey)
                  "
                  class="note-golden-rule-tag"
                >
                  {{ $t(currentActiveNote.goldenRuleKey) }}
                </p>
                <p class="note-short-explanation">
                  {{ $t(currentActiveNote.textKey) }}
                </p>
              </div>
            </div>
          </section>
        </div>

        <!-- 4. PALCO DE PROJEÇÃO E DRAG-AND-DROP (Sandbox isolado) -->
        <SpatialProjectionArena
          v-if="currentActiveNote"
          :options="currentStepOptions"
          :actionKey="currentActiveNote.actionKey"
          :initialPlacedOptionId="currentStepSolvedOptionId"
          :sandboxMode="true"
          @option-placed="handleOptionPlaced"
          @option-removed="handleOptionRemoved"
        />

        <!-- 5. RODAPÉ DA JANELA -->
        <footer class="tutorial-window-footer">
          <button
            type="button"
            class="btn-text-skip"
            @click.stop="showSkipDialog = true"
          >
            {{ $t("tutorials.unified.btn_skip") }}
          </button>

          <transition name="fade" mode="out-in">
            <button
              v-if="canGoToNextStep"
              key="btn-next-step"
              type="button"
              class="btn-teal-tactile btn-footer-cta"
              @click.stop="goToNextStep"
            >
              <span>{{ $t("tutorials.desk.btn_next_step") }}</span>
              <span class="arrow-sym" aria-hidden="true">→</span>
            </button>

            <button
              v-else-if="isAllStepsCompleted"
              key="btn-start-challenge"
              type="button"
              class="btn-teal-tactile btn-footer-cta is-ready-pulse"
              :disabled="isSubmitting"
              @click.stop.prevent="handleStartChallenge"
            >
              <span>{{ $t("tutorials.unified.btn_start") }}</span>
              <span class="arrow-sym" aria-hidden="true">→</span>
            </button>
          </transition>
        </footer>
      </div>
    </div>

    <!-- OVERLAY DE ZOOM OPCIONAL DA NOTA DO RARDI (Reutilizando PostItSketchDiagram) -->
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

          <header class="zoomed-header">
            <h4 class="zoomed-title">{{ $t(activeZoomedNote.titleKey) }}</h4>
          </header>

          <PostItSketchDiagram
            class="zoomed-diagram"
            :concept="activeZoomedNote.actionKey"
          />

          <p
            v-if="
              activeZoomedNote.goldenRuleKey &&
              $t(activeZoomedNote.goldenRuleKey)
            "
            class="note-golden-rule-tag"
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
        <div class="confirm-box os-window-chrome">
          <header class="os-window-bar">
            <div class="os-window-dots" aria-hidden="true">
              <span class="os-dot os-dot--red"></span>
              <span class="os-dot os-dot--yellow"></span>
              <span class="os-dot os-dot--green"></span>
            </div>
            <div class="os-window-bar-title">
              {{ $t("tutorials.confirm_skip.title") }}
            </div>
          </header>
          <div class="confirm-body">
            <p class="confirm-p">{{ $t("tutorials.confirm_skip.message") }}</p>
            <div class="confirm-btns">
              <button
                type="button"
                class="btn-back-tut"
                :disabled="isSubmitting"
                @click.stop="showSkipDialog = false"
              >
                {{ $t("tutorials.confirm_skip.btn_stay") }}
              </button>
              <button
                type="button"
                class="btn-confirm-skip"
                :disabled="isSubmitting"
                @click.stop.prevent="handleConfirmSkip"
              >
                {{ $t("tutorials.confirm_skip.btn_confirm") }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.tutorial-overlay {
  z-index: 2000;
  padding: 10px;
}

.tutorial-window {
  width: 100%;
  max-width: 440px;
  max-height: 94svh;
  animation: cardSlideUp 0.26s cubic-bezier(0.16, 1, 0.3, 1);
}

.tutorial-window-body {
  padding: 10px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  overscroll-behavior: contain;
}

/* ── PASTA MANILA + POST-IT DE EXPLICAÇÃO ── */
.notes-folder-block {
  display: flex;
  flex-direction: column;
}

.manila-tabs-row {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  padding: 0 6px;
  margin-bottom: -1.5px;
  position: relative;
  z-index: 2;
}

.manila-folder-tab {
  flex: 1;
  min-width: 0;
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 6px 10px 7px;
  background-color: #e2e8f0;
  color: #475569;
  border: 1.5px solid #94a3b8;
  border-bottom: none;
  border-radius: 8px 8px 0 0;
  font-family: var(--font-mono);
  font-size: clamp(0.65rem, 2.7vw, 0.75rem);
  font-weight: 700;
  letter-spacing: 0.01em;
  line-height: 1.1;
  white-space: nowrap;
  cursor: pointer;
  transition:
    background-color 0.16s ease,
    border-color 0.16s ease,
    transform 0.16s ease;
}

.manila-tab-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.manila-folder-tab.is-active {
  background-color: var(--note-color, var(--folder-bg));
  color: #1e3a8a;
  border-color: rgba(30, 64, 175, 0.35);
  padding-top: 8px;
  box-shadow: inset 0 2px 0 rgba(255, 255, 255, 0.55);
}

.manila-folder-tab.is-done:not(.is-active) {
  background-color: #f0fdfa;
  color: #0f766e;
  border-color: #5eead4;
}

.manila-folder-tab.is-next-invited {
  background-color: #ecfdf5;
  color: #047857;
  border-color: #10b981;
  animation: tabInvitePulse 1.6s infinite;
}

.manila-folder-tab.is-locked {
  background-color: #e2e8f0;
  color: #64748b;
  border-color: #94a3b8;
  opacity: 0.78;
  cursor: not-allowed;
}

.manila-folder-tab.is-shaking {
  animation: lockShake 0.45s ease-in-out !important;
}

.tab-status-done {
  flex-shrink: 0;
  font-size: 0.78rem;
  font-weight: 900;
  color: #0f766e;
}

.just-completed .tab-status-done {
  animation: stampPop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.tab-lock-pixel-svg {
  flex-shrink: 0;
  color: #64748b;
  image-rendering: pixelated;
}

.tab-status-active {
  flex-shrink: 0;
  font-size: 0.6rem;
  color: #1e40af;
}

/* Post-it quadrado / retangular limpo (alinhado ao RardiHintPostIt) */
.rardi-postit-card {
  position: relative;
  z-index: 1;
  background-color: var(--note-color, var(--folder-bg));
  background-image: linear-gradient(
    170deg,
    rgba(255, 255, 255, 0.44) 0%,
    rgba(15, 23, 42, 0.04) 100%
  );
  border-radius: 4px;
  border: 1.5px solid rgba(30, 64, 175, 0.24);
  box-shadow:
    0 5px 12px rgba(15, 23, 42, 0.14),
    0 2px 4px rgba(15, 23, 42, 0.08),
    inset 0 -8px 14px rgba(0, 0, 0, 0.04);
  padding: 10px 12px;
  cursor: pointer;
}

.postit-card-layout {
  display: flex;
  align-items: center;
  gap: 10px;
}

.postit-diagram-col {
  flex: 0 0 clamp(114px, 34%, 138px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.postit-copy-col {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.note-card-title {
  margin: 0;
  font-family: var(--font-handwritten);
  font-size: clamp(1.18rem, 4.3vw, 1.38rem);
  font-weight: 700;
  line-height: 1.05;
  color: #1e40af;
}

.note-golden-rule-tag {
  margin: 0;
  padding: 3px 7px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.65);
  border-left: 2.5px solid #1e40af;
  font-family: var(--font-handwritten);
  font-size: clamp(0.95rem, 3.2vw, 1.06rem);
  font-weight: 700;
  line-height: 1.15;
  color: #1e3a8a;
}

.note-short-explanation {
  margin: 0;
  font-family: var(--font-handwritten);
  font-size: clamp(1.06rem, 3.6vw, 1.2rem);
  font-weight: 700;
  line-height: 1.16;
  color: #1e40af;
}

/* ── RODAPÉ DA JANELA ── */
.tutorial-window-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 44px;
  padding-top: 4px;
  border-top: 1px solid #e2e8f0;
}

.btn-text-skip {
  background: none;
  border: none;
  font-family: var(--font-mono);
  font-size: 0.74rem;
  font-weight: 600;
  color: #64748b;
  text-decoration: underline;
  cursor: pointer;
  padding: 6px 4px;
}

.btn-text-skip:hover {
  color: #334155;
}

.btn-footer-cta {
  min-height: 40px;
  padding: 7px 15px;
  font-size: 0.88rem;
}

.btn-footer-cta.is-ready-pulse {
  animation: ctaReadyPulse 1.8s infinite;
}

.arrow-sym {
  font-size: 0.96rem;
  line-height: 1;
}

/* ── OVERLAY DE ZOOM DA NOTA ── */
.zoomed-note-backdrop {
  z-index: 2200;
  padding: 16px;
}

.zoomed-note-card {
  position: relative;
  width: 100%;
  max-width: 340px;
  background-color: var(--note-color, var(--folder-bg));
  background-image: linear-gradient(
    170deg,
    rgba(255, 255, 255, 0.42) 0%,
    rgba(0, 0, 0, 0.04) 100%
  );
  border-radius: 4px;
  border: 1.5px solid rgba(30, 64, 175, 0.2);
  box-shadow:
    0 22px 44px rgba(0, 0, 0, 0.48),
    0 4px 10px rgba(0, 0, 0, 0.25);
  padding: 20px 18px 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  animation: zoomCardFromOrigin 0.26s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.zoomed-diagram {
  max-width: 210px;
}

.btn-floating-close-note {
  position: absolute;
  top: -12px;
  right: -12px;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #0f172a;
  color: #f8fafc;
  border: 2px solid #ffffff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
  font-size: 0.92rem;
  font-weight: 800;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.zoomed-header {
  width: 100%;
  text-align: center;
  border-bottom: 1px dashed rgba(30, 64, 175, 0.25);
  padding-bottom: 6px;
}

.zoomed-title {
  font-family: var(--font-handwritten);
  font-size: 1.38rem;
  font-weight: 700;
  color: #1e40af;
  margin: 0;
}

.zoomed-body {
  font-family: var(--font-handwritten);
  font-size: 1.2rem;
  line-height: 1.24;
  color: #1e40af;
  font-weight: 700;
  text-align: center;
}

.zoomed-text {
  margin: 0;
}

/* ── MODAL DE CONFIRMAÇÃO PARA PULAR ── */
.confirm-skip-modal {
  padding: 16px;
  z-index: 2300;
}

.confirm-box {
  max-width: 340px;
  width: 100%;
}

.confirm-body {
  padding: 16px 18px;
  text-align: center;
}

.confirm-p {
  font-size: 0.84rem;
  color: #334155;
  margin: 0 0 14px 0;
  line-height: 1.4;
}

.confirm-btns {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.btn-back-tut {
  flex: 1;
  padding: 8px 12px;
  background: #e2e8f0;
  border: 1.5px solid #94a3b8;
  border-radius: 6px;
  font-size: 0.82rem;
  font-weight: 700;
  color: #1e293b;
  cursor: pointer;
}

.btn-confirm-skip {
  flex: 1;
  padding: 8px 12px;
  background: var(--color-invalid-bg);
  border: 1.5px solid #fca5a5;
  border-radius: 6px;
  font-size: 0.82rem;
  font-weight: 700;
  color: #b91c1c;
  cursor: pointer;
}

@keyframes tabInvitePulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.35);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(16, 185, 129, 0);
  }
}

@keyframes ctaReadyPulse {
  0%,
  100% {
    box-shadow:
      0 4px 0 #0f766e,
      0 0 0 0 rgba(20, 184, 166, 0.5);
  }
  50% {
    box-shadow:
      0 4px 0 #0f766e,
      0 0 0 7px rgba(20, 184, 166, 0);
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

@media (max-width: 390px) {
  .tutorial-window-body {
    padding: 8px 10px 10px;
    gap: 8px;
  }
  .postit-diagram-col {
    flex: 0 0 104px;
  }
  .rardi-postit-card {
    padding: 8px 10px;
  }
}
</style>
