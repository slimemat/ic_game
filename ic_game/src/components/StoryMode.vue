<script setup>
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import { useGameSessionStore } from "../stores/gameSession";
import PauseModal from "./ui/PauseModal.vue";

const { t } = useI18n();
const session = useGameSessionStore();

const isPaused = ref(false);

const storyVariables = computed(() => ({
  assistantName: t("story.variables.assistantName"),
  managerName: t("story.variables.managerName"),
  companyName: t("story.variables.companyName"),
}));

// O fluxo de cena agora descreve exatamente quem está em tela (activeCharacters)
// e quem é o orador atual (speaker).
const sceneFlow = {
  intro: {
    speaker: "assistant",
    activeCharacters: [
      { char: "assistant", emotion: "neutral", position: "right" },
    ],
    choices: [
      { id: "choiceA", next: "replyA" },
      { id: "choiceB", next: "replyB" },
    ],
  },
  replyA: {
    speaker: "assistant",
    activeCharacters: [
      { char: "assistant", emotion: "explaining", position: "right" },
    ],
    next: "call_manager",
  },
  replyB: {
    speaker: "assistant",
    activeCharacters: [
      { char: "assistant", emotion: "explaining", position: "right" },
    ],
    next: "call_manager",
  },
  call_manager: {
    speaker: "assistant",
    activeCharacters: [
      { char: "assistant", emotion: "neutral", position: "right" },
    ],
    next: "manager_enters",
  },
  manager_enters: {
    speaker: "manager",
    activeCharacters: [
      { char: "assistant", emotion: "neutral", position: "right" },
      { char: "manager", emotion: "explaining", position: "left" },
    ],
    next: "manager_explains",
  },
  manager_explains: {
    speaker: "manager",
    activeCharacters: [
      { char: "assistant", emotion: "neutral", position: "right" },
      { char: "manager", emotion: "neutral", position: "left" },
    ],
    next: "assistant_finish",
  },
  assistant_finish: {
    speaker: "assistant",
    activeCharacters: [
      { char: "assistant", emotion: "explaining", position: "right" },
      { char: "manager", emotion: "neutral", position: "left" },
    ],
    next: "end_scene",
  },
};

const currentNodeId = ref("intro");
const currentDialogue = computed(() => sceneFlow[currentNodeId.value]);

// Resolve o caminho dinâmico da imagem
function getSpriteUrl(char, emotion) {
  return new URL(
    `../assets/sprites/${char}_${emotion || "neutral"}.png`,
    import.meta.url,
  ).href;
}

function advance(nextNodeId) {
  if (nextNodeId === "end_scene") {
    session.setActiveMode("story-dashboard");
  } else {
    currentNodeId.value = nextNodeId;
  }
}

function quitStory() {
  isPaused.value = false;
  session.setActiveMode("menu");
}
</script>

<template>
  <div class="story-mode-container">
    <button class="btn-pause" @click="isPaused = true">
      {{ $t("global.buttons.pause") }}
    </button>

    <PauseModal
      :isOpen="isPaused"
      @resume="isPaused = false"
      @quit="quitStory"
      :showRestart="false"
    />

    <!-- Área Visual: Espaço onde os personagens ficam em pé -->
    <div class="visual-area">
      <div
        v-for="actor in currentDialogue.activeCharacters"
        :key="actor.char"
        class="character-container"
        :class="[
          `pos-${actor.position}`,
          { 'is-speaking': currentDialogue.speaker === actor.char },
        ]"
      >
        <!-- O uso do :key reativo recria a div toda vez que o orador muda a fala, engatilhando a animação CSS pop-bounce -->
        <div
          class="sprite-wrapper"
          :class="{ 'anim-bounce': currentDialogue.speaker === actor.char }"
          :key="currentDialogue.speaker === actor.char ? currentNodeId : 'idle'"
        >
          <img
            :src="getSpriteUrl(actor.char, actor.emotion)"
            :alt="actor.char"
            class="character-sprite"
          />
        </div>
      </div>
    </div>

    <!-- Caixa de Diálogo Fixa no Estilo Visual Novel -->
    <div
      class="dialogue-box"
      :class="`speaker-border-${currentDialogue.speaker}`"
    >
      <div class="dialogue-header">
        <span
          class="character-name"
          :class="`color-${currentDialogue.speaker}`"
        >
          {{
            $t("story.characters." + currentDialogue.speaker, storyVariables)
          }}
        </span>
      </div>

      <div class="dialogue-text">
        {{ $t("story.scene1." + currentNodeId, storyVariables) }}
      </div>

      <div class="dialogue-actions">
        <template v-if="currentDialogue.choices">
          <button
            v-for="choice in currentDialogue.choices"
            :key="choice.id"
            class="btn-choice"
            @click="advance(choice.next)"
          >
            {{ $t("story.scene1." + choice.id, storyVariables) }}
          </button>
        </template>
        <template v-else>
          <!-- Botão genérico de prosseguir, pode até cobrir a tela inteira se desejar como no Ren'Py, mas por ora usamos um botão claro -->
          <button class="btn-primary" @click="advance(currentDialogue.next)">
            {{ $t("global.buttons.continue") }} ➔
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.story-mode-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #1a1a2e; /* Fundo do cenário - pode colocar uma imagem aqui depois */
  color: #fff;
  position: relative;
  overflow: hidden;
}

