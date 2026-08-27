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

// --- GLOBAL CONSTANTS ---
const COLORS = {
  // Gameplay Colors
  RED: 0xe53e3e,
  BLUE: 0x3182ce,
  GREEN: 0x38a169,
  YELLOW: 0xd69e2e,
  PURPLE: 0x805ad5,
  
  // UI and Shape Theme Colors
  SHAPE_DEFAULT: 0x63b3ed,
  SLOT_BG: 0x2d3748,
  SLOT_BORDER: 0xa0aec0,
  OPTION_BG: 0x1a202c,
  OPTION_BORDER: 0x4a5568,
  OPTION_BORDER_ACTIVE: 0x63b3ed,
};

// --- LEVEL CONFIGURATION ---
/**
 * Cada objeto representa uma fase do jogo. 
 * difficulty 1: O jogador clica na forma resposta para alternar seu estado.
 * difficulty 2: O jogador escolhe a resposta a partir de opções estáticas na tela.
 */
const LEVEL_CONFIGS = [
  // --- DIFICULDADE 1 (Rotação por clique) ---
  {
    difficulty: 1,
    type: 'rotation',
    sequence: [0, 90, 180],
    answerOptions: [0, 90, 180, 270],
    correctOptionIndex: 3, // 270 graus
    initialOptionIndex: 0
  },
  {
    difficulty: 1,
    type: 'color',
    sequence: [COLORS.RED, COLORS.BLUE, COLORS.RED, COLORS.BLUE],
    answerOptions: [COLORS.RED, COLORS.BLUE, COLORS.GREEN, COLORS.YELLOW], 
    correctOptionIndex: 0, // Vermelho
    initialOptionIndex: 1
  },
  {
    difficulty: 1,
    type: 'rotation',
    sequence: [0, 45, 90, 135],
    answerOptions: [0, 45, 90, 135, 180, 225, 270, 315],
    correctOptionIndex: 4, // 180 graus
    initialOptionIndex: 0
  },
  // --- DIFICULDADE 2 (Seleção a partir de lista) ---
  {
    difficulty: 2,
    type: 'color',
    sequence: [COLORS.RED, COLORS.BLUE, COLORS.GREEN, COLORS.RED, COLORS.BLUE],
    answerOptions: [COLORS.RED, COLORS.BLUE, COLORS.GREEN, COLORS.YELLOW, COLORS.PURPLE],
    correctOptionIndex: 2, // Verde
    initialOptionIndex: -1 // -1 indica nenhuma seleção
  },
  {
    difficulty: 2,
    type: 'rotation',
    sequence: [0, 180, 0, 180, 0], // Cima, Baixo, Cima, Baixo, Cima, [Baixo]
    answerOptions: [0, 45, 90, 135, 180], // 5 opções possíveis
    correctOptionIndex: 4, // 180 graus (Baixo)
    initialOptionIndex: -1
  }
];

const currentDifficulty = computed(() => {
  const idx = (currentLevel.value - 1) % LEVEL_CONFIGS.length;
  return LEVEL_CONFIGS[idx].difficulty;
});

// --- PHASER SCENE LOGIC ---
class PatternRecognitionScene extends Phaser.Scene {
  constructor(onWinCallback) {
    super("PatternRecognitionScene");
    this.onWinCallback = onWinCallback;
  }

  create() {
    this.input.on('gameobjectdown', this.onObjectClicked, this);
    this.generateLevel();
  }

  /**
   * Constrói os elementos da tela dependendo da dificuldade atual.
   */
  generateLevel() {
    this.children.removeAll(); // Limpa a tela entre fases

    const levelIdx = (this.registry.get("level") - 1) % LEVEL_CONFIGS.length;
    this.levelData = LEVEL_CONFIGS[levelIdx];
    this.currentOptionIndex = this.levelData.initialOptionIndex;
    
    // Arrays para guardar as referências de UI da Dificuldade 2
    this.optionBoxes = []; 

    const totalItems = this.levelData.sequence.length + 1;
    const spacing = 600 / (totalItems + 1);
    const yPos = 350;

    // 1. Desenha a sequência estática do padrão
    this.levelData.sequence.forEach((itemVal, i) => {
      const x = spacing * (i + 1);
      this.createShape(x, yPos, itemVal, false);
    });

    // 2. Prepara o slot vazio de resposta no final da sequência
    this.ansX = spacing * totalItems;
    this.ansY = yPos;
    
    // Caixa indicadora de onde a resposta vai
    this.add.rectangle(this.ansX, this.ansY, 80, 80, COLORS.SLOT_BG).setStrokeStyle(2, COLORS.SLOT_BORDER);
    this.questionMark = this.add.text(this.ansX, this.ansY, "?", { fontSize: '32px', fill: '#a0aec0' }).setOrigin(0.5);

    // 3. Monta a mecânica específica com base na dificuldade
    if (this.levelData.difficulty === 1) {
      this.setupDifficulty1Mechanics();
    } else {
      this.setupDifficulty2Mechanics();
    }
  }

