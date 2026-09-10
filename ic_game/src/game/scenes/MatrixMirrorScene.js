import Phaser from "phaser";
import { LEVELS, COLORS } from "../data/MatrixMirrorLevels";
import AudioManager from "../managers/AudioManager";

import connectAudio from "../../assets/audio/connect.mp3";
import errorAudio from "../../assets/audio/error.mp3";
import winAudio from "../../assets/audio/win.mp3";

export default class MatrixMirrorScene extends Phaser.Scene {
  constructor(onMatchUpdate, onWin) {
    super("MatrixGameScene");
    this.onMatchUpdate = onMatchUpdate;
    this.onWinCallback = onWin; // Para evitar colisão com this.onWin do próprio Phaser
    this.playerMatrix = [];
    this.originalContainer = null;
    this.playerContainer = null;
    this.interactiveBlocks = [];
    this.isAnimating = false;
  }

  create() {
    // Inicializa o AudioManager para esta cena
    AudioManager.init(this);
    this.generateVisuals();
  }

  preload() {
    // Carrega os sons resolvidos pelo Vite
    this.load.audio('connect', connectAudio);
    this.load.audio('error', errorAudio);
    this.load.audio('win', winAudio);
  }

  generateVisuals() {
    this.isAnimating = false;
    
    // Limpa estado anterior
    if (this.originalContainer) this.originalContainer.destroy(true);
    if (this.playerContainer) this.playerContainer.destroy(true);
    if (this.titleLeft) this.titleLeft.destroy(true);
    if (this.titleRight) this.titleRight.destroy(true);
    
    this.interactiveBlocks = [];

    const levelData = LEVELS[(this.registry.get("level") - 1) % LEVELS.length];
    const is2D = levelData.dimensions.rows > 1;
    
    // Inicia a matriz do jogador com 0 (Desligado)
    this.playerMatrix = [];
    for (let r = 0; r < levelData.dimensions.rows; r++) {
      if (is2D) {
        this.playerMatrix.push(new Array(levelData.dimensions.cols).fill(0));
      }
    }
    if (!is2D) {
       this.playerMatrix = new Array(levelData.dimensions.cols).fill(0);
    }

    const startY = 220;
    const blockSize = 60;
    const spacing = 70;
    
    // Containers
    this.originalContainer = this.add.container(200, startY);
    this.playerContainer = this.add.container(600, startY);

    // Textos (fora dos containers para não girarem)
    this.titleLeft = this.add.text(200, startY - 80, "Matriz Original", { fontSize: '24px', fill: '#e2e8f0', fontStyle: 'bold' }).setOrigin(0.5);
    this.titleRight = this.add.text(600, startY - 80, "Sua Matriz (Espelho)", { fontSize: '24px', fill: '#e2e8f0', fontStyle: 'bold' }).setOrigin(0.5);
    
    // Desenha matriz Original (Estática)
    this.drawMatrix(this.originalContainer, levelData.input, levelData.dimensions, blockSize, spacing, false);
    
    // Desenha matriz do Jogador (Interativa)
    this.drawMatrix(this.playerContainer, this.playerMatrix, levelData.dimensions, blockSize, spacing, true);

    this.checkMatches(true); // check inicial silencioso
  }

  drawMatrix(container, matrix, dims, blockSize, spacing, isInteractive) {
    const is2D = dims.rows > 1;
    
    const totalWidth = dims.cols * spacing;
    const totalHeight = dims.rows * spacing;
    
    const startX = -(totalWidth / 2) + (spacing / 2);
    const localStartY = -(totalHeight / 2) + (spacing / 2);
    
    for (let r = 0; r < dims.rows; r++) {
      for (let c = 0; c < dims.cols; c++) {
        const val = is2D ? matrix[r][c] : matrix[c];
        
        let color = COLORS.OFF;
        let textColor = COLORS.TEXT_OFF;
        if (val === 1) {
          color = isInteractive ? COLORS.ON_PLAYER : COLORS.ON_ORIGINAL;
          textColor = isInteractive ? COLORS.TEXT_ON_PLAYER : COLORS.TEXT_ON_ORIGINAL;
        }

        const x = startX + c * spacing;
        const y = localStartY + r * spacing;

        const rect = this.add.rectangle(x, y, blockSize, blockSize, color)
          .setStrokeStyle(3, COLORS.BORDER);
        
        const coordText = `${r + 1},${c + 1}`;
        const q = this.add.text(x, y, coordText, { fill: textColor, fontSize: '18px', fontStyle: 'bold' }).setOrigin(0.5);
        
        container.add([rect, q]);

        if (isInteractive) {
          const blockData = { r, c, rect, textObj: q };
          rect.setInteractive({ useHandCursor: true });
          rect.on('pointerdown', () => this.handleBlockClick(blockData));
          this.interactiveBlocks.push(blockData);
        }
      }
    }
  }

  handleBlockClick(blockData) {
    if (this.isAnimating) return;

    AudioManager.play('connect');

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
        yoyo: true
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

    if (this.onMatchUpdate) {
      this.onMatchUpdate(correct, total);
    }

    if (correct === total && !initialCheck) {
      this.playWinAnimation();
    }
  }

  playWinAnimation() {
    this.isAnimating = true;
    AudioManager.play('win');

    this.interactiveBlocks.forEach(b => b.rect.disableInteractive());

    this.tweens.add({
      targets: [this.titleLeft, this.titleRight],
      alpha: 0,
      duration: 300
    });
    
    this.playerContainer.setAlpha(0.7);
    this.playerContainer.setDepth(10);

    this.tweens.add({
      targets: this.originalContainer,
      x: 400,
      duration: 1000,
      ease: 'Cubic.easeInOut'
    });

    this.tweens.add({
      targets: this.playerContainer,
      x: 400,
      scaleX: -1,
      duration: 1000,
      ease: 'Cubic.easeInOut',
      onComplete: () => {
        this.tweens.add({
          targets: [this.originalContainer, this.playerContainer],
          scaleY: 1.1,
          scaleX: (target) => target === this.playerContainer ? -1.1 : 1.1,
          duration: 300,
          yoyo: true,
          onComplete: () => {
            this.time.delayedCall(200, () => {
              if (this.onWinCallback) this.onWinCallback();
            });
          }
        });
      }
    });
  }

  resetLevel() {
    this.generateVisuals();
  }
}
