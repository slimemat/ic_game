import i18n from "../../i18n";
import Phaser from "phaser";
import AudioManager from "../managers/AudioManager";
import connectAudio from "../../assets/audio/connect.mp3";

export default class CharadeGameScene extends Phaser.Scene {
  constructor(onReady, checkAnswerCb) {
    super("CharadeGameScene");
    this.onReady = onReady;
    this.checkAnswerCb = checkAnswerCb;
    this.canvasItems = [];
    this.levelData = null;
    this.activeModal = null;
  }

  preload() {
    this.load.audio("connect", connectAudio);
  }

  create() {
    AudioManager.init(this);
    this.scale.on("resize", this.resize, this);
    this.setupUI();
    if (this.onReady) {
      this.onReady(this);
    }
  }

  resize(gameSize) {
    this.cameras.main.setViewport(0, 0, gameSize.width, gameSize.height);
    if (this.levelData) {
      this.loadLevel(this.levelData); // redraws everything with new dimensions
    }
  }

  setupUI() {
    this.cameras.main.setBackgroundColor("#f0f4f8");

    const width = this.scale.width;
    const height = this.scale.height;
    const baseSize = Math.min(width, height);

    // Trash area at top right
    const trashSize = Math.max(60, baseSize * 0.15);
    this.trashArea = this.add
      .rectangle(width, 0, trashSize, trashSize, 0xef4444, 0.2)
      .setOrigin(1, 0);

    this.trashIcon = this.add
      .text(width - trashSize / 2, trashSize * 0.4, "🗑️", {
        fontSize: `${trashSize * 0.4}px`,
      })
      .setOrigin(0.5);

    this.trashText = this.add
      .text(width - trashSize / 2, trashSize * 0.75, "Lixeira", {
        fontSize: `${Math.max(10, trashSize * 0.15)}px`,
        fill: "#ef4444",
      })
      .setOrigin(0.5);

    this.trashZone = this.add
      .zone(width - trashSize / 2, trashSize / 2, trashSize, trashSize)
      .setRectangleDropZone(trashSize, trashSize);

    // Setup input events (only once)
    if (!this.input.eventNames().includes("dragstart")) {
      this.input.on("dragstart", (pointer, gameObject) => {
        if (!gameObject.isModalEl) {
          this.children.bringToTop(gameObject);
          AudioManager.play("connect", { volume: 0.5 });
        }
      });

      this.input.on("drag", (pointer, gameObject, dragX, dragY) => {
        if (!gameObject.isModalEl) {
          gameObject.x = dragX;
          gameObject.y = dragY;
        }
      });

      this.input.on("drop", (pointer, gameObject, dropZone) => {
        if (dropZone === this.trashZone && !gameObject.isModalEl) {
          this.deleteCanvasItem(gameObject);
        }
      });

      this.input.on("dragend", (pointer, gameObject, dropped) => {
        if (!dropped && !gameObject.isModalEl) {
          this.checkCombination(gameObject);
        }
      });
    }
  }

