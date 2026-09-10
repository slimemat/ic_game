import Phaser from "phaser";
import { COLORS, LEVEL_CONFIGS } from "../data/PatternRecognitionLevels";
import AudioManager from "../managers/AudioManager";

import connectAudio from "../../assets/audio/connect.mp3";
import errorAudio from "../../assets/audio/error.mp3";
import winAudio from "../../assets/audio/win.mp3";

export default class PatternRecognitionScene extends Phaser.Scene {
  constructor(onWinCallback, onErrorCallback) {
    super("PatternRecognitionScene");
    this.onWinCallback = onWinCallback;
    this.onErrorCallback = onErrorCallback;
  }

  preload() {
    this.load.audio("connect", connectAudio);
    this.load.audio("error", errorAudio);
    this.load.audio("win", winAudio);
  }

  create() {
    AudioManager.init(this);
    this.input.on("gameobjectdown", this.onObjectClicked, this);
    this.generateLevel();
  }

  generateLevel() {
    this.children.removeAll();

    const levelIdx = (this.registry.get("level") - 1) % LEVEL_CONFIGS.length;
    this.levelData = LEVEL_CONFIGS[levelIdx];
    this.currentOptionIndex = this.levelData.initialOptionIndex;

    this.optionBoxes = [];

    const totalItems = this.levelData.sequence.length + 1;
    const spacing = 600 / (totalItems + 1);
    const yPos = 350;

    this.levelData.sequence.forEach((itemVal, i) => {
      const x = spacing * (i + 1);
      this.createShape(x, yPos, itemVal, false);
    });

    this.ansX = spacing * totalItems;
    this.ansY = yPos;

    this.add
      .rectangle(this.ansX, this.ansY, 80, 80, COLORS.SLOT_BG)
      .setStrokeStyle(2, COLORS.SLOT_BORDER);
    this.questionMark = this.add
      .text(this.ansX, this.ansY, "?", { fontSize: "32px", fill: "#a0aec0" })
      .setOrigin(0.5);

    if (this.levelData.difficulty === 1) {
      this.setupDifficulty1Mechanics();
    } else {
      this.setupDifficulty2Mechanics();
    }
  }

  setupDifficulty1Mechanics() {
    this.questionMark.setVisible(false);
    this.answerShape = this.createShape(
      this.ansX,
      this.ansY,
      this.levelData.answerOptions[this.currentOptionIndex],
      true,
    );

    this.answerShape.setInteractive({ useHandCursor: true });
    this.answerShape.input.isCycleSlot = true;

    this.add
      .text(300, 200, "Qual é o próximo padrão?", {
        fontSize: "24px",
        fill: "#e2e8f0",
      })
      .setOrigin(0.5);
    this.add
      .text(this.ansX, this.ansY + 60, "Clique para\nmudar", {
        fontSize: "14px",
        fill: "#a0aec0",
        align: "center",
      })
      .setOrigin(0.5);
  }

  setupDifficulty2Mechanics() {
    this.answerShape = null;

    this.add
      .text(300, 150, "Selecione o próximo padrão", {
        fontSize: "24px",
        fill: "#e2e8f0",
      })
      .setOrigin(0.5);

    const optionsCount = this.levelData.answerOptions.length;
    const optionSpacing = 600 / (optionsCount + 1);
    const optionsY = 550;

    this.levelData.answerOptions.forEach((optVal, i) => {
      const optX = optionSpacing * (i + 1);

      const box = this.add
        .rectangle(optX, optionsY, 60, 60, COLORS.OPTION_BG)
        .setStrokeStyle(2, COLORS.OPTION_BORDER)
        .setInteractive({ useHandCursor: true });

      box.input.isOptionBox = true;
      box.input.optionIndex = i;
      this.optionBoxes.push(box);

      this.createShape(optX, optionsY, optVal, false);
    });
  }

  createShape(x, y, value, isInteractive) {
    let shape;
    if (this.levelData.type === "rotation") {
      shape = this.add.triangle(
        x,
        y,
        0,
        40,
        40,
        40,
        20,
        0,
        COLORS.SHAPE_DEFAULT,
      );
      shape.setAngle(value);
    } else if (this.levelData.type === "color") {
      shape = this.add.circle(x, y, 25, value);
    }
    return shape;
  }

  onObjectClicked(pointer, gameObject) {
    AudioManager.play("connect");

    // Feedback visual do clique
    if (gameObject.type !== "Text") {
      this.tweens.add({
        targets: gameObject,
        scaleX: 0.9,
        scaleY: 0.9,
        duration: 50,
        yoyo: true,
      });
    }

    if (this.levelData.difficulty === 1) {
      if (gameObject.input && gameObject.input.isCycleSlot) {
        this.currentOptionIndex =
          (this.currentOptionIndex + 1) % this.levelData.answerOptions.length;
        const newVal = this.levelData.answerOptions[this.currentOptionIndex];

        if (this.levelData.type === "rotation") {
          this.answerShape.setAngle(newVal);
        } else if (this.levelData.type === "color") {
          this.answerShape.setFillStyle(newVal);
        }
      }
    } else if (this.levelData.difficulty === 2) {
      if (gameObject.input && gameObject.input.isOptionBox) {
        this.currentOptionIndex = gameObject.input.optionIndex;

        this.optionBoxes.forEach((box, i) => {
          if (i === this.currentOptionIndex) {
            box.setStrokeStyle(3, COLORS.OPTION_BORDER_ACTIVE);
            box.setFillStyle(COLORS.SLOT_BG);
          } else {
            box.setStrokeStyle(2, COLORS.OPTION_BORDER);
            box.setFillStyle(COLORS.OPTION_BG);
          }
        });

        this.questionMark.setVisible(false);
        if (this.answerShape) {
          this.answerShape.destroy();
        }
        this.answerShape = this.createShape(
          this.ansX,
          this.ansY,
          this.levelData.answerOptions[this.currentOptionIndex],
          false,
        );
      }
    }
  }

  checkAnswer() {
    if (this.currentOptionIndex === -1) {
      AudioManager.play("error");
      this.cameras.main.shake(150, 0.01);
      if (this.onErrorCallback)
        this.onErrorCallback("Selecione uma opção antes de confirmar!");
      return;
    }

    if (this.currentOptionIndex === this.levelData.correctOptionIndex) {
      AudioManager.play("win");
      if (this.onWinCallback) this.onWinCallback();
    } else {
      AudioManager.play("error");
      this.cameras.main.shake(200, 0.015);
      if (this.onErrorCallback)
        this.onErrorCallback("Padrão incorreto! Observe com mais atenção.");
    }
  }

  resetLevel() {
    this.generateLevel();
  }
}
