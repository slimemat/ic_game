<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import { scenes } from "../data/dialogues";
import { STORY_STAGES } from "../game/data/progressionConfig";
import { characters } from "../data/characters";
import { useGameSessionStore } from "../stores/gameSession";
import { useStoryStore } from "../stores/story";
import { useChatEffects } from "../composables/useChatEffects";
import AudioManager from "../game/managers/AudioManager";
import PauseModal from "./ui/PauseModal.vue";
import PauseButton from "./ui/PauseButton.vue";
import ChatHeader from "./story/ChatHeader.vue";
import ChatSystemNotice from "./story/ChatSystemNotice.vue";
import StickyNotesCarousel from "./story/StickyNotesCarousel.vue";
import spritepaintImg from "../assets/images/spritepaint.png";

/**
 * StoryMode: tela de diálogo estilo chat, genérica e reutilizável.
 * Usada na abertura do Modo História e em briefings antes de desafios.
 *
 * Props:
 *   sceneId     – id da cena em src/data/dialogues/index.js
 *   interactive – false = só pano de fundo (sem reproduzir a cena nem pausa);
 *                 usado quando o Painel de Chamados é restaurado de um save
 *
 * Eventos:
 *   finished – a cena chegou ao fim (next: null)
 *   quit     – o jogador escolheu sair pelo menu de pausa
 *
 * O componente não sabe o que vem depois: quem decide é o pai.
 * Cada tipo de nó (message | presence | notes) tem seu próprio handler;
 * o esquema dos nós está documentado em src/data/dialogues/index.js.
 */
const props = defineProps({
  sceneId: { type: String, required: true },
  interactive: { type: Boolean, default: true },
});
const emit = defineEmits(["finished", "quit"]);

const PRESENCE_DELAY_MS = 900;
const TYPING_DELAY_MS = 1500;
const CHOICE_DELAY_MS = 500;

const { t, tm, locale } = useI18n();
const session = useGameSessionStore();
const story = useStoryStore();
const {
  isShaking,
  apply: applyEffects,
  stopAll: stopEffects,
} = useChatEffects();

const chatContainer = ref(null);
const chatLog = ref([]);

const scene = computed(() => scenes[props.sceneId]);
const i18nKey = (id) => `story.scenes.${props.sceneId}.${id}`;

// Todas as chaves de story.variables viram variáveis de interpolação
// automaticamente: para criar uma nova, basta adicioná-la no pt-BR.json.
const storyVariables = computed(() => {
  const vars = Object.fromEntries(
    Object.keys(tm("story.variables")).map((key) => [
      key,
      t(`story.variables.${key}`),
    ]),
  );
  // Nome do estagiário; se ainda não foi definido, usa o nome da empresa
  vars.playerName = session.playerName || vars.companyName;
  return vars;
});

const charName = (char) => t(`story.characters.${char}`, storyVariables.value);

const currentNodeId = ref(null);
const currentDialogue = computed(() =>
  currentNodeId.value && scene.value
    ? scene.value.nodes[currentNodeId.value]
    : null,
);

const isTyping = ref(false);
const typingChar = ref("");
const typingName = ref("");
let typingTimeout = null;
let choiceTimeout = null;
let presenceTimeout = null;
let transitionTimeout = null;
let clearChatTimeout = null;
const isFading = ref(false);
const transitionText = ref("");

const isPlaceholder = computed(
  () => currentDialogue.value?.type === "placeholder",
);

const currentStageNumber = computed(() => {
  const stage =
    STORY_STAGES.find(
      (s) =>
        s.introCutsceneId === props.sceneId ||
        s.postStageCutsceneId === props.sceneId,
    ) || story.currentStage;
  return stage?.stageNumber || 2;
});

// ── Header de grupo (chamado atual + participantes derivados da cena) ─────
const headerInfo = computed(() => {
  if (!scene.value?.header) return null;

  const stage =
    STORY_STAGES.find((s) => s.postStageCutsceneId === props.sceneId) ||
    story.currentStage;
  const participantIds = [
    ...new Set(
      Object.values(scene.value.nodes)
        .map((node) => node.speaker ?? node.char)
        .filter(Boolean),
    ),
  ];
  const names = [
    ...participantIds.map(charName),
    t("story.chat.participants_you"),
  ];

  return {
    eyebrow: t("story.dashboard.ticket_eyebrow", {
      num: stage?.stageNumber || 1,
    }),
    title: stage?.titleKey ? t(stage.titleKey) : charName("assistant"),
    participants: new Intl.ListFormat(locale.value, {
      style: "long",
      type: "conjunction",
    }).format(names),
  };
});