  loadLevel(levelData) {
    this.levelData = levelData;
    this.children.removeAll();
    this.canvasItems = [];
    this.activeModal = null;
    this.setupUI();

    const libraryData = levelData.library;
    const width = this.scale.width;
    const height = this.scale.height;
    const baseSize = Math.min(width, height);

    // --- Dock (Library at bottom) ---
    const dockHeight = Math.max(80, height * 0.15);
    const dockY = height - dockHeight / 2;

    this.add
      .rectangle(
        width / 2,
        height - dockHeight / 2,
        width,
        dockHeight,
        0xe2e8f0,
      )
      .setStrokeStyle(2, 0xcbd5e1);

    const itemWidth = width / (libraryData.length + 1);

    libraryData.forEach((item, index) => {
      const x = itemWidth * (index + 1);
      const y = dockY;

      const hitArea = this.add
        .rectangle(x, y, itemWidth * 0.8, dockHeight * 0.8, 0x000000, 0)
        .setInteractive({ useHandCursor: true });

      const size = item.type === "person" ? baseSize * 0.08 : baseSize * 0.05;

      this.add
        .rectangle(x, y - dockHeight * 0.15, size, size, item.color)
        .setStrokeStyle(2, 0x334155);

      this.add
        .text(x, y + dockHeight * 0.25, item.label, {
          fontSize: `${Math.max(10, baseSize * 0.03)}px`,
          fill: "#334155",
          wordWrap: { width: itemWidth * 0.9, useAdvancedWrap: true },
          align: "center",
        })
        .setOrigin(0.5);

      hitArea.on("pointerdown", () => {
        if (!this.activeModal) {
          this.spawnCanvasItem(item);
        }
      });
    });

    // --- Context Icons (Above Dock) ---
    const iconY = height - dockHeight - baseSize * 0.1;

    // Paper Icon (Left)
    const paperIconX = width * 0.2;
    const paperBg = this.add
      .circle(paperIconX, iconY, baseSize * 0.08, 0xffffff)
      .setStrokeStyle(2, 0xcbd5e1)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(paperIconX, iconY, "📝", { fontSize: `${baseSize * 0.07}px` })
      .setOrigin(0.5);
    this.add
      .text(paperIconX, iconY + baseSize * 0.1, "Enunciado", {
        fontSize: `${Math.max(12, baseSize * 0.03)}px`,
        fill: "#334155",
      })
      .setOrigin(0.5);

    paperBg.on("pointerdown", () => this.showPaperModal());

    // Lightbulb Icon (Right)
    const bulbIconX = width * 0.8;
    const bulbBg = this.add
      .circle(bulbIconX, iconY, baseSize * 0.08, 0xffffff)
      .setStrokeStyle(2, 0xcbd5e1)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(bulbIconX, iconY, "💡", { fontSize: `${baseSize * 0.07}px` })
      .setOrigin(0.5);
    this.add
      .text(bulbIconX, iconY + baseSize * 0.1, "Dica", {
        fontSize: `${Math.max(12, baseSize * 0.03)}px`,
        fill: "#334155",
      })
      .setOrigin(0.5);

    bulbBg.on("pointerdown", () => this.showClueModal());
  }

