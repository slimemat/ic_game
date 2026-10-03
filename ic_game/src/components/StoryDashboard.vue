<script setup>
import { ref } from "vue";
import { useGameSessionStore } from "../stores/gameSession";
import PauseModal from "./ui/PauseModal.vue";

const emit = defineEmits(["play"]);
const session = useGameSessionStore();

const isPaused = ref(false);
const showAssistant = ref(true);

function quitDashboard() {
  isPaused.value = false;
  session.setActiveMode("menu");
}

function getSpriteUrl(char, emotion) {
  return new URL(
    `../assets/sprites/${char}_${emotion || "neutral"}.png`,
    import.meta.url,
  ).href;
}
</script>

<template>
  <!-- O dashboard agora volta a ser um overlay (sobreposição) -->
  <div class="dashboard-overlay">
    <button class="btn-pause" @click="isPaused = true">
      {{ $t("global.buttons.pause") }}
    </button>

    <PauseModal
      :isOpen="isPaused"
      @resume="isPaused = false"
      @quit="quitDashboard"
      :showRestart="false"
    />

    <div class="backdrop"></div>

    <div class="os-window">
      <header class="window-header">
        <div class="window-controls">
          <span
            class="dot dot-red"
            @click="isPaused = true"
            title="Menu"
          ></span>
          <span class="dot dot-yellow"></span>
          <span class="dot dot-green"></span>
        </div>
        <div class="window-title">LogicHub - Painel de Chamados</div>
      </header>

      <div class="window-body">
        <div class="assistant-chat-bubble anim-fade-in" v-if="showAssistant">
          <button
            class="btn-close"
            @click="showAssistant = false"
            title="Dispensar"
          >
            &times;
          </button>

          <div class="avatar-container anim-bounce">
            <img
              :src="getSpriteUrl('assistant', 'explaining')"
              class="avatar-icon"
              alt="Assistente"
            />
          </div>

          <span class="sender-name">Assistente</span>
          <div class="text-content">
            Temos um chamado urgente na linha! Clique em
            <strong>Iniciar</strong> para acessar o sistema do cliente e
            resolver os padrões corrompidos.
          </div>
        </div>

        <div class="mission-card">
          <div class="mission-icon-placeholder"></div>

          <!-- Título e Tags agora agrupados à direita do ícone -->
          <div class="mission-info">
            <h3>Padrões Corrompidos</h3>
            <div class="tags">
              <span class="tag tag-level">Nível: Fácil</span>
              <span class="tag tag-type">Tipo: Reconhecimento</span>
            </div>
          </div>

          <div class="mission-action">
            <button
              class="btn-primary"
              @click="$emit('play', 'pattern-recognition')"
            >
              Iniciar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── VOLTAMOS PARA O OVERLAY (Sobreposição) ── */
.dashboard-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
}

.backdrop {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(6px); /* Esse é o efeito de vidro lindo no fundo! */
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
  z-index: 1050;
  font-weight: bold;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.os-window {
  position: relative;
  z-index: 10;
  width: 90%;
  max-width: 750px;
  background-color: #f4f5f7;
  border-radius: 12px;
  overflow: hidden;
  box-shadow:
    0 30px 60px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.2);
  display: flex;
  flex-direction: column;
}

.window-header {
  height: 45px;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(225, 230, 235, 0.7) 49%,
    rgba(195, 205, 215, 0.7) 50%,
    rgba(235, 240, 245, 0.9) 100%
  );
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  padding: 0 15px;
  position: relative;
}

.window-controls {
  display: flex;
  gap: 8px;
}
.dot {
  width: 13px;
  height: 13px;
  border-radius: 50%;
  box-shadow:
    inset 0 2px 4px rgba(255, 255, 255, 0.6),
    inset 0 -2px 4px rgba(0, 0, 0, 0.2),
    0 1px 1px rgba(0, 0, 0, 0.1);
}
.dot-red {
  background-color: #ff5f56;
  border: 1px solid #e0443e;
  cursor: pointer;
  transition: transform 0.2s;
}
.dot-red:hover {
  transform: scale(1.15);
}
.dot-yellow {
  background-color: #ffbd2e;
  border: 1px solid #dea123;
}
.dot-green {
  background-color: #27c93f;
  border: 1px solid #1aab29;
}