// ── Sprites (com fallback para <personagem>_neutral.png) ──────────────────
const sprites = import.meta.glob("../assets/sprites/*.png", {
  eager: true,
  import: "default",
});

function getSpriteUrl(char, emotion) {
  return (
    sprites[`../assets/sprites/${char}_${emotion || "neutral"}.png`] ??
    sprites[`../assets/sprites/${char}_neutral.png`]
  );
}

// ── Cor do personagem via CSS variable ────────────────────────────────────
function charStyle(char) {
  return { "--char-color": characters[char]?.color ?? "#555" };
}

function scrollToBottom() {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    }
  });
}

function pushLog(entry) {
  chatLog.value.push({ id: Date.now() + Math.random(), ...entry });
  scrollToBottom();
}

// ── Handlers por tipo de nó ───────────────────────────────────────────────

/** Fala de personagem: mostra "digitando..." e depois a mensagem. */
function playMessage(node, nodeId) {
  isTyping.value = true;
  typingChar.value = node.speaker;
  typingName.value = charName(node.speaker);

  scrollToBottom();

  // Inicia som da máquina de escrever em loop
  AudioManager.play("keyboard_sfx", { loop: true, volume: 0.5 });

  typingTimeout = setTimeout(() => {
    commitMessage(nodeId);
  }, TYPING_DELAY_MS);
}

/** Aviso centralizado "<nome> entrou/saiu do chat"; avança sozinho. */
function playPresence(node) {
  // Ao entrar/sair alguém, efeitos pendentes (ex.: telefone tocando) param
  stopEffects();

  const messageKey = node.action === "leave" ? "left" : "joined";
  pushLog({
    kind: "presence",
    variant: node.action === "leave" ? "leave" : "join",
    text: t(`story.chat.${messageKey}`, { name: charName(node.char) }),
  });

  presenceTimeout = setTimeout(() => {
    processNode(node.next);
  }, PRESENCE_DELAY_MS);
}

/** Carrossel de post-its; o jogador segue pelo botão Continuar. */
function playNotes(node) {
  AudioManager.play("message_neutral", { volume: 1.0 });
  pushLog({
    kind: "notes",
    title: t("story.chat.notes_title", storyVariables.value),
    notes: node.notes.map((noteId) =>
      t(i18nKey(`notes.${noteId}`), storyVariables.value),
    ),
  });
}

function playBranch(node) {
  const nextNodeId = node.branch({
    stars: story.lastStageStars,
    story,
  });
  processNode(nextNodeId);
}

function playTransition(node) {
  transitionText.value = node.overlayTextKey
    ? t(node.overlayTextKey, storyVariables.value)
    : "";
  isFading.value = true;
  applyEffects(node.effects);

  if (node.clearChat) {
    clearChatTimeout = setTimeout(() => {
      chatLog.value = [];
    }, 450);
  }

  const duration = node.duration || 1600;
  transitionTimeout = setTimeout(() => {
    isFading.value = false;
    transitionText.value = "";
    processNode(node.next);
  }, duration);
}

function playPlaceholder(node) {
  isTyping.value = false;
  scrollToBottom();
}

const nodeHandlers = {
  message: playMessage,
  presence: playPresence,
  branch: playBranch,
  transition: playTransition,
  placeholder: playPlaceholder,
  notes: playNotes,
};

function processNode(nodeId) {
  // next: null → fim da cena
  if (nodeId === null || nodeId === undefined) {
    currentNodeId.value = null;
    emit("finished");
    return;
  }

  currentNodeId.value = nodeId;
  const node = scene.value.nodes[nodeId];
  const handler = nodeHandlers[node.type ?? "message"];

  if (!handler) {
    console.warn(`[StoryMode] Tipo de nó "${node.type}" desconhecido.`);
    processNode(node.next ?? null);
    return;
  }
  handler(node, nodeId);
}

function commitMessage(nodeId) {
  if (!isTyping.value) return;

  clearTimeout(typingTimeout);
  isTyping.value = false;

  // Interrompe o typing e toca a notificação
  AudioManager.stop("keyboard_sfx");
  AudioManager.play("message_neutral", { volume: 1.0 });

  const node = scene.value.nodes[nodeId];

  pushLog({
    kind: "npc",
    char: node.speaker,
    emotion: node.emotion,
    name: typingName.value,
    forwarded: Boolean(node.forwarded),
    text: t(i18nKey(nodeId), storyVariables.value),
  });

  // Efeitos de cena declarados no nó (som, tremida, vibração)
  applyEffects(node.effects);
}

