<script setup>
import { onBeforeUnmount, onMounted, ref, shallowRef, computed } from "vue";
import Phaser from "phaser";

const emit = defineEmits(["back"]);

// --- CHARADES DATA ---
const charades = [
  {
    title: "Jogo 1: Quem é o Suspeito? - FASE 1",
    statement:
      "Suspeitos: Ana (Sem óculos), Beto (Com óculos), Caio (Sem óculos).",
    suspects: ["Ana", "Beto", "Caio"],
    clue: "O culpado usa óculos.",
    rule: "",
    answer: "Beto",
    library: [
      { id: "ana", type: "person", color: 0xfca5a5, label: "Ana" },
      { id: "beto", type: "person", color: 0x93c5fd, label: "Beto" },
      { id: "caio", type: "person", color: 0x86efac, label: "Caio" },
      { id: "glasses", type: "accessory", color: 0x334155, label: "Óculos" },
    ],
  },
  {
    title: "Jogo 1: Quem é o Suspeito? - FASE 2",
    statement: "Suspeitos: Ana e Beto.",
    suspects: ["Ana", "Beto"],
    clue: "Ana diz: 'Eu sou a culpada.'\nBeto diz: 'Ana está mentindo.'",
    rule: "Apenas 1 fala a verdade.",
    answer: "Beto",
    library: [
      { id: "ana", type: "person", color: 0xfca5a5, label: "Ana" },
      { id: "beto", type: "person", color: 0x93c5fd, label: "Beto" },
      { id: "truth", type: "logic", color: 0x86efac, label: "Verdade" },
      { id: "lie", type: "logic", color: 0xfca5a5, label: "Mentira" },
      { id: "culprit", type: "logic", color: 0xf87171, label: "Culpado" },
    ],
  },
  {
    title: "Jogo 1: Quem é o Suspeito? - FASE 3",
    statement: "Suspeitos: A, B e C.",
    suspects: ["A", "B", "C"],
    clue: "A diz: 'B é culpado.'\nB diz: 'C é inocente.'\nC diz: 'A declaração de B é falsa.'",
    rule: "Exatamente um deles mentiu.",
    answer: "C",
    library: [
      { id: "personA", type: "person", color: 0xfca5a5, label: "Pessoa A" },
      { id: "personB", type: "person", color: 0x93c5fd, label: "Pessoa B" },
      { id: "personC", type: "person", color: 0x86efac, label: "Pessoa C" },
      { id: "truth", type: "logic", color: 0x86efac, label: "Verdade" },
      { id: "lie", type: "logic", color: 0xfca5a5, label: "Mentira" },
      { id: "culprit", type: "logic", color: 0xf87171, label: "Culpado" },
      { id: "innocent", type: "logic", color: 0x93c5fd, label: "Inocente" },
    ],
  },
];

// Vue State
const gameRoot = ref(null);
const game = shallowRef(null);
const gameScene = shallowRef(null);
const hasWon = ref(false);
const showLoss = ref(false);
const currentLevel = ref(0);

const currentCharade = computed(() => charades[currentLevel.value]);

// --- PHASER SCENE ---
class CharadeGameScene extends Phaser.Scene {
  constructor(onReady) {
    super("CharadeGameScene");
    this.onReady = onReady;
    this.canvasItems = [];
  }

  create() {
    this.setupUI();
    if (this.onReady) {
      this.onReady(this);
    }
  }

  setupUI() {
    this.cameras.main.setBackgroundColor("#f0f4f8");

    // Divider line
    this.add.line(0, 0, 200, 0, 200, 800, 0xcbd5e1).setOrigin(0, 0);
    this.add.text(10, 10, "Biblioteca", {
      fontSize: "20px",
      fill: "#334155",
      fontStyle: "bold",
    });
    this.add.text(220, 10, "Canvas", {
      fontSize: "20px",
      fill: "#334155",
      fontStyle: "bold",
    });

    // Trash area
    this.trashArea = this.add
      .rectangle(600, 800, 150, 150, 0xef4444, 0.2)
      .setOrigin(1, 1);
    this.trashIcon = this.add
      .text(525, 725, "🗑️", { fontSize: "40px" })
      .setOrigin(0.5);
    this.add
      .text(525, 770, "Lixeira", { fontSize: "16px", fill: "#ef4444" })
      .setOrigin(0.5);

    this.trashZone = this.add
      .zone(525, 725, 150, 150)
      .setRectangleDropZone(150, 150);

    this.input.on("dragstart", (pointer, gameObject) => {
      this.children.bringToTop(gameObject);
    });

    this.input.on("drag", (pointer, gameObject, dragX, dragY) => {
      gameObject.x = dragX;
      gameObject.y = dragY;
    });

    this.input.on("drop", (pointer, gameObject, dropZone) => {
      if (dropZone === this.trashZone) {
        this.deleteCanvasItem(gameObject);
      }
    });

    this.input.on("dragend", (pointer, gameObject, dropped) => {
      if (!dropped) {
        this.checkCombination(gameObject);
      }
    });
  }