  showPaperModal() {
    if (this.activeModal) return;

    const width = this.scale.width;
    const height = this.scale.height;
    const baseSize = Math.min(width, height);

    this.activeModal = this.add.container(width / 2, height / 2);

    const bgWidth = Math.min(width * 0.9, 400);
    const bgHeight = Math.min(height * 0.8, 600);

    // Overlay
    const overlay = this.add
      .rectangle(0, 0, width * 2, height * 2, 0x000000, 0.6)
      .setInteractive();

    // Modal Box
    const bg = this.add
      .rectangle(0, 0, bgWidth, bgHeight, 0xffffff)
      .setStrokeStyle(4, 0x3b82f6)
      .setInteractive(); // Blocks clicks to background

    const closeBtn = this.add
      .text(bgWidth / 2 - 20, -bgHeight / 2 + 20, "X", {
        fontSize: "24px",
        fill: "#ef4444",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    closeBtn.on("pointerdown", () => {
      this.activeModal.destroy();
      this.activeModal = null;
    });

    // Content
    const title = this.add
      .text(0, -bgHeight / 2 + 40, "Enunciado", {
        fontSize: `${Math.max(20, baseSize * 0.05)}px`,
        fill: "#0f172a",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const statement = this.add
      .text(0, -bgHeight / 2 + 100, this.levelData.statement, {
        fontSize: `${Math.max(16, baseSize * 0.04)}px`,
        fill: "#334155",
        wordWrap: { width: bgWidth * 0.8 },
      })
      .setOrigin(0.5, 0);

    const suspectTitleY = -bgHeight / 2 + 100 + statement.height + 40;
    const suspectTitle = this.add
      .text(0, suspectTitleY, "Quem é o culpado?", {
        fontSize: `${Math.max(18, baseSize * 0.045)}px`,
        fill: "#0f172a",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.activeModal.add([
      overlay,
      bg,
      closeBtn,
      title,
      statement,
      suspectTitle,
    ]);

    // Suspect Buttons
    let currentY = suspectTitleY + 40;
    this.levelData.suspects.forEach((suspect) => {
      const btnBg = this.add
        .rectangle(
          0,
          currentY,
          bgWidth * 0.7,
          Math.max(40, baseSize * 0.08),
          0xeff6ff,
        )
        .setStrokeStyle(2, 0x3b82f6)
        .setInteractive({ useHandCursor: true });

      const btnText = this.add
        .text(0, currentY, suspect, {
          fontSize: `${Math.max(16, baseSize * 0.04)}px`,
          fill: "#1e3a8a",
          fontStyle: "bold",
        })
        .setOrigin(0.5);

      btnBg.on("pointerdown", () => {
        AudioManager.play("connect");
        if (this.checkAnswerCb) {
          this.checkAnswerCb(suspect);
        }
        this.activeModal.destroy();
        this.activeModal = null;
      });

      this.activeModal.add([btnBg, btnText]);
      currentY += Math.max(50, baseSize * 0.1);
    });

    this.activeModal.setDepth(100);
  }

  showClueModal() {
    if (this.activeModal) return;

    const width = this.scale.width;
    const height = this.scale.height;
    const baseSize = Math.min(width, height);

    this.activeModal = this.add.container(width / 2, height / 2);

    const bgWidth = Math.min(width * 0.8, 350);
    const bgHeight = Math.min(height * 0.6, 400);

    // Overlay
    const overlay = this.add
      .rectangle(0, 0, width * 2, height * 2, 0x000000, 0.6)
      .setInteractive();

    // Modal Box
    const bg = this.add
      .rectangle(0, 0, bgWidth, bgHeight, 0xfef9c3)
      .setStrokeStyle(4, 0xeab308)
      .setInteractive();

    const closeBtn = this.add
      .text(bgWidth / 2 - 20, -bgHeight / 2 + 20, "X", {
        fontSize: "24px",
        fill: "#ef4444",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    closeBtn.on("pointerdown", () => {
      this.activeModal.destroy();
      this.activeModal = null;
    });

    // Content
    const title = this.add
      .text(0, -bgHeight / 2 + 40, "Dica & Regra", {
        fontSize: `${Math.max(20, baseSize * 0.05)}px`,
        fill: "#854d0e",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const clue = this.add
      .text(0, -bgHeight / 2 + 90, this.levelData.clue, {
        fontSize: `${Math.max(16, baseSize * 0.04)}px`,
        fill: "#3f6212",
        wordWrap: { width: bgWidth * 0.8 },
      })
      .setOrigin(0.5, 0);

    this.activeModal.add([overlay, bg, closeBtn, title, clue]);

    if (this.levelData.rule) {
      const ruleY = -bgHeight / 2 + 90 + clue.height + 30;
      const ruleBg = this.add
        .rectangle(
          0,
          ruleY + 20,
          bgWidth * 0.8,
          Math.max(60, baseSize * 0.12),
          0xfef2f2,
        )
        .setOrigin(0.5);
      const ruleText = this.add
        .text(0, ruleY + 20, `Regra: ${this.levelData.rule}`, {
          fontSize: `${Math.max(14, baseSize * 0.035)}px`,
          fill: "#b91c1c",
          fontStyle: "bold",
          wordWrap: { width: bgWidth * 0.7 },
        })
        .setOrigin(0.5);

      this.activeModal.add([ruleBg, ruleText]);
    }

    this.activeModal.setDepth(100);
  }

  spawnCanvasItem(data) {
    const width = this.scale.width;
    const height = this.scale.height;
    const baseSize = Math.min(width, height);

    const randomOffsetX = Phaser.Math.Between(-30, 30);
    const randomOffsetY = Phaser.Math.Between(-30, 30);

    // Spawn nos 40% superiores da tela, centro
    const x = width / 2 + randomOffsetX;
    const y = height * 0.3 + randomOffsetY;

    const container = this.add.container(x, y);
    container.setData("itemData", { ...data });

    const size = data.type === "person" ? baseSize * 0.15 : baseSize * 0.1;

    const bg = this.add
      .rectangle(0, 0, size, size, data.color)
      .setStrokeStyle(2, 0x334155);

    const text = this.add
      .text(0, size / 2 + baseSize * 0.03, data.label, {
        fontSize: `${Math.max(12, baseSize * 0.03)}px`,
        fill: "#0f172a",
        backgroundColor: "#ffffffaa",
        padding: { x: 4, y: 2 },
      })
      .setOrigin(0.5, 0);

    container.add([bg, text]);
    container.setSize(size, size + 20);
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

    if (dragData.type === "person") return;

    const threshold = this.scale.width * 0.15; // relative threshold

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
            AudioManager.play("connect");

            targetData.label = `${targetData.label} (${dragData.label})`;
            target.text.setText(targetData.label);

            const indicator = this.add
              .rectangle(0, -target.bg.height / 2 - 10, 20, 10, dragData.color)
              .setStrokeStyle(1, 0x000);
            target.add(indicator);

            this.deleteCanvasItem(draggedItem);
            break;
          }
        }
      }
    }
  }
}
