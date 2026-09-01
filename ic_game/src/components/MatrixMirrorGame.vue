<script setup>
import { onBeforeUnmount, onMounted, ref, shallowRef, computed } from "vue";
import Phaser from "phaser";

const emit = defineEmits(["back"]);

// --- VUE STATE ---
const gameRoot = ref(null);
const game = shallowRef(null);
const gameScene = shallowRef(null);
const hasWon = ref(false);
const currentLevel = ref(1);

const correctBlocks = ref(0);
const totalBlocks = ref(0);

const COLORS = {
  BG: 0x1a202c,
  OFF: 0x2d3748,
  ON_ORIGINAL: 0x4fd1c5, // Ciano
  ON_PLAYER: 0xf6e05e,   // Amarelo
  BORDER: 0x4a5568,
  TEXT_OFF: '#4a5568',
  TEXT_ON_ORIGINAL: '#1a202c',
  TEXT_ON_PLAYER: '#1a202c',
};

const LEVELS = [
  {
    // Fase 1: 1D Espelhamento
    title: "O Básico (1 Linha)",
    description: "Crie o reflexo amarelo da imagem ciano.",
    input: [1, 0, 0],
    expected: [0, 0, 1],
    dimensions: { rows: 1, cols: 3 }
  },
  {
    // Fase 2: 2x2
    title: "Bloco 2x2",
    description: "Espelhe a matriz. No final, elas se dobram para a prova real!",
    input: [
      [1, 0],
      [0, 1]
    ],
    expected: [
      [0, 1],
      [1, 0]
    ],
    dimensions: { rows: 2, cols: 2 }
  },
  {
    // Fase 3: 3x3 Desafio
    title: "A Fechadura 3x3",
    description: "A matriz completa será dobrada como uma página de livro.",
    input: [
      [0, 1, 1],
      [1, 0, 0],
      [0, 1, 1]
    ],
    expected: [
      [1, 1, 0],
      [0, 0, 1],
      [1, 1, 0]
    ],
    dimensions: { rows: 3, cols: 3 }
  }
];

const currentLevelData = computed(() => {
  const idx = (currentLevel.value - 1) % LEVELS.length;
  return LEVELS[idx];
});

// --- PHASER SCENE ---
class MatrixGameScene extends Phaser.Scene {
  constructor(onMatchUpdate, onWin) {
    super("MatrixGameScene");
    this.onMatchUpdate = onMatchUpdate;
    this.onWin = onWin;
    this.playerMatrix = [];
    this.originalContainer = null;
    this.playerContainer = null;
    this.interactiveBlocks = [];
    this.isAnimating = false;
  }

  create() {
    this.generateVisuals();
  }

  generateVisuals() {
    this.isAnimating = false;
    
    // Limpa estado anterior
    if (this.originalContainer) this.originalContainer.destroy(true);
    if (this.playerContainer) this.playerContainer.destroy(true);
    if (this.titleLeft) this.titleLeft.destroy(true);
    if (this.titleRight) this.titleRight.destroy(true);
    
    this.interactiveBlocks = [];

    const levelData = LEVELS[(this.registry.get("level") - 1) % LEVELS.length];
    const is2D = levelData.dimensions.rows > 1;
    
    // Inicia a matriz do jogador com 0 (Desligado)
    this.playerMatrix = [];
    for (let r = 0; r < levelData.dimensions.rows; r++) {
      if (is2D) {
        this.playerMatrix.push(new Array(levelData.dimensions.cols).fill(0));
      }
    }
    if (!is2D) {
       this.playerMatrix = new Array(levelData.dimensions.cols).fill(0);
    }

    const startY = 220;
    const blockSize = 60;
    const spacing = 70;
    
    // Containers
    this.originalContainer = this.add.container(200, startY);
    this.playerContainer = this.add.container(600, startY);

    // Textos (fora dos containers para não girarem)
    this.titleLeft = this.add.text(200, startY - 80, "Matriz Original", { fontSize: '24px', fill: '#e2e8f0', fontStyle: 'bold' }).setOrigin(0.5);
    this.titleRight = this.add.text(600, startY - 80, "Sua Matriz (Espelho)", { fontSize: '24px', fill: '#e2e8f0', fontStyle: 'bold' }).setOrigin(0.5);
    
    // Desenha matriz Original (Estática)
    this.drawMatrix(this.originalContainer, levelData.input, levelData.dimensions, blockSize, spacing, false);
    
    // Desenha matriz do Jogador (Interativa)
    this.drawMatrix(this.playerContainer, this.playerMatrix, levelData.dimensions, blockSize, spacing, true);

    this.checkMatches();
  }

