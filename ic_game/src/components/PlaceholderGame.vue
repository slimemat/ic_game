<script setup>
import { onBeforeUnmount, onMounted, ref, shallowRef } from "vue";
import Phaser from "phaser";

// Adjust these extensions (.mp3, .wav, .ogg) based on your actual files in src/assets/
import connectAudio from "../assets/connect.mp3";
import errorAudio from "../assets/error.mp3";
import winAudio from "../assets/win.mp3";

const emit = defineEmits(["back"]);

// Vue State
const gameRoot = ref(null);
const game = shallowRef(null);
const gameScene = shallowRef(null);
const hasWon = ref(false);
const currentLevel = ref(1);

// --- DOMAIN LOGIC: Math & Intersection ---
const orientation = (p, q, r) => {
  const val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
  if (val === 0) return 0;
  return val > 0 ? 1 : 2;
};

const onSegment = (p, q, r) => {
  return (
    q.x <= Math.max(p.x, r.x) &&
    q.x >= Math.min(p.x, r.x) &&
    q.y <= Math.max(p.y, r.y) &&
    q.y >= Math.min(p.y, r.y)
  );
};

const doSegmentsIntersect = (p1, q1, p2, q2) => {
  const o1 = orientation(p1, q1, p2);
  const o2 = orientation(p1, q1, q2);
  const o3 = orientation(p2, q2, p1);
  const o4 = orientation(p2, q2, q1);

  if (o1 !== o2 && o3 !== o4) return true;
  if (o1 === 0 && onSegment(p1, p2, q1)) return true;
  if (o2 === 0 && onSegment(p1, q2, q1)) return true;
  if (o3 === 0 && onSegment(p2, p1, q2)) return true;
  if (o4 === 0 && onSegment(p2, q1, q2)) return true;

  return false;
};

const checkIntersection = (newLine, existingLines) => {
  for (const line of existingLines) {
    if (
      newLine.a.index === line.a.index ||
      newLine.a.index === line.b.index ||
      newLine.b.index === line.a.index ||
      newLine.b.index === line.b.index
    ) {
      continue;
    }
    if (doSegmentsIntersect(newLine.a, newLine.b, line.a, line.b)) {
      return true;
    }
  }
  return false;
};

// --- PHASER SCENE ---
class DotsLogicScene extends Phaser.Scene {
  constructor(onWinCallback) {
    super("DotsLogicScene");
    this.onWinCallback = onWinCallback;
    this.dots = [];
    this.path = [];
    this.dotCount = 5;
    this.isDragging = false;
  }

  preload() {
    // Load audio assets mapped from Vite
    this.load.audio("connect", connectAudio);
    this.load.audio("error", errorAudio);
    this.load.audio("win", winAudio);
  }

  create() {
    // Create graphics and set explicit depths to guarantee they render
    this.pathGraphics = this.add.graphics().setDepth(0);
    this.tempGraphics = this.add.graphics().setDepth(1);

    this.generateLevel();

    this.input.on("pointerdown", this.onPointerDown, this);
    this.input.on("pointermove", this.onPointerMove, this);
    this.input.on("pointerup", this.onPointerUp, this);
  }

  generateLevel() {
    // Clean up previous level's dots properly without destroying graphics
    this.dots.forEach((d) => {
      if (d.sprite) d.sprite.destroy();
    });
    this.dots = [];
    this.path = [];
    this.pathGraphics.clear();
    this.tempGraphics.clear();

    this.dotCount = Math.min(4 + this.registry.get("level"), 12);

    const padding = 60;
    let attempts = 0;

    while (this.dots.length < this.dotCount && attempts < 1000) {
      attempts++;
      const x = Phaser.Math.Between(padding, 600 - padding);
      const y = Phaser.Math.Between(padding, 800 - padding);
      let valid = true;

      for (const dot of this.dots) {
        if (Phaser.Math.Distance.Between(x, y, dot.x, dot.y) < 120) {
          valid = false;
          break;
        }
      }

      if (valid) {
        // Dots sit above the path lines
        const sprite = this.add
          .circle(x, y, 20, 0x4a5568)
          .setInteractive()
          .setDepth(2);
        // Add a subtle border/stroke to make them look clickable without numbers
        sprite.setStrokeStyle(4, 0x2d3748);
        this.dots.push({ x, y, sprite, index: this.dots.length });
      }
    }
  }

