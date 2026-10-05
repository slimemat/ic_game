<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import { scenes } from "../data/dialogues";
import { characters } from "../data/characters";
import PauseModal from "./ui/PauseModal.vue";

/**
 * StoryMode: tela de diálogo estilo chat, genérica e reutilizável.
 * Usada na abertura do Modo História e em briefings antes de desafios.
 *
 * Props:
 *   sceneId – id da cena em src/data/dialogues/index.js
 *
 * Eventos:
 *   finished – a cena chegou ao fim (next: null)
 *   quit     – o jogador escolheu sair pelo menu de pausa
 *
 * O componente não sabe o que vem depois: quem decide é o pai.
 */
const props = defineProps({
  sceneId: { type: String, required: true },
});
const emit = defineEmits(["finished", "quit"]);

const { t } = useI18n();

const isPaused = ref(false);
const chatContainer = ref(null);
const chatLog = ref([]);

const scene = computed(() => scenes[props.sceneId]);
const i18nKey = (id) => `story.scenes.${props.sceneId}.${id}`;

const storyVariables = computed(() => ({
  assistantName: t("story.variables.assistantName"),
  managerName: t("story.variables.managerName"),
  companyName: t("story.variables.companyName"),
}));

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

function processNode(nodeId) {
  // next: null → fim da cena
  if (nodeId === null || nodeId === undefined) {
    currentNodeId.value = null;
    emit("finished");
    return;
  }

  currentNodeId.value = nodeId;
  const node = scene.value.nodes[nodeId];

  isTyping.value = true;
  typingChar.value = node.speaker;
  typingName.value = t(
    `story.characters.${node.speaker}`,
    storyVariables.value,
  );

  scrollToBottom();

  typingTimeout = setTimeout(() => {
    commitMessage(nodeId);
  }, 1500);
}

function commitMessage(nodeId) {
  if (!isTyping.value) return;

  clearTimeout(typingTimeout);
  isTyping.value = false;

  const node = scene.value.nodes[nodeId];

  chatLog.value.push({
    id: Date.now() + Math.random(),
    isPlayer: false,
    char: node.speaker,
    emotion: node.emotion,
    name: typingName.value,
    text: t(i18nKey(nodeId), storyVariables.value),
  });

  scrollToBottom();
}

function skipTyping() {
  if (isTyping.value && currentNodeId.value) {
    commitMessage(currentNodeId.value);
  }
}

function handleChoice(choice) {
  chatLog.value.push({
    id: Date.now() + Math.random(),
    isPlayer: true,
    text: t(i18nKey(choice.id), storyVariables.value),
  });

  currentNodeId.value = null;
  scrollToBottom();

  choiceTimeout = setTimeout(() => {
    processNode(choice.next);
  }, 500);
}

function handleNext() {
  if (!isTyping.value) {
    processNode(currentDialogue.value?.next ?? null);
  }
}

onMounted(() => {
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
});
</script>

<template>
  <div class="story-mode-container">
    <button class="btn-pause" @click="isPaused = true">
      {{ $t("global.buttons.pause") }}
    </button>

    <PauseModal
      :isOpen="isPaused"
      @resume="isPaused = false"
      @quit="
        isPaused = false;
        emit('quit');
      "
      :showRestart="false"
    />

    <div class="chat-history" ref="chatContainer" @click="skipTyping">
      <div v-if="scene?.systemMessage" class="system-message">
        {{ $t(i18nKey("_system")) }}
      </div>

      <div
        v-for="msg in chatLog"
        :key="msg.id"
        class="message-row anim-fade-in"
        :class="msg.isPlayer ? 'player-row' : 'npc-row'"
      >
        <template v-if="!msg.isPlayer">
          <div
            class="message-bubble notebook-paper npc-bubble"
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
            <div class="text-content">{{ msg.text }}</div>
          </div>
        </template>

        <template v-else>
          <div class="message-bubble notebook-paper player-bubble">
            <div class="text-content">{{ msg.text }}</div>
          </div>
        </template>
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

    <!-- ÁREA DE INPUT / OPÇÕES -->
    <div class="reply-area" v-if="currentDialogue && !isTyping">
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
.story-mode-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #d1c0a8;
  position: relative;
  overflow: hidden;
  font-family: "consolas", "Courier New", monospace;
}

.btn-pause {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background-color: #fff;
  color: #333;
  border: 2px solid #aaa;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  z-index: 100;
  font-weight: bold;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
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

.system-message {
  text-align: center;
  font-size: 0.85rem;
  color: #666;
  background: rgba(255, 255, 255, 0.4);
  padding: 4px 12px;
  border-radius: 12px;
  align-self: center;
  margin-bottom: 1rem;
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