  drawMatrix(container, matrix, dims, blockSize, spacing, isInteractive) {
    const is2D = dims.rows > 1;
    
    // O (0,0) do container será o centro geométrico da matriz
    const totalWidth = dims.cols * spacing;
    const totalHeight = dims.rows * spacing;
    
    const startX = -(totalWidth / 2) + (spacing / 2);
    const localStartY = -(totalHeight / 2) + (spacing / 2);
    
    for (let r = 0; r < dims.rows; r++) {
      for (let c = 0; c < dims.cols; c++) {
        const val = is2D ? matrix[r][c] : matrix[c];
        
        let color = COLORS.OFF;
        let textColor = COLORS.TEXT_OFF;
        if (val === 1) {
          color = isInteractive ? COLORS.ON_PLAYER : COLORS.ON_ORIGINAL;
          textColor = isInteractive ? COLORS.TEXT_ON_PLAYER : COLORS.TEXT_ON_ORIGINAL;
        }

        const x = startX + c * spacing;
        const y = localStartY + r * spacing;

        const rect = this.add.rectangle(x, y, blockSize, blockSize, color)
          .setStrokeStyle(3, COLORS.BORDER);
        
        // Adiciona texto de coordenada
        const coordText = `${r + 1},${c + 1}`;
        const q = this.add.text(x, y, coordText, { fill: textColor, fontSize: '18px', fontStyle: 'bold' }).setOrigin(0.5);
        
        container.add([rect, q]);

        if (isInteractive) {
          const blockData = { r, c, rect, textObj: q };
          rect.setInteractive({ useHandCursor: true });
          rect.on('pointerdown', () => this.handleBlockClick(blockData));
          this.interactiveBlocks.push(blockData);
        }
      }
    }
  }

  handleBlockClick(blockData) {
    if (this.isAnimating) return;

    const { r, c, rect, textObj } = blockData;
    const levelData = LEVELS[(this.registry.get("level") - 1) % LEVELS.length];
    const is2D = levelData.dimensions.rows > 1;
    
    let currentVal = is2D ? this.playerMatrix[r][c] : this.playerMatrix[c];
    
    // Toggle: 0 (Desligado) <-> 1 (Ligado)
    let newVal = currentVal === 0 ? 1 : 0;

    if (is2D) {
      this.playerMatrix[r][c] = newVal;
    } else {
      this.playerMatrix[c] = newVal;
    }

    // Atualiza visual
    const color = newVal === 1 ? COLORS.ON_PLAYER : COLORS.OFF;
    const textColor = newVal === 1 ? COLORS.TEXT_ON_PLAYER : COLORS.TEXT_OFF;

    rect.setFillStyle(color);
    textObj.setColor(textColor);

    // Efeito sutil de clique
    this.tweens.add({
        targets: rect,
        scaleX: 0.9,
        scaleY: 0.9,
        duration: 50,
        yoyo: true
    });

    this.checkMatches();
  }

  checkMatches() {
    if (this.isAnimating) return;

    const levelData = LEVELS[(this.registry.get("level") - 1) % LEVELS.length];
    const is2D = levelData.dimensions.rows > 1;
    const expected = levelData.expected;
    
    let correct = 0;
    let total = levelData.dimensions.rows * levelData.dimensions.cols;

    for (let r = 0; r < levelData.dimensions.rows; r++) {
      for (let c = 0; c < levelData.dimensions.cols; c++) {
        const playerVal = is2D ? this.playerMatrix[r][c] : this.playerMatrix[c];
        const expectedVal = is2D ? expected[r][c] : expected[c];
        
        if (playerVal === expectedVal) {
          correct++;
        }
      }
    }

    this.onMatchUpdate(correct, total);

    if (correct === total) {
      this.playWinAnimation();
    }
  }

  playWinAnimation() {
    this.isAnimating = true;

    // Desativa interatividade
    this.interactiveBlocks.forEach(b => b.rect.disableInteractive());

    // Some com os títulos
    this.tweens.add({
      targets: [this.titleLeft, this.titleRight],
      alpha: 0,
      duration: 300
    });
    
    // Torna a matriz do jogador semi-transparente para ver a fusão (Prova Real)
    this.playerContainer.setAlpha(0.7);
    
    // Traz a matriz do jogador para a frente (z-index)
    this.playerContainer.setDepth(10);

    // Animação de dobra (espelhamento) e deslizamento para o centro
    this.tweens.add({
      targets: this.originalContainer,
      x: 400,
      duration: 1000,
      ease: 'Cubic.easeInOut'
    });

    this.tweens.add({
      targets: this.playerContainer,
      x: 400,
      scaleX: -1, // Faz o espelhamento / flip 3D no eixo X
      duration: 1000,
      ease: 'Cubic.easeInOut',
      onComplete: () => {
        // Após o sobrepor perfeito, uma pequena pulsação
        this.tweens.add({
          targets: [this.originalContainer, this.playerContainer],
          scaleY: 1.1,
          scaleX: (target) => target === this.playerContainer ? -1.1 : 1.1, // Mantém o flip do jogador
          duration: 300,
          yoyo: true,
          onComplete: () => {
            this.time.delayedCall(200, () => {
              this.onWin();
            });
          }
        });
      }
    });
  }

