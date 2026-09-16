import i18n from "../../i18n";
import Phaser from "phaser";
import { LEVELS, COLORS } from "../data/MatrixMirrorLevels";
import AudioManager from "../managers/AudioManager";

import connectAudio from "../../assets/audio/connect.mp3";
import errorAudio from "../../assets/audio/error.mp3";
import winAudio from "../../assets/audio/win.mp3";

const t = i18n.global.t;

export default class MatrixMirrorScene extends Phaser.Scene {
  constructor(onMatchUpdate, onWin) {
    super("MatrixGameScene");
    this.onMatchUpdate = onMatchUpdate;
    this.onWinCallback = onWin;
    this.playerMatrix = [];
    this.originalContainer = null;
    this.playerContainer = null;
    this.interactiveBlocks = [];
    this.isAnimating = false;
    this.correctBlocks = 0;
    this.totalBlocks = 0;
    this.syncText = null;
  }

  preload() {
    this.load.audio("connect", connectAudio);
    this.load.audio("error", errorAudio);
    this.load.audio("win", winAudio);
  }

  create() {
    AudioManager.init(this);

    this.scale.on("resize", this.resize, this);
    this.generateVisuals();
  }

  resize(gameSize) {
    this.cameras.main.setViewport(0, 0, gameSize.width, gameSize.height);
    this.generateVisuals();
  }

