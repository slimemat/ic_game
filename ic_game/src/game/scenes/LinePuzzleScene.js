import Phaser from "phaser";
import AudioManager from "../managers/AudioManager";
import connectAudio from "../../assets/audio/connect.mp3";
import errorAudio from "../../assets/audio/error.mp3";
import winAudio from "../../assets/audio/win.mp3";

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

export default class LinePuzzleScene extends Phaser.Scene {
  constructor(onWinCallback, onErrorCallback) {
    super("DotsLogicScene");
    this.onWinCallback = onWinCallback;
    this.onErrorCallback = onErrorCallback;
    this.dots = [];
    this.path = [];
    this.dotCount = 5;
    this.isDragging = false;
  }

  preload() {
    this.load.audio("connect", connectAudio);
    this.load.audio("error", errorAudio);
    this.load.audio("win", winAudio);
  }

  create() {
    AudioManager.init(this);
    this.pathGraphics = this.add.graphics().setDepth(0);
    this.tempGraphics = this.add.graphics().setDepth(1);

    this.generateLevel();

    this.input.on("pointerdown", this.onPointerDown, this);
    this.input.on("pointermove", this.onPointerMove, this);
    this.input.on("pointerup", this.onPointerUp, this);
  }

  generateLevel() {
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
        const sprite = this.add
          .circle(x, y, 20, 0x4a5568)
          .setInteractive()
          .setDepth(2);
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
        AudioManager.play("connect", { volume: 0.5 });
      }
    }
  }

  onPointerMove(pointer) {
    if (!this.isDragging || this.path.length === 0) return;

    const lastDotIndex = this.path[this.path.length - 1];
    const lastDot = this.dots[lastDotIndex];

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
      AudioManager.play("connect");

      if (this.path.length === this.dotCount) {
        this.isDragging = false;
        this.tempGraphics.clear();
        this.redrawPath(true);
        AudioManager.play("win");
        if (this.onWinCallback) this.onWinCallback();
      }
    } else {
      AudioManager.play("error");
      this.cameras.main.shake(150, 0.01);
      this.isDragging = false;
      this.tempGraphics.clear();
      if (this.onErrorCallback)
        this.onErrorCallback("Linhas não podem se cruzar!");
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
