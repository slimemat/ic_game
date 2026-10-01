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

const sceneFlow = {
  intro: {
    char: "assistant",
    choices: [
      { id: "choiceA", next: "replyA" },
      { id: "choiceB", next: "replyB" },
    ],
  },
  replyA: { char: "assistant", next: "call_manager" },
  replyB: { char: "assistant", next: "call_manager" },
  call_manager: { char: "assistant", next: "manager_enters" },
  manager_enters: { char: "manager", next: "manager_explains" },
  manager_explains: { char: "manager", next: "assistant_finish" },
  assistant_finish: { char: "assistant", next: "end_scene" },
};

const currentNodeId = ref("intro");

const currentDialogue = computed(() => sceneFlow[currentNodeId.value]);

function advance(nextNodeId) {
  if (nextNodeId === "end_scene") {
    // Vai para a tela de briefing (Painel de Chamados) do modo história
    session.setActiveMode("story-dashboard");
  } else {
    currentNodeId.value = nextNodeId;
  }
}

function quitStory() {
  isPaused.value = false;
  session.setActiveMode("menu"); // Volta ao MainMenu
}
</script>

<template>
  <div class="story-mode-container">
    <!-- Botão de Menu / Pausa no canto superior -->
    <button class="btn-pause" @click="isPaused = true">
      {{ $t("global.buttons.pause") }}
    </button>

    <!-- Componente de Modal Reaproveitado -->
    <PauseModal
      :isOpen="isPaused"
      @resume="isPaused = false"
      @quit="quitStory"
      :showRestart="false"
    />

    <div class="visual-area">
      <div
        class="character-avatar"
        :class="{
          'avatar-assistant': currentDialogue.char === 'assistant',
          'avatar-manager': currentDialogue.char === 'manager',
        }"
      >
        <span class="placeholder-text">
          {{ $t("story.characters." + currentDialogue.char, storyVariables)
          }}<br />(Avatar Pixel Art)
        </span>
      </div>
    </div>

    <div class="dialogue-box">
      <div class="character-name">
        {{ $t("story.characters." + currentDialogue.char, storyVariables) }}
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
          <button class="btn-primary" @click="advance(currentDialogue.next)">
            {{ $t("global.buttons.continue") }}
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
  background-color: #1a1a2e;
  color: #fff;
  justify-content: flex-end;
  position: relative;
}

.btn-pause {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background-color: #333;
  color: white;
  border: 1px solid #555;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  z-index: 10;
  font-weight: bold;
}
.btn-pause:hover {
  background-color: #555;
}

.visual-area {
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}
.character-avatar {
  width: 200px;
  height: 250px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  border-radius: 8px;
  font-weight: bold;
  border: 4px dashed #333;
  transition: all 0.3s ease;
}
.avatar-assistant {
  background-color: #4a90e2;
  border-color: #90c0f0;
}
.avatar-manager {
  background-color: #e24a4a;
  border-color: #f09090;
}
.placeholder-text {
  opacity: 0.8;
}
.dialogue-box {
  background-color: #0f0f1a;
  border-top: 4px solid #4a90e2;
  padding: 1.5rem;
  min-height: 200px;
  display: flex;
  flex-direction: column;
}
.character-name {
  font-size: 1.2rem;
  font-weight: bold;
  color: #4a90e2;
  margin-bottom: 0.5rem;
}
.dialogue-text {
  font-size: 1.1rem;
  line-height: 1.5;
  margin-bottom: 1.5rem;
  flex-grow: 1;
}
.dialogue-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}
.btn-primary {
  background: #4fd1c5;
  color: #1a202c;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s;
}
.btn-primary:hover {
  background: #38b2ac;
}
.btn-choice {
  background-color: #333;
  color: #fff;
  border: 2px solid #555;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}
.btn-choice:hover {
  background-color: #555;
  border-color: #4a90e2;
}
</style>