  resetLevel() {
    this.generateVisuals();
  }
}

// --- VUE SHELL LOGIC ---
onMounted(() => {
  const handleMatchUpdate = (correct, total) => {
    correctBlocks.value = correct;
    totalBlocks.value = total;
  };

  const handleWin = () => {
    hasWon.value = true;
  };

  const scene = new MatrixGameScene(handleMatchUpdate, handleWin);
  gameScene.value = scene;

  game.value = new Phaser.Game({
    type: Phaser.AUTO,
    parent: gameRoot.value,
    backgroundColor: "#1a202c",
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 800,
      height: 500,
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

const resetLevel = () => {
  gameScene.value?.resetLevel();
};

const nextLevel = () => {
  hasWon.value = false;
  currentLevel.value++;
  game.value.registry.set("level", currentLevel.value);
  gameScene.value?.resetLevel();
};
</script>

<template>
  <main class="game-screen">
    <div class="level-header">
      <h2>Fase {{ currentLevel }}: {{ currentLevelData.title }}</h2>
      <p class="description">{{ currentLevelData.description }}</p>
    </div>

    <div class="status-bar" :class="{ 'all-correct': correctBlocks === totalBlocks && totalBlocks > 0 }">
      <div class="progress-text">
        Sincronização: <strong>{{ correctBlocks }}</strong> / <strong>{{ totalBlocks }}</strong>
      </div>
      <div class="progress-bar-container">
        <div class="progress-bar-fill" :style="{ width: (totalBlocks > 0 ? (correctBlocks / totalBlocks) * 100 : 0) + '%' }"></div>
      </div>
    </div>

    <!-- Phaser Visualizer -->
    <div ref="gameRoot" class="game-root" aria-label="Matrix Mirror Game Visuals"></div>

    <div class="controls-area">
      <button class="action-button" @click="resetLevel">Limpar Matriz</button>
      <button class="action-button secondary" @click="$emit('back')">Voltar ao Menu</button>
    </div>

    <!-- Win Overlay -->
    <div v-if="hasWon" class="win-overlay">
      <div class="win-card">
        <h2>✨ Espelhamento Perfeito! ✨</h2>
        <p>A prova real confirmou: os índices se encaixam exatamente.</p>
        <button class="action-button primary" @click="nextLevel">
          Próxima Fase
        </button>
      </div>
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
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.level-header {
  padding: 1.5rem;
  background-color: #2d3748;
  color: #e2e8f0;
  text-align: center;
  border-bottom: 4px solid #4a5568;
}

.level-header h2 {
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
  color: #f6e05e;
}

.description {
  margin: 0;
  font-size: 1.1rem;
  color: #a0aec0;
}

.status-bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background-color: #1a202c;
  border-bottom: 2px solid #2d3748;
}

.progress-text {
  color: #e2e8f0;
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
}

.progress-bar-container {
  width: 300px;
  height: 12px;
  background-color: #2d3748;
  border-radius: 6px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background-color: #f6e05e;
  transition: width 0.3s ease;
}

.status-bar.all-correct .progress-text {
  color: #f6e05e;
  font-weight: bold;
}

.game-root {
  flex: 1;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.controls-area {
  display: flex;
  justify-content: center;
  gap: 1rem;
  padding: 1.5rem;
  background-color: #2d3748;
}

.action-button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  background-color: #4a5568;
  color: white;
  font-size: 1.1rem;
  transition: background-color 0.2s;
}

.action-button:hover {
  background-color: #718096;
}

.action-button.primary {
  background-color: #48bb78;
  font-size: 1.3rem;
  padding: 1rem 2.5rem;
}

.action-button.primary:hover {
  background-color: #38a169;
}

.action-button.secondary {
  background-color: transparent;
  border: 2px solid #4a5568;
}

.action-button.secondary:hover {
  background-color: #2d3748;
}

.win-overlay {
  position: absolute;
  inset: 0;
  background-color: rgba(26, 32, 44, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.win-card {
  background-color: #2d3748;
  padding: 3rem;
  border-radius: 12px;
  text-align: center;
  border: 4px solid #f6e05e;
  box-shadow: 0 10px 25px rgba(0,0,0,0.5);
}

.win-card h2 {
  font-size: 2.5rem;
  margin-top: 0;
  margin-bottom: 1rem;
  color: #f6e05e;
}

.win-card p {
  color: #e2e8f0;
  font-size: 1.2rem;
  margin-bottom: 2rem;
}
</style>
