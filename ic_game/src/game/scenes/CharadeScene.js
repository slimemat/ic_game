import Phaser from "phaser";
import AudioManager from "../managers/AudioManager";
import connectAudio from "../../assets/audio/connect.mp3";

export default class CharadeGameScene extends Phaser.Scene {
  constructor(onReady) {
    super("CharadeGameScene");
    this.onReady = onReady;
    this.canvasItems = [];
  }

  preload() {
    this.load.audio("connect", connectAudio);
  }

  create() {
    AudioManager.init(this);
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
      AudioManager.play("connect", { volume: 0.5 }); // Feedback ao pegar
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
    container.setData("itemData", { ...data });

    const size = data.type === "person" ? 60 : 40;

    const bg = this.add
      .rectangle(0, 0, size, size, data.color)
      .setStrokeStyle(2, 0x334155);

    const text = this.add
      .text(0, size / 2 + 10, data.label, {
        fontSize: "14px",
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
            AudioManager.play("connect");

            targetData.label = `${targetData.label} (${dragData.label})`;
            target.text.setText(targetData.label);

            const indicator = this.add
              .rectangle(0, -30, 20, 10, dragData.color)
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