  loadLevel(libraryData) {
    this.children.removeAll();
    this.canvasItems = [];
    this.setupUI();

    let startY = 70;
    libraryData.forEach((item, index) => {
      const y = startY + index * 70;

      const hitArea = this.add
        .rectangle(100, y, 180, 60, 0x000000, 0)
        .setInteractive({ useHandCursor: true });

      const size = item.type === "person" ? 40 : 25;
      this.add
        .rectangle(40, y, size, size, item.color)
        .setStrokeStyle(2, 0x334155);

      this.add
        .text(70, y, item.label, {
          fontSize: "16px",
          fill: "#334155",
          wordWrap: { width: 120 },
        })
        .setOrigin(0, 0.5);

      hitArea.on("pointerdown", () => {
        this.spawnCanvasItem(item);
      });
    });
  }

  spawnCanvasItem(data) {
    const randomOffsetX = Phaser.Math.Between(-30, 30);
    const randomOffsetY = Phaser.Math.Between(-30, 30);
    const x = 400 + randomOffsetX;
    const y = 300 + randomOffsetY;

    const container = this.add.container(x, y);
    // clone data to allow modifying label
    container.setData("itemData", { ...data });

    const size = data.type === "person" ? 60 : 40;

    // Visual placeholder
    const bg = this.add
      .rectangle(0, 0, size, size, data.color)
      .setStrokeStyle(2, 0x334155);

    // Label
    const text = this.add
      .text(0, size / 2 + 10, data.label, {
        fontSize: "14px",
        fill: "#0f172a",
        backgroundColor: "#ffffffaa",
        padding: { x: 4, y: 2 },
      })
      .setOrigin(0.5, 0);

    container.add([bg, text]);
    container.setSize(size, size + 20); // allow click on label too
    container.setInteractive({ draggable: true, useHandCursor: true });

    container.bg = bg;
    container.text = text;

    this.canvasItems.push(container);
  }

  deleteCanvasItem(item) {
    this.canvasItems = this.canvasItems.filter((i) => i !== item);
    item.destroy();
  }

  checkCombination(draggedItem) {
    const dragData = draggedItem.getData("itemData");

    // Only logic and accessories can be merged into a person
    if (dragData.type === "person") return;

    const threshold = 60;

    for (let i = 0; i < this.canvasItems.length; i++) {
      const target = this.canvasItems[i];
      if (target !== draggedItem) {
        const targetData = target.getData("itemData");

        if (targetData.type === "person") {
          const dist = Phaser.Math.Distance.Between(
            draggedItem.x,
            draggedItem.y,
            target.x,
            target.y,
          );

          if (dist < threshold) {
            // Mescla os dois!
            targetData.label = `${targetData.label} (${dragData.label})`;
            target.text.setText(targetData.label);

            // Adiciona um pequeno indicador visual de que ele absorveu algo
            const indicator = this.add
              .rectangle(0, -30, 20, 10, dragData.color)
              .setStrokeStyle(1, 0x000);
            target.add(indicator);

            // Destroi o item arrastado
            this.deleteCanvasItem(draggedItem);
            break;
          }
        }
      }
    }
  }
}

// --- VUE SHELL MOUNTING ---
onMounted(() => {
  const scene = new CharadeGameScene((sceneInstance) => {
    sceneInstance.loadLevel(currentCharade.value.library);
  });
  gameScene.value = scene;

  game.value = new Phaser.Game({
    type: Phaser.AUTO,
    parent: gameRoot.value,
    backgroundColor: "#f0f4f8",
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 600,
      height: 800,
    },
    scene,
  });
});

onBeforeUnmount(() => {
  game.value?.destroy(true);
  game.value = null;
  gameScene.value = null;
});

// Shell Actions
const checkAnswer = (suspect) => {
  if (suspect === currentCharade.value.answer) {
    hasWon.value = true;
    showLoss.value = false;
  } else {
    showLoss.value = true;
  }
};

