<script setup>
import { onBeforeUnmount, onMounted, ref, shallowRef } from "vue";
import Phaser from "phaser";

const emit = defineEmits(["back"]);

// Vue State
const gameRoot = ref(null);
const game = shallowRef(null);
const gameScene = shallowRef(null);
const hasWon = ref(false);
const currentLevel = ref(1);

// Configuracoes das Fases
const LEVEL_CONFIGS = [
  {
    type: 'rotation',
    sequence: [0, 90, 180],
    answerOptions: [0, 90, 180, 270],
    correctOptionIndex: 3, // 270 graus
    initialOptionIndex: 0
  },
  {
    type: 'color',
    sequence: [0xe53e3e, 0x3182ce, 0xe53e3e, 0x3182ce], // Vermelho, Azul, Vermelho, Azul
    answerOptions: [0xe53e3e, 0x3182ce, 0x38a169, 0xd69e2e], // Vermelho, Azul, Verde, Amarelo
    correctOptionIndex: 0, // Vermelho
    initialOptionIndex: 1 // Começa no Azul para o jogador ter que mudar
  },
  {
    type: 'rotation',
    sequence: [0, 45, 90, 135],
    answerOptions: [0, 45, 90, 135, 180, 225, 270, 315],
    correctOptionIndex: 4, // 180 graus
    initialOptionIndex: 0
  }
];

// --- PHASER SCENE ---
class PatternRecognitionScene extends Phaser.Scene {
  constructor(onWinCallback) {
    super("PatternRecognitionScene");
    this.onWinCallback = onWinCallback;
  }

  create() {
    this.input.on('gameobjectdown', this.onObjectClicked, this);
    this.generateLevel();
  }

  generateLevel() {
    this.children.removeAll(); // Limpa a fase anterior

    // Loop nas fases caso o jogador passe de todas
    const levelIdx = (this.registry.get("level") - 1) % LEVEL_CONFIGS.length;
    this.levelData = LEVEL_CONFIGS[levelIdx];
    this.currentOptionIndex = this.levelData.initialOptionIndex;

    const totalItems = this.levelData.sequence.length + 1;
    const spacing = 600 / (totalItems + 1);
    const yPos = 400;

    // Desenha a sequencia estatica
    this.levelData.sequence.forEach((itemVal, i) => {
      const x = spacing * (i + 1);
      this.createShape(x, yPos, itemVal, false);
    });

    // Desenha o slot de resposta interativo
    const ansX = spacing * totalItems;
    
    // Caixa de fundo para destacar o slot alvo
    this.add.rectangle(ansX, yPos, 80, 80, 0x2d3748)
        .setStrokeStyle(2, 0xa0aec0);

    this.answerShape = this.createShape(ansX, yPos, this.levelData.answerOptions[this.currentOptionIndex], true);
    this.answerShape.setInteractive({ useHandCursor: true });
    
    // Textos de ajuda
    this.add.text(300, 200, "Qual é o próximo padrão?", { fontSize: '24px', fill: '#e2e8f0' }).setOrigin(0.5);
    this.add.text(ansX, yPos + 60, "Clique para\nmudar", { fontSize: '14px', fill: '#a0aec0', align: 'center' }).setOrigin(0.5);
  }

  createShape(x, y, value, isInteractive) {
    let shape;
    if (this.levelData.type === 'rotation') {
      // Triangulo simples (parece uma seta apontando para cima por padrao)
      shape = this.add.triangle(x, y, 0, 40, 40, 40, 20, 0, 0x63b3ed);
      shape.setAngle(value);
    } else if (this.levelData.type === 'color') {
      // Circulo simples
      shape = this.add.circle(x, y, 25, value);
    }
    return shape;
  }

  onObjectClicked(pointer, gameObject) {
    if (gameObject === this.answerShape) {
      this.currentOptionIndex = (this.currentOptionIndex + 1) % this.levelData.answerOptions.length;
      const newVal = this.levelData.answerOptions[this.currentOptionIndex];
      
      if (this.levelData.type === 'rotation') {
        this.answerShape.setAngle(newVal);
      } else if (this.levelData.type === 'color') {
        this.answerShape.setFillStyle(newVal);
      }
    }
  }

  checkAnswer() {
    if (this.currentOptionIndex === this.levelData.correctOptionIndex) {
      this.onWinCallback();
    } else {
      this.cameras.main.shake(200, 0.015);
    }
  }

  resetLevel() {
    this.generateLevel();
  }
}

// --- VUE SHELL MOUNTING ---
onMounted(() => {
  const handleWin = () => {
    hasWon.value = true;
  };

  const scene = new PatternRecognitionScene(handleWin);
  gameScene.value = scene;

  game.value = new Phaser.Game({
    type: Phaser.AUTO,
    parent: gameRoot.value,
    backgroundColor: "#1a202c",
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 600,
      height: 800,
    },
    scene,
  });

  game.value.registry.set("level", currentLevel.value);
});

onBeforeUnmount(() => {
  game.value?.destroy(true);
  game.value = null;
  gameScene.value = null;
});

// Shell Actions
const checkAnswer = () => {
  gameScene.value?.checkAnswer();
};

const resetGame = () => {
  gameScene.value?.resetLevel();
};

const nextLevel = () => {
  hasWon.value = false;
  currentLevel.value++;
  game.value.registry.set("level", currentLevel.value);
  gameScene.value?.generateLevel();
};
</script>

<template>
  <main class="game-screen">
    <!-- Phaser container -->
    <div
      ref="gameRoot"
      class="game-root"
      aria-label="Pattern Recognition Game"
    ></div>

    <!-- External UI Shell -->
    <div class="ui-controls">
      <div class="level-indicator">Fase {{ currentLevel }}</div>
      <div class="button-group">
        <button class="action-button highlight" type="button" @click="checkAnswer">
          Confirmar
        </button>
        <button class="action-button" type="button" @click="resetGame">
          Reiniciar
        </button>
        <button
          class="action-button secondary"
          type="button"
          @click="$emit('back')"
        >
          Voltar
        </button>
      </div>
    </div>

    <!-- Win Overlay -->
    <div v-if="hasWon" class="win-overlay">
      <h2>Correto!</h2>
      <p>Você encontrou o padrão lógico.</p>
      <button class="action-button primary" @click="nextLevel">
        Próxima Fase
      </button>
    </div>
  </main>
</template>

<style scoped>
.game-screen {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  background-color: #1a202c;
  font-family: sans-serif;
}

.game-root {
  flex: 1;
  min-height: 0;
}

.ui-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: #2d3748;
  color: #e2e8f0;
}

.level-indicator {
  font-weight: bold;
  font-size: 1.2rem;
}

.button-group {
  display: flex;
  gap: 0.5rem;
}

.action-button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  background-color: #4a5568;
  color: white;
}

.action-button.highlight {
  background-color: #3182ce;
}

.action-button.primary {
  background-color: #48bb78;
  font-size: 1.2rem;
  padding: 1rem 2rem;
}

.action-button.secondary {
  background-color: transparent;
  border: 1px solid #4a5568;
}

.win-overlay {
  position: absolute;
  inset: 0;
  background-color: rgba(26, 32, 44, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  z-index: 10;
}

.win-overlay h2 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  color: #48bb78;
}

.win-overlay p {
  margin-bottom: 2rem;
  color: #a0aec0;
}
</style>
