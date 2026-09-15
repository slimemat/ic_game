import Phaser from "phaser";
import { COLORS, LEVEL_CONFIGS } from "../data/PatternRecognitionLevels";
import AudioManager from "../managers/AudioManager";
import i18n from "../../i18n";

import connectAudio from "../../assets/audio/connect.mp3";
import errorAudio from "../../assets/audio/error.mp3";
import winAudio from "../../assets/audio/win.mp3";

const t = i18n.global.t;

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

    this.scale.on("resize", this.resize, this);
    this.generateLevel();
  }

  resize(gameSize, baseSize, displaySize, resolution) {
    this.cameras.main.setViewport(0, 0, gameSize.width, gameSize.height);
    this.generateLevel();
  }

  generateLevel() {
    this.children.removeAll();

    const width = this.scale.width;
    const height = this.scale.height;

    const levelIdx = (this.registry.get("level") - 1) % LEVEL_CONFIGS.length;
    this.levelData = LEVEL_CONFIGS[levelIdx];
    this.currentOptionIndex = this.levelData.initialOptionIndex;

    this.optionBoxes = [];

    const totalItems = this.levelData.sequence.length + 1;
    const spacing = width / (totalItems + 1);
    const yPos = height * 0.45;

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
      this.setupDifficulty1Mechanics(width, height);
    } else {
      this.setupDifficulty2Mechanics(width, height);
    }

    this.createConfirmButton(width, height);
  }

  createConfirmButton(width, height) {
    const btnWidth = Math.min(200, width * 0.6);
    const btnHeight = 50;
    const btnX = width / 2;
    const btnY = height * 0.85;

    const btnBg = this.add
      .rectangle(btnX, btnY, btnWidth, btnHeight, 0x48bb78)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, 0x2f855a);

    btnBg.input.isConfirmBtn = true;

    const btnText = this.add
      .text(btnX, btnY, t("global.buttons.confirm"), {
        fontSize: "20px",
        fill: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // Add visual feedback to button
    btnBg.on("pointerdown", () => {
      btnBg.setFillStyle(0x38a169);
      btnText.setY(btnY + 2);
    });
    btnBg.on("pointerup", () => {
      btnBg.setFillStyle(0x48bb78);
      btnText.setY(btnY);
    });
    btnBg.on("pointerout", () => {
      btnBg.setFillStyle(0x48bb78);
      btnText.setY(btnY);
    });
  }

  setupDifficulty1Mechanics(width, height) {
    this.questionMark.setVisible(false);
    this.answerShape = this.createShape(
      this.ansX,
      this.ansY,
      this.levelData.answerOptions[this.currentOptionIndex],
      true,
    );

    this.answerShape.setInteractive({ useHandCursor: true });
    this.answerShape.input.isCycleSlot = true;

    const fontSize = Math.min(24, width * 0.05);

    this.add
      .text(width / 2, height * 0.25, t("pattern.question_diff_1"), {
        fontSize: `${fontSize}px`,
        fill: "#e2e8f0",
      })
      .setOrigin(0.5);

    this.add
      .text(this.ansX, this.ansY + 60, t("pattern.click_to_change"), {
        fontSize: "14px",
        fill: "#a0aec0",
        align: "center",
      })
      .setOrigin(0.5);
  }

  setupDifficulty2Mechanics(width, height) {
    this.answerShape = null;

    const fontSize = Math.min(24, width * 0.05);

    this.add
      .text(width / 2, height * 0.2, t("pattern.question_diff_2"), {
        fontSize: `${fontSize}px`,
        fill: "#e2e8f0",
      })
      .setOrigin(0.5);

    const optionsCount = this.levelData.answerOptions.length;
    const optionSpacing = width / (optionsCount + 1);
    const optionsY = height * 0.65;

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
    if (gameObject.type !== "Text" && !gameObject.input?.isConfirmBtn) {
      this.tweens.add({
        targets: gameObject,
        scaleX: 0.9,
        scaleY: 0.9,
        duration: 50,
        yoyo: true,
      });
    }

    if (gameObject.input && gameObject.input.isConfirmBtn) {
      this.checkAnswer();
      return;
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
        this.onErrorCallback(t("pattern.err_select_first"));
      return;
    }

    if (this.currentOptionIndex === this.levelData.correctOptionIndex) {
      AudioManager.play("win");
      if (this.onWinCallback) this.onWinCallback();
    } else {
      AudioManager.play("error");
      this.cameras.main.shake(200, 0.015);
      if (this.onErrorCallback)
        this.onErrorCallback(t("pattern.err_incorrect"));
    }
  }

  resetLevel() {
    this.generateLevel();
  }
}
