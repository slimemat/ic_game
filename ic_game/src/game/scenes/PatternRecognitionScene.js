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
    const baseSize = Math.min(width, height);

    const levelIdx = (this.registry.get("level") - 1) % LEVEL_CONFIGS.length;
    this.levelData = LEVEL_CONFIGS[levelIdx];
    this.currentOptionIndex = this.levelData.initialOptionIndex;

    this.optionBoxes = [];

    const totalItems = this.levelData.sequence.length + 1;
    const spacing = width / (totalItems + 1);

    // Adjusted yPos higher up to give more room for options and buttons
    const yPos = height * 0.4;

    this.levelData.sequence.forEach((itemVal, i) => {
      const x = spacing * (i + 1);
      this.createShape(x, yPos, itemVal, baseSize);
    });

    this.ansX = spacing * totalItems;
    this.ansY = yPos;

    const slotSize = baseSize * 0.18;

    this.add
      .rectangle(this.ansX, this.ansY, slotSize, slotSize, COLORS.SLOT_BG)
      .setStrokeStyle(2, COLORS.SLOT_BORDER);
    this.questionMark = this.add
      .text(this.ansX, this.ansY, "?", {
        fontSize: `${baseSize * 0.06}px`,
        fill: "#a0aec0",
      })
      .setOrigin(0.5);

    if (this.levelData.difficulty === 1) {
      this.setupDifficulty1Mechanics(width, height, baseSize);
    } else {
      this.setupDifficulty2Mechanics(width, height, baseSize);
    }

    this.createConfirmButton(width, height, baseSize);
  }

  createConfirmButton(width, height, baseSize) {
    const btnWidth = Math.min(250, width * 0.7);
    const btnHeight = baseSize * 0.12;
    const btnX = width / 2;
    // Lowered slightly to use the vertical space
    const btnY = height * 0.88;

    const btnBg = this.add
      .rectangle(btnX, btnY, btnWidth, btnHeight, 0x48bb78)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, 0x2f855a);

    btnBg.input.isConfirmBtn = true;

    const btnText = this.add
      .text(btnX, btnY, t("global.buttons.confirm"), {
        fontSize: `${Math.min(24, baseSize * 0.05)}px`,
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

  setupDifficulty1Mechanics(width, height, baseSize) {
    this.questionMark.setVisible(false);
    this.answerShape = this.createShape(
      this.ansX,
      this.ansY,
      this.levelData.answerOptions[this.currentOptionIndex],
      baseSize,
    );

    this.answerShape.setInteractive({ useHandCursor: true });
    this.answerShape.input.isCycleSlot = true;

    const fontSize = Math.min(24, width * 0.06);

    this.add
      .text(width / 2, height * 0.2, t("pattern.question_diff_1"), {
        fontSize: `${fontSize}px`,
        fill: "#e2e8f0",
      })
      .setOrigin(0.5);

    this.add
      .text(
        this.ansX,
        this.ansY + baseSize * 0.12,
        t("pattern.click_to_change"),
        {
          fontSize: `${Math.max(12, baseSize * 0.03)}px`,
          fill: "#a0aec0",
          align: "center",
        },
      )
      .setOrigin(0.5);
  }

  setupDifficulty2Mechanics(width, height, baseSize) {
    this.answerShape = null;

    const fontSize = Math.min(24, width * 0.06);

    this.add
      .text(width / 2, height * 0.18, t("pattern.question_diff_2"), {
        fontSize: `${fontSize}px`,
        fill: "#e2e8f0",
      })
      .setOrigin(0.5);

    const optionsCount = this.levelData.answerOptions.length;
    const optionSpacing = width / (optionsCount + 1);
    const optionsY = height * 0.65;
    const boxSize = baseSize * 0.14;

    this.levelData.answerOptions.forEach((optVal, i) => {
      const optX = optionSpacing * (i + 1);

      const box = this.add
        .rectangle(optX, optionsY, boxSize, boxSize, COLORS.OPTION_BG)
        .setStrokeStyle(2, COLORS.OPTION_BORDER)
        .setInteractive({ useHandCursor: true });

      box.input.isOptionBox = true;
      box.input.optionIndex = i;
      this.optionBoxes.push(box);

      this.createShape(optX, optionsY, optVal, baseSize);
    });
  }

  createShape(x, y, value, baseSize) {
    let shape;
    const r = baseSize * 0.06; // ratio for radius

    if (this.levelData.type === "rotation") {
      // Create an isosceles triangle scaled by baseSize
      shape = this.add.triangle(
        x,
        y,
        0,
        r * 1.6,
        r * 1.6,
        r * 1.6,
        r * 0.8,
        0,
        COLORS.SHAPE_DEFAULT,
      );
      shape.setAngle(value);
    } else if (this.levelData.type === "color") {
      shape = this.add.circle(x, y, r, value);
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
        const baseSize = Math.min(this.scale.width, this.scale.height);
        this.answerShape = this.createShape(
          this.ansX,
          this.ansY,
          this.levelData.answerOptions[this.currentOptionIndex],
          baseSize,
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