.btn-pause {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background-color: #0f0f1a;
  color: white;
  border: 2px solid #555;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  z-index: 100;
  font-weight: bold;
}
.btn-pause:hover {
  background-color: #333;
}

/* ── LAYOUT DOS PERSONAGENS EM TELA ── */
.visual-area {
  flex-grow: 1; /* Ocupa toda a tela sobrando acima da caixa de diálogo */
  position: relative;
}

.character-container {
  position: absolute;
  bottom: 0; /* Cola os personagens exatamente na linha superior da caixa de texto */
  display: flex;
  align-items: flex-end;
  justify-content: center;
  transition: filter 0.3s ease;
}

/* Personagem que não está falando fica levemente escuro para dar foco ao orador */
.character-container:not(.is-speaking) {
  filter: brightness(0.6);
}

.pos-left {
  left: 10%;
}
.pos-right {
  right: 10%;
}
.pos-center {
  left: 50%;
  transform: translateX(-50%);
}

.sprite-wrapper {
  display: flex;
  align-items: flex-end;
}

/* Tratamento de Pixel Art e Escala */
.character-sprite {
  image-rendering: pixelated; /* CRÍTICO: Mantém 64x64 nítido */
  width: min(45vw, 320px); /* Responsivo para Celular e Web */
  height: auto;
  object-fit: contain;
}

/* Animação do Pulinho na Fala */
.anim-bounce {
  animation: pop-bounce 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes pop-bounce {
  0% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-20px) scale(1.05);
  }
  100% {
    transform: translateY(0) scale(1);
  }
}

/* ── CAIXA DE DIÁLOGO VISUAL NOVEL ── */
.dialogue-box {
  height: 250px;
  flex-shrink: 0; /* Impede a caixa de espremer o resto */
  background-color: rgba(15, 15, 26, 0.95);
  padding: 1.5rem 3%;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 10;
  box-shadow: 0 -5px 20px rgba(0, 0, 0, 0.5);
}

/* Cores Dinâmicas e Bordas por Personagem */
.speaker-border-assistant {
  border-top: 5px solid #4a90e2;
}
.speaker-border-manager {
  border-top: 5px solid #e24a4a;
}

.color-assistant {
  color: #4a90e2;
}
.color-manager {
  color: #e24a4a;
}

.dialogue-header {
  margin-bottom: 0.5rem;
}
.character-name {
  font-size: 1.4rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.dialogue-text {
  font-size: 1.2rem;
  line-height: 1.6;
  flex-grow: 1;
  color: #e2e8f0;
}

.dialogue-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  align-items: flex-end;
}

.btn-primary {
  background: transparent;
  color: #4fd1c5;
  border: 2px solid #4fd1c5;
  padding: 0.8rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  font-size: 1.1rem;
  transition: all 0.2s;
}
.btn-primary:hover {
  background: #4fd1c5;
  color: #1a202c;
}

.btn-choice {
  background-color: #2d3748;
  color: #fff;
  border: 2px solid #4a5568;
  padding: 0.8rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1.1rem;
}
.btn-choice:hover {
  background-color: #4a5568;
  border-color: #90c0f0;
}

/* Adaptação em Celulares */
@media (max-width: 768px) {
  .dialogue-box {
    height: 280px;
    padding: 1rem;
  }
  .dialogue-text {
    font-size: 1rem;
  }
  .character-name {
    font-size: 1.2rem;
  }
  .btn-choice {
    width: 100%;
    text-align: center;
  }
  .dialogue-actions {
    flex-direction: column;
    width: 100%;
  }
}
</style>