  generateVisuals() {
    this.isAnimating = false;

    if (this.originalContainer) this.originalContainer.destroy(true);
    if (this.playerContainer) this.playerContainer.destroy(true);
    if (this.titleLeft) this.titleLeft.destroy(true);
    if (this.titleRight) this.titleRight.destroy(true);
    if (this.syncText) this.syncText.destroy(true);
    if (this.clearBtn) this.clearBtn.destroy(true);
    if (this.clearText) this.clearText.destroy(true);

    this.interactiveBlocks = [];

    const levelData = LEVELS[(this.registry.get("level") - 1) % LEVELS.length];
    const is2D = levelData.dimensions.rows > 1;

    this.playerMatrix = [];
    for (let r = 0; r < levelData.dimensions.rows; r++) {
      if (is2D) {
        this.playerMatrix.push(new Array(levelData.dimensions.cols).fill(0));
      }
    }
    if (!is2D) {
      this.playerMatrix = new Array(levelData.dimensions.cols).fill(0);
    }

    const width = this.scale.width;
    const height = this.scale.height;
    const baseSize = Math.min(width, height);

    const centerX = width / 2;
    // Posições Verticais (Top/Bottom) em vez de Side-by-Side
    const topY = height * 0.3;
    const bottomY = height * 0.7;

    // Calcula tamanho do bloco baseado no maximo de colunas para caber na tela
    const maxCols = Math.max(
      levelData.dimensions.cols,
      levelData.dimensions.rows,
    );
    const spacing = (baseSize * 0.7) / maxCols;
    const blockSize = spacing * 0.85;

    this.originalContainer = this.add.container(centerX, topY);
    this.playerContainer = this.add.container(centerX, bottomY);

    const titleFontSize = Math.max(16, baseSize * 0.04);

    this.titleLeft = this.add
      .text(
        centerX,
        topY - (spacing * levelData.dimensions.rows) / 2 - 30,
        t("canvas.matrix.original"),
        { fontSize: `${titleFontSize}px`, fill: "#e2e8f0", fontStyle: "bold" },
      )
      .setOrigin(0.5);
    this.titleRight = this.add
      .text(
        centerX,
        bottomY - (spacing * levelData.dimensions.rows) / 2 - 30,
        t("canvas.matrix.mirror"),
        { fontSize: `${titleFontSize}px`, fill: "#e2e8f0", fontStyle: "bold" },
      )
      .setOrigin(0.5);

    this.drawMatrix(
      this.originalContainer,
      levelData.input,
      levelData.dimensions,
      blockSize,
      spacing,
      false,
    );

    this.drawMatrix(
      this.playerContainer,
      this.playerMatrix,
      levelData.dimensions,
      blockSize,
      spacing,
      true,
    );

    // Texto de Sync (Progresso)
    this.syncText = this.add
      .text(centerX, height * 0.08, "", {
        fontSize: `${Math.max(18, baseSize * 0.05)}px`,
        fill: "#e2e8f0",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // Botão Limpar Matriz
    const btnWidth = Math.min(250, width * 0.6);
    const btnHeight = baseSize * 0.1;
    const btnY = height * 0.92;

    this.clearBtn = this.add
      .rectangle(centerX, btnY, btnWidth, btnHeight, 0x4a5568)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, 0x2d3748);

    this.clearText = this.add
      .text(centerX, btnY, t("matrix.clear_matrix"), {
        fontSize: `${Math.max(16, baseSize * 0.04)}px`,
        fill: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.clearBtn.on("pointerdown", () => {
      AudioManager.play("connect");
      this.clearBtn.setFillStyle(0x2d3748);
      this.clearText.setY(btnY + 2);
    });
    this.clearBtn.on("pointerup", () => {
      this.clearBtn.setFillStyle(0x4a5568);
      this.clearText.setY(btnY);
      if (!this.isAnimating) this.generateVisuals();
    });
    this.clearBtn.on("pointerout", () => {
      this.clearBtn.setFillStyle(0x4a5568);
      this.clearText.setY(btnY);
    });

    this.checkMatches(true);
  }

  drawMatrix(container, matrix, dims, blockSize, spacing, isInteractive) {
    const is2D = dims.rows > 1;

    const totalWidth = dims.cols * spacing;
    const totalHeight = dims.rows * spacing;

    const startX = -(totalWidth / 2) + spacing / 2;
    const localStartY = -(totalHeight / 2) + spacing / 2;

    for (let r = 0; r < dims.rows; r++) {
      for (let c = 0; c < dims.cols; c++) {
        const val = is2D ? matrix[r][c] : matrix[c];

        let color = COLORS.OFF;
        let textColor = COLORS.TEXT_OFF;
        if (val === 1) {
          color = isInteractive ? COLORS.ON_PLAYER : COLORS.ON_ORIGINAL;
          textColor = isInteractive
            ? COLORS.TEXT_ON_PLAYER
            : COLORS.TEXT_ON_ORIGINAL;
        }

        const x = startX + c * spacing;
        const y = localStartY + r * spacing;

        const rect = this.add
          .rectangle(x, y, blockSize, blockSize, color)
          .setStrokeStyle(3, COLORS.BORDER);

        const coordText = `${r + 1},${c + 1}`;
        const q = this.add
          .text(x, y, coordText, {
            fill: textColor,
            fontSize: `${Math.max(10, blockSize * 0.3)}px`,
            fontStyle: "bold",
          })
          .setOrigin(0.5);

        container.add([rect, q]);

        if (isInteractive) {
          const blockData = { r, c, rect, textObj: q };
          rect.setInteractive({ useHandCursor: true });
          rect.on("pointerdown", () => this.handleBlockClick(blockData));
          this.interactiveBlocks.push(blockData);
        }
      }
    }
  }

  handleBlockClick(blockData) {
    if (this.isAnimating) return;

    AudioManager.play("connect");

    const { r, c, rect, textObj } = blockData;
    const levelData = LEVELS[(this.registry.get("level") - 1) % LEVELS.length];
    const is2D = levelData.dimensions.rows > 1;

    let currentVal = is2D ? this.playerMatrix[r][c] : this.playerMatrix[c];
    let newVal = currentVal === 0 ? 1 : 0;

    if (is2D) {
      this.playerMatrix[r][c] = newVal;
    } else {
      this.playerMatrix[c] = newVal;
    }

    const color = newVal === 1 ? COLORS.ON_PLAYER : COLORS.OFF;
    const textColor = newVal === 1 ? COLORS.TEXT_ON_PLAYER : COLORS.TEXT_OFF;

    rect.setFillStyle(color);
    textObj.setColor(textColor);

    this.tweens.add({
      targets: rect,
      scaleX: 0.9,
      scaleY: 0.9,
      duration: 50,
      yoyo: true,
    });

    this.checkMatches(false);
  }

  checkMatches(initialCheck = false) {
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

    this.correctBlocks = correct;
    this.totalBlocks = total;

    if (this.syncText) {
      this.syncText.setText(
        t("matrix.sync", { correct: correct, total: total }),
      );
      if (correct === total && total > 0) {
        this.syncText.setColor("#f4a261"); // warning color in global css
      } else {
        this.syncText.setColor("#e2e8f0");
      }
    }

    if (this.onMatchUpdate) {
      this.onMatchUpdate(correct, total);
    }

    if (correct === total && !initialCheck) {
      this.playWinAnimation();
    }
  }

  playWinAnimation() {
    this.isAnimating = true;
    AudioManager.play("win");

    this.interactiveBlocks.forEach((b) => b.rect.disableInteractive());
    this.clearBtn.disableInteractive();

    this.tweens.add({
      targets: [
        this.titleLeft,
        this.titleRight,
        this.syncText,
        this.clearBtn,
        this.clearText,
      ],
      alpha: 0,
      duration: 300,
    });

    this.playerContainer.setAlpha(0.7);
    this.playerContainer.setDepth(10);

    const centerY = this.scale.height / 2;

    this.tweens.add({
      targets: this.originalContainer,
      y: centerY,
      duration: 1000,
      ease: "Cubic.easeInOut",
    });

    this.tweens.add({
      targets: this.playerContainer,
      y: centerY,
      scaleX: -1,
      duration: 1000,
      ease: "Cubic.easeInOut",
      onComplete: () => {
        this.tweens.add({
          targets: [this.originalContainer, this.playerContainer],
          scaleY: 1.1,
          scaleX: (target) => (target === this.playerContainer ? -1.1 : 1.1),
          duration: 300,
          yoyo: true,
          onComplete: () => {
            this.time.delayedCall(200, () => {
              if (this.onWinCallback) this.onWinCallback();
            });
          },
        });
      },
    });
  }

  resetLevel() {
    this.generateVisuals();
  }
}