function skipTyping() {
  if (isTyping.value && currentNodeId.value) {
    commitMessage(currentNodeId.value);
  }
}

function handleChoice(choice) {
  AudioManager.play("reply_sfx", { volume: 1.0 });
  choice.onSelect?.({ story });

  pushLog({
    kind: "player",
    text: t(i18nKey(choice.id), storyVariables.value),
  });

  currentNodeId.value = null;

  choiceTimeout = setTimeout(() => {
    processNode(choice.next);
  }, CHOICE_DELAY_MS);
}

function handleNext() {
  if (!isTyping.value) {
    processNode(currentDialogue.value?.next ?? null);
  }
}

// Nós de presença avançam sozinhos: não exibem botões
const showReplyArea = computed(
  () =>
    currentDialogue.value &&
    !isTyping.value &&
    currentDialogue.value.type !== "presence" &&
    currentDialogue.value.type !== "branch" &&
    currentDialogue.value.type !== "transition" &&
    currentDialogue.value.type !== "placeholder",
);

onMounted(() => {
  if (!props.interactive) return;
  story.setPaused(false);

  if (!scene.value) {
    console.warn(`[StoryMode] Cena "${props.sceneId}" não encontrada.`);
    emit("finished");
    return;
  }
  processNode(scene.value.start);
});

// Evita timers órfãos se o jogador sair no meio da cena
onUnmounted(() => {
  clearTimeout(typingTimeout);
  clearTimeout(choiceTimeout);
  clearTimeout(presenceTimeout);
  clearTimeout(transitionTimeout);
  clearTimeout(clearChatTimeout);
  AudioManager.stop("keyboard_sfx");
  stopEffects();
});
</script>

<template>
  <div class="story-mode-container" :class="{ 'anim-screen-shake': isShaking }">
    <template v-if="interactive">
      <PauseButton class="pause-btn-fixed" @click="story.setPaused(true)" />

      <PauseModal
        :isOpen="story.isPaused"
        @resume="story.setPaused(false)"
        @quit="
          story.setPaused(false);
          emit('quit');
        "
        :showRestart="false"
      />
    </template>

    <ChatHeader
      v-if="interactive && headerInfo"
      :eyebrow="headerInfo.eyebrow"
      :title="headerInfo.title"
      :participants="headerInfo.participants"
    />

    <div
      class="chat-history"
      :class="{ 'has-header': interactive && headerInfo }"
      ref="chatContainer"
      @click="skipTyping"
    >
      <ChatSystemNotice v-if="scene?.systemMessage" class="system-intro">
        {{ $t(i18nKey("_system")) }}
      </ChatSystemNotice>

      <template v-for="msg in chatLog" :key="msg.id">
        <!-- Aviso de presença (entrou / saiu do chat) -->
        <ChatSystemNotice
          v-if="msg.kind === 'presence'"
          :variant="msg.variant"
          class="anim-fade-in"
        >
          {{ msg.text }}
        </ChatSystemNotice>

        <!-- Post-its -->
        <div v-else-if="msg.kind === 'notes'" class="anim-slide-up notes-row">
          <StickyNotesCarousel :title="msg.title" :notes="msg.notes" />
        </div>

        <!-- Mensagens -->
        <div
          v-else
          class="message-row anim-fade-in"
          :class="msg.kind === 'player' ? 'player-row' : 'npc-row'"
        >
          <template v-if="msg.kind === 'npc'">
            <div
              class="message-bubble notebook-paper npc-bubble"
              :class="{ 'is-forwarded': msg.forwarded }"
              :style="charStyle(msg.char)"
            >
              <div class="avatar-container anim-bounce">
                <img
                  :src="getSpriteUrl(msg.char, msg.emotion)"
                  class="avatar-icon"
                  :alt="msg.char"
                />
              </div>

              <span class="sender-name">{{ msg.name }}</span>
              <span v-if="msg.forwarded" class="forwarded-label">
                ↪ {{ $t("story.chat.forwarded") }}
              </span>
              <div class="text-content">{{ msg.text }}</div>
            </div>
          </template>

          <template v-else>
            <div class="message-bubble notebook-paper player-bubble">
              <div class="text-content">{{ msg.text }}</div>
            </div>
          </template>
        </div>
      </template>

      <!-- Card Placeholder de Fase em Desenvolvimento -->
      <div v-if="isPlaceholder" class="placeholder-stage-wrap anim-slide-up">
        <div class="placeholder-card notebook-paper">
          <div class="placeholder-badge">
            {{
              $t("story.chat.placeholder_title", { stage: currentStageNumber })
            }}
          </div>
          <div class="placeholder-img-wrap">
            <img
              :src="spritepaintImg"
              alt="Placeholder"
              class="placeholder-sprite"
            />
          </div>
          <p class="placeholder-desc">
            {{ $t("story.chat.placeholder_desc") }}
          </p>
          <button
            class="reply-btn notebook-paper btn-continue"
            @click="handleNext"
          >
            {{ $t("story.chat.placeholder_btn") }} ➔
          </button>
        </div>
      </div>

      <!-- Indicador de Digitação -->
      <div v-if="isTyping" class="message-row npc-row anim-fade-in">
        <div
          class="message-bubble notebook-paper npc-bubble"
          :style="charStyle(typingChar)"
        >
          <span class="sender-name">{{ typingName }}</span>

          <div class="typing-indicator">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>
    </div>

    <!-- OVERLAY DE TRANSIÇÃO (FADE OUT) -->
    <div class="screen-fade-overlay" :class="{ 'is-faded': isFading }">
      <span v-if="transitionText" class="transition-title anim-title-pop">
        {{ transitionText }}
      </span>
    </div>

    <!-- ÁREA DE INPUT / OPÇÕES -->
    <div class="reply-area" v-if="showReplyArea">
      <template v-if="currentDialogue.choices">
        <button
          v-for="choice in currentDialogue.choices"
          :key="choice.id"
          class="reply-btn notebook-paper anim-slide-up"
          @click="handleChoice(choice)"
        >
          {{ $t(i18nKey(choice.id), storyVariables) }}
        </button>
      </template>
      <template v-else>
        <button
          class="reply-btn notebook-paper btn-continue anim-slide-up"
          @click="handleNext"
        >
          {{ $t("global.buttons.continue") }} ➔
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.screen-fade-overlay {
  position: absolute;
  inset: 0;
  background-color: #000;
  opacity: 0;
  pointer-events: none;
  z-index: 120;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.5s ease-in-out;
}