.window-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.9rem;
  font-weight: 600;
  color: #333;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.8);
}

.window-body {
  background-color: #ffffff;
  padding: 2.5rem 2rem;
}

.assistant-chat-bubble {
  position: relative;
  background-color: #ebf8ff;
  border-left: 4px solid #4a90e2;
  border-radius: 12px;
  border-bottom-left-radius: 0;
  padding: 15px 35px 15px 15px;
  margin-left: 25px;
  margin-bottom: 2rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
}

.assistant-chat-bubble::after {
  content: "";
  display: table;
  clear: both;
}

.btn-close {
  position: absolute;
  top: 8px;
  right: 12px;
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #718096;
  cursor: pointer;
  line-height: 1;
}
.btn-close:hover {
  color: #e53e3e;
}

.avatar-container {
  float: left;
  width: 65px;
  height: 65px;
  margin-top: -15px;
  margin-left: -35px;
  margin-right: 15px;
  margin-bottom: 5px;
  background-color: #fff;
  border-radius: 50%;
  border: 2px solid #4a90e2;
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

.sender-name {
  font-weight: 800;
  font-size: 0.95rem;
  color: #2b6cb0;
  display: block;
  margin-bottom: 4px;
  line-height: 1.2;
}
.text-content {
  color: #2d3748;
  font-size: 1.05rem;
  line-height: 1.5;
  display: block;
}

.mission-card {
  display: flex;
  gap: 1.5rem;
  align-items: center;
  background: #f8fafc;
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);
}

.mission-icon-placeholder {
  width: 90px;
  height: 90px;
  flex-shrink: 0;
  border-radius: 12px;
  background: linear-gradient(135deg, #4fd1c5, #2b6cb0);
  box-shadow:
    inset 0 4px 8px rgba(255, 255, 255, 0.4),
    inset 0 -4px 8px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
}
.mission-icon-placeholder::after {
  content: "SPRITE";
  color: white;
  font-weight: 800;
  font-size: 0.8rem;
  opacity: 0.8;
}

.mission-info {
  flex-grow: 1;
}
.mission-info h3 {
  margin: 0 0 0.5rem 0;
  color: #2d3748;
  font-size: 1.3rem;
}

.tags {
  display: flex;
  gap: 0.5rem;
}
.tag {
  font-size: 0.75rem;
  font-weight: bold;
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.tag-level {
  background: #e6fffa;
  color: #319795;
  border: 1px solid #b2f5ea;
}
.tag-type {
  background: #ebf8ff;
  color: #2b6cb0;
  border: 1px solid #bee3f8;
}

.mission-action {
  flex-shrink: 0;
}
.btn-primary {
  background: linear-gradient(180deg, #4fd1c5 0%, #38b2ac 100%);
  color: #fff;
  border: 1px solid #319795;
  padding: 0.8rem 2rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  font-size: 1.1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}
.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.anim-fade-in {
  animation: fade-in 0.4s ease-out;
}
.anim-bounce {
  animation: pop-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
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
  .os-window {
    width: 95%;
  }
  .window-body {
    padding: 2rem 1.5rem;
  }
  .assistant-chat-bubble {
    margin-left: 15px;
    padding-left: 12px;
  }
  .avatar-container {
    width: 55px;
    height: 55px;
    margin-left: -25px;
  }
  .mission-card {
    flex-wrap: wrap;
    padding: 1.2rem;
    gap: 1rem;
  }
  .mission-info {
    flex-grow: 1;
  }
  .mission-action {
    width: 100%;
  }
  .btn-primary {
    width: 100%;
  }
}
</style>