  /**
   * Dificuldade 1: O slot de resposta é clicável e alterna as formas/cores.
   */
  setupDifficulty1Mechanics() {
    this.questionMark.setVisible(false); // Esconde a interrogação
    this.answerShape = this.createShape(this.ansX, this.ansY, this.levelData.answerOptions[this.currentOptionIndex], true);
    
    // Marcamos o input para identificar no evento de clique
    this.answerShape.setInteractive({ useHandCursor: true });
    this.answerShape.input.isCycleSlot = true; 
    
    this.add.text(300, 200, "Qual é o próximo padrão?", { fontSize: '24px', fill: '#e2e8f0' }).setOrigin(0.5);
    this.add.text(this.ansX, this.ansY + 60, "Clique para\nmudar", { fontSize: '14px', fill: '#a0aec0', align: 'center' }).setOrigin(0.5);
  }

  /**
   * Dificuldade 2: Opções de resposta espalhadas pela tela; clique em uma para testar.
   */
  setupDifficulty2Mechanics() {
    this.answerShape = null; // A forma no slot só existe quando o jogador selecionar uma opção

    this.add.text(300, 150, "Selecione o próximo padrão", { fontSize: '24px', fill: '#e2e8f0' }).setOrigin(0.5);
    
    const optionsCount = this.levelData.answerOptions.length;
    const optionSpacing = 600 / (optionsCount + 1);
    const optionsY = 550;

    // Renderiza a lista de opções para o jogador escolher
    this.levelData.answerOptions.forEach((optVal, i) => {
      const optX = optionSpacing * (i + 1);
      
      // Caixa clicável atrás da opção
      const box = this.add.rectangle(optX, optionsY, 60, 60, COLORS.OPTION_BG)
        .setStrokeStyle(2, COLORS.OPTION_BORDER)
        .setInteractive({ useHandCursor: true });
      
      box.input.isOptionBox = true;
      box.input.optionIndex = i;
      this.optionBoxes.push(box);

      // Forma visual da opção
      this.createShape(optX, optionsY, optVal, false);
    });
  }

  /**
   * Auxiliar genérico para renderizar formas e cores.
   */
  createShape(x, y, value, isInteractive) {
    let shape;
    if (this.levelData.type === 'rotation') {
      // Triângulo simulando uma seta
      shape = this.add.triangle(x, y, 0, 40, 40, 40, 20, 0, COLORS.SHAPE_DEFAULT);
      shape.setAngle(value);
    } else if (this.levelData.type === 'color') {
      // Círculo com cor
      shape = this.add.circle(x, y, 25, value);
    }
    return shape;
  }

  /**
   * Lida com os cliques dependendo da dificuldade.
   */
  onObjectClicked(pointer, gameObject) {
    if (this.levelData.difficulty === 1) {
      if (gameObject.input && gameObject.input.isCycleSlot) {
        this.currentOptionIndex = (this.currentOptionIndex + 1) % this.levelData.answerOptions.length;
        const newVal = this.levelData.answerOptions[this.currentOptionIndex];
        
        if (this.levelData.type === 'rotation') {
          this.answerShape.setAngle(newVal);
        } else if (this.levelData.type === 'color') {
          this.answerShape.setFillStyle(newVal);
        }
      }
    } 
    else if (this.levelData.difficulty === 2) {
      if (gameObject.input && gameObject.input.isOptionBox) {
        this.currentOptionIndex = gameObject.input.optionIndex;
        
        // Destaca a caixa selecionada visualmente
        this.optionBoxes.forEach((box, i) => {
          if (i === this.currentOptionIndex) {
            box.setStrokeStyle(3, COLORS.OPTION_BORDER_ACTIVE);
            box.setFillStyle(COLORS.SLOT_BG);
          } else {
            box.setStrokeStyle(2, COLORS.OPTION_BORDER);
            box.setFillStyle(COLORS.OPTION_BG);
          }
        });

        // Atualiza a forma no slot alvo
        this.questionMark.setVisible(false);
        if (this.answerShape) {
          this.answerShape.destroy();
        }
        this.answerShape = this.createShape(this.ansX, this.ansY, this.levelData.answerOptions[this.currentOptionIndex], false);
      }
    }
  }

  /**
   * Checa se a escolha atual é a correta.
   */
  checkAnswer() {
    if (this.currentOptionIndex === -1) {
      // Jogador não selecionou nenhuma opção ainda
      this.cameras.main.shake(150, 0.010);
      return;
    }

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

// --- VUE SHELL MOUNTING E COMUNICAÇÃO ---
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

// Ações disparadas pelos botões HTML
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
      <div class="level-indicator">
        Fase {{ currentLevel }}
        <span class="diff-badge">Dif: {{ currentDifficulty }}</span>
      </div>
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
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.diff-badge {
  font-size: 0.8rem;
  background-color: #4a5568;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  color: #e2e8f0;
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