  onPointerDown(pointer) {
    if (this.path.length === this.dotCount) return;

    const hoveredDot = this.dots.find(
      (d) => Phaser.Math.Distance.Between(pointer.x, pointer.y, d.x, d.y) < 45,
    );

    if (hoveredDot) {
      this.isDragging = true;
      if (
        this.path.length === 0 ||
        this.path[this.path.length - 1] !== hoveredDot.index
      ) {
        this.path = [hoveredDot.index];
        this.redrawPath();
        this.sound.play("connect", { volume: 0.5 });
      }
    }
  }

  onPointerMove(pointer) {
    if (!this.isDragging || this.path.length === 0) return;

    const lastDotIndex = this.path[this.path.length - 1];
    const lastDot = this.dots[lastDotIndex];

    // Constantly update the line from the last dot to your finger
    this.tempGraphics.clear();
    this.tempGraphics.lineStyle(6, 0xa0aec0, 0.6);
    this.tempGraphics.lineBetween(lastDot.x, lastDot.y, pointer.x, pointer.y);

    const hoveredDot = this.dots.find(
      (d) => Phaser.Math.Distance.Between(pointer.x, pointer.y, d.x, d.y) < 45,
    );

    if (hoveredDot && hoveredDot.index !== lastDotIndex) {
      this.tryConnect(hoveredDot.index);
    }
  }

  onPointerUp() {
    this.isDragging = false;
    this.tempGraphics.clear();
  }

  tryConnect(newIndex) {
    if (this.path.includes(newIndex)) return;

    const a = this.dots[this.path[this.path.length - 1]];
    const b = this.dots[newIndex];

    const existingLines = [];
    for (let i = 0; i < this.path.length - 1; i++) {
      existingLines.push({
        a: this.dots[this.path[i]],
        b: this.dots[this.path[i + 1]],
      });
    }

    if (!checkIntersection({ a, b }, existingLines)) {
      this.path.push(newIndex);
      this.redrawPath();
      this.sound.play("connect"); // Play on success

      if (this.path.length === this.dotCount) {
        this.isDragging = false;
        this.tempGraphics.clear();
        this.redrawPath(true);
        this.sound.play("win");
        this.onWinCallback();
      }
    } else {
      this.sound.play("error"); // Play on fail
      this.cameras.main.shake(150, 0.01);
      this.isDragging = false;
      this.tempGraphics.clear();
    }
  }

  redrawPath(isWin = false) {
    this.pathGraphics.clear();
    this.pathGraphics.lineStyle(8, isWin ? 0x48bb78 : 0x63b3ed, 1);

    this.dots.forEach((d) => d.sprite.setFillStyle(0x4a5568));

    if (this.path.length === 0) return;

    this.pathGraphics.beginPath();
    this.pathGraphics.moveTo(
      this.dots[this.path[0]].x,
      this.dots[this.path[0]].y,
    );
    this.dots[this.path[0]].sprite.setFillStyle(isWin ? 0x48bb78 : 0x63b3ed);

    for (let i = 1; i < this.path.length; i++) {
      const dot = this.dots[this.path[i]];
      this.pathGraphics.lineTo(dot.x, dot.y);
      dot.sprite.setFillStyle(isWin ? 0x48bb78 : 0x63b3ed);
    }
    this.pathGraphics.strokePath();
  }

  resetLevel() {
    this.path = [];
    this.isDragging = false;
    this.tempGraphics.clear();
    this.redrawPath();
  }
}

// --- VUE SHELL MOUNTING ---
onMounted(() => {
  const handleWin = () => {
    hasWon.value = true;
  };

  const scene = new DotsLogicScene(handleWin);
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
  <main class="dots-game-screen">
    <!-- Phaser container -->
    <div
      ref="gameRoot"
      class="game-root"
      aria-label="Non-intersecting dots game"
    ></div>

    <!-- External UI Shell -->
    <div class="ui-controls">
      <div class="level-indicator">Level {{ currentLevel }}</div>
      <div class="button-group">
        <button class="action-button" type="button" @click="resetGame">
          Restart Line
        </button>
        <button
          class="action-button secondary"
          type="button"
          @click="$emit('back')"
        >
          Back
        </button>
      </div>
    </div>

    <!-- Win Overlay -->
    <div v-if="hasWon" class="win-overlay">
      <h2>Path Complete!</h2>
      <p>No intersecting lines.</p>
      <button class="action-button primary" @click="nextLevel">
        Next Puzzle
      </button>
    </div>
  </main>
</template>

<style scoped>
.dots-game-screen {
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