.transition-title {
  color: #fef08a;
  font-size: clamp(2rem, 8vw, 3.2rem);
  font-weight: 900;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  text-shadow: 0 4px 16px rgba(0, 0, 0, 0.8);
  font-family: var(--font-main);
}

.anim-title-pop {
  animation: title-pop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes title-pop {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.placeholder-stage-wrap {
  width: 100%;
  display: flex;
  justify-content: center;
  margin: auto 0;
  padding: 1rem 0;
}

.placeholder-card {
  width: 90%;
  max-width: 380px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1.5rem;
  border-radius: 8px;
  gap: 1rem;
}

.placeholder-badge {
  font-weight: bold;
  font-size: 1.1rem;
  color: #2b6cb0;
  letter-spacing: 0.05em;
}

.placeholder-img-wrap {
  width: 96px;
  height: 96px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
}

.placeholder-sprite {
  width: 100%;
  height: 100%;
  object-fit: contain;
  image-rendering: pixelated;
}

.placeholder-desc {
  font-size: 0.95rem;
  color: #555;
  margin: 0;
  line-height: 1.4;
}

.screen-fade-overlay.is-faded {
  opacity: 1;
  pointer-events: auto;
}

.story-mode-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #d1c0a8;
  position: relative;
  overflow: hidden;
  font-family: "consolas", "Courier New", monospace;
}

.pause-btn-fixed {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 100;
}

.chat-history {
  flex-grow: 1;
  padding: 5rem 1rem 1rem 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  scroll-behavior: smooth;
}

/* Com header, o espaço do botão de pausa já está reservado nele */
.chat-history.has-header {
  padding-top: 1.5rem;
}

.system-intro {
  margin-bottom: 1rem;
}

.notes-row {
  display: flex;
  justify-content: center;
  width: 100%;
}

.message-row {
  display: flex;
  width: 100%;
  align-items: flex-end;
}
.npc-row {
  justify-content: flex-start;
}
.player-row {
  justify-content: flex-end;
}

/* ── AVATAR FLUTUANTE SOBREPOSTO ── */
.avatar-container {
  float: left;
  width: 65px;
  height: 65px;
  margin-top: -15px;
  margin-left: -25px;
  margin-right: 15px;
  margin-bottom: 5px;
  background-color: #fff;
  border-radius: 8px;
  border: 2px solid #ccc;
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

/* ── BALÕES DE TEXTO ── */
.notebook-paper {
  background-color: #fcfcfc;
  background-image: linear-gradient(
    transparent,
    transparent 27px,
    rgba(200, 200, 200, 0.4) 27px,
    rgba(200, 200, 200, 0.4) 28px
  );
  background-size: 100% 28px;
  border-left: 3px solid rgba(200, 200, 200, 0.5);
  border-radius: 6px;
  box-shadow: 2px 4px 10px rgba(0, 0, 0, 0.1);
  color: #333;
}

.message-bubble {
  max-width: 90%;
  padding: 10px 15px;
  line-height: 28px;
  font-size: 1.1rem;
  text-align: left;
}

.message-bubble::after {
  content: "";
  display: table;
  clear: both;
}

/* A cor do personagem chega pela CSS variable --char-color (via :style) */
.npc-bubble {
  margin-left: 20px;
  border-bottom-left-radius: 0;
  border-left-color: var(--char-color, #888);
}

.player-bubble {
  border-bottom-right-radius: 0;
  background-color: #f0f7f0;
  border-left: 3px solid rgba(80, 200, 80, 0.6);
}

/* Mensagem encaminhada (relida/citada por outro personagem) */
.is-forwarded {
  background-color: #f7f4ee;
  border-left-style: dashed;
}

.forwarded-label {
  display: block;
  font-size: 0.75rem;
  font-style: italic;
  line-height: 1.4;
  color: #888;
}

/* ── NOMES ── */
.sender-name {
  font-weight: 900;
  font-size: 0.9rem;
  display: block;
  margin-bottom: 2px;
  line-height: 1.2;
  color: var(--char-color, #555);
}

.text-content {
  font-family: "consolas", "Courier New", monospace;
  display: block;
}

/* ── INDICADOR DE DIGITAÇÃO ── */
.typing-indicator {
  display: flex;
  gap: 6px;
  align-items: center;
  height: 28px;
  padding: 0 5px;
}
.typing-indicator span {
  width: 8px;
  height: 8px;
  background-color: currentColor;
  border-radius: 50%;
  animation: typing-bounce 1.4s infinite ease-in-out both;
  opacity: 0.6;
}
.typing-indicator span:nth-child(1) {
  animation-delay: -0.32s;
}
.typing-indicator span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes typing-bounce {
  0%,
  80%,
  100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

/* ── ÁREA DE ESCOLHAS ── */
.reply-area {
  padding: 1rem;
  background: rgba(0, 0, 0, 0.05);
  border-top: 1px dashed rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.reply-btn {
  width: 100%;
  text-align: left;
  padding: 15px 20px;
  cursor: pointer;
  border-top: none;
  border-right: none;
  border-bottom: none;
  font-size: 1.1rem;
  font-family: inherit;
  transition: transform 0.2s;
}
.reply-btn:hover {
  transform: translateY(-2px);
  box-shadow: 2px 6px 12px rgba(0, 0, 0, 0.15);
}

.btn-continue {
  text-align: center;
  font-weight: bold;
  color: #2b6cb0;
  border-left-color: #2b6cb0;
}

/* ── ANIMAÇÕES ── */
.anim-fade-in {
  animation: fade-in 0.3s ease-out;
}
.anim-slide-up {
  animation: slide-up 0.4s ease-out;
}
.anim-bounce {
  animation: pop-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

/* Tremida horizontal da tela (ex.: telefone tocando) */
.anim-screen-shake {
  animation: screen-shake 0.45s ease-in-out;
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
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
@keyframes screen-shake {
  0%,
  100% {
    transform: translateX(0);
  }
  15%,
  55% {
    transform: translateX(-6px);
  }
  35%,
  75% {
    transform: translateX(6px);
  }
  90% {
    transform: translateX(-2px);
  }
}

@media (max-width: 600px) {
  .message-bubble {
    max-width: 95%;
    font-size: 1rem;
  }
  .avatar-container {
    width: 55px;
    height: 55px;
    margin-left: -20px;
  }
  .npc-bubble {
    margin-left: 15px;
  }
}
</style>