const nextLevel = () => {
  hasWon.value = false;
  showLoss.value = false;
  if (currentLevel.value < charades.length - 1) {
    currentLevel.value++;
    if (gameScene.value) {
      gameScene.value.loadLevel(currentCharade.value.library);
    }
  } else {
    emit("back");
  }
};

const tryAgain = () => {
  showLoss.value = false;
};
</script>

<template>
  <main class="game-screen">
    <div class="ui-header">
      <button class="back-btn" @click="$emit('back')">← Voltar</button>
      <h2>{{ currentCharade.title }}</h2>
    </div>

    <div class="game-content">
      <!-- Phaser container -->
      <div class="canvas-container">
        <div ref="gameRoot" class="game-root" aria-label="Charade Game"></div>
      </div>

      <!-- Problem description and answers -->
      <div class="problem-panel">
        <div class="clue-box">
          <h3>Enunciado:</h3>
          <p class="clue-text" style="margin-bottom: 1rem">
            {{ currentCharade.statement }}
          </p>

          <h3>Pista:</h3>
          <p class="clue-text">{{ currentCharade.clue }}</p>
          <p v-if="currentCharade.rule" class="rule-text">
            <strong>Regra:</strong> {{ currentCharade.rule }}
          </p>
        </div>

        <div class="answer-box">
          <h3>Quem é o culpado?</h3>
          <div class="suspects-buttons">
            <button
              v-for="suspect in currentCharade.suspects"
              :key="suspect"
              class="suspect-btn"
              @click="checkAnswer(suspect)"
            >
              {{ suspect }}
            </button>
          </div>
        </div>
        <div class="instructions">
          <p>
            Dica: Arraste os itens da biblioteca para o canvas para ajudar a
            pensar!
          </p>
          <p>Para apagar, arraste para a lixeira no canto inferior direito.</p>
        </div>
      </div>
    </div>

    <!-- Win Overlay -->
    <div v-if="hasWon" class="overlay win-overlay">
      <h2>Correto! 🎉</h2>
      <p>Você desvendou o mistério!</p>
      <button class="action-button primary" @click="nextLevel">
        {{
          currentLevel < charades.length - 1 ? "Próximo Mistério" : "Finalizar"
        }}
      </button>
    </div>

    <!-- Loss Overlay -->
    <div v-if="showLoss" class="overlay loss-overlay">
      <h2>Incorreto! 🚨</h2>
      <p>Parece que esse não é o culpado. Revise as pistas!</p>
      <button class="action-button secondary" @click="tryAgain">
        Tentar Novamente
      </button>
    </div>
  </main>
</template>

<style scoped>
.game-screen {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  background-color: #f8fafc;
  color: #334155;
  font-family: sans-serif;
}

.ui-header {
  display: flex;
  align-items: center;
  padding: 1rem;
  background-color: #1e293b;
  color: #f8fafc;
  gap: 1rem;
}

.back-btn {
  background: none;
  border: 1px solid #cbd5e1;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.game-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.canvas-container {
  flex: 0 0 600px;
  border-right: 2px solid #cbd5e1;
  background-color: #f0f4f8;
  display: flex;
  justify-content: center;
}

.game-root {
  width: 600px;
  height: 800px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.problem-panel {
  flex: 1;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  overflow-y: auto;
}

.clue-box {
  background-color: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  border-left: 4px solid #3b82f6;
}

.clue-text {
  white-space: pre-line;
  font-size: 1.1rem;
  line-height: 1.6;
}

.rule-text {
  margin-top: 1rem;
  color: #ef4444;
}

.answer-box {
  background-color: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.suspects-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  flex-wrap: wrap;
}

.suspect-btn {
  padding: 0.75rem 1.5rem;
  font-size: 1.1rem;
  font-weight: bold;
  background-color: #e2e8f0;
  border: 2px solid #cbd5e1;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.suspect-btn:hover {
  background-color: #3b82f6;
  color: white;
  border-color: #2563eb;
}

.instructions {
  color: #64748b;
  font-size: 0.9rem;
}

.overlay {
  position: absolute;
  inset: 0;
  background-color: rgba(15, 23, 42, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  z-index: 10;
}

.win-overlay h2 {
  color: #4ade80;
  font-size: 2.5rem;
}
.loss-overlay h2 {
  color: #f87171;
  font-size: 2.5rem;
}

.action-button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  font-size: 1.1rem;
  cursor: pointer;
  margin-top: 1.5rem;
}

.action-button.primary {
  background-color: #22c55e;
  color: white;
}

.action-button.secondary {
  background-color: transparent;
  border: 2px solid #cbd5e1;
  color: white;
}
</style>
