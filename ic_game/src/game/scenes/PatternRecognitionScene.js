import Phaser from "phaser";
import { LEVEL_CONFIGS } from "../data/PatternRecognitionLevels";
import {
  AnswerSlot,
  AnswerStatus,
  NO_ANSWER,
  evaluateAnswer,
  isOverSlot,
  shuffleLevelOptions,
} from "../logic/PatternRecognitionRules";
import {
  computeColumns,
  computeGridPositions,
  getCellWidth,
} from "../utils/gridLayout";
import { assetKey, getThemeForLevel } from "../utils/patternTheme";
import AudioManager from "../managers/AudioManager";
import i18n from "../../i18n";

import connectAudio from "../../assets/audio/connect.mp3";
import errorAudio from "../../assets/audio/error.mp3";
import winAudio from "../../assets/audio/success_guitar.mp3";
import swipeAudio from "../../assets/audio/swipe.mp3";
import stampAudio from "../../assets/audio/stamp.mp3";
import scene1Clean from "../../assets/images/scene1_clean.png";
import scene1CleanNight from "../../assets/images/scene1_clean_night.png";
import defaultCloudSprite from "../../assets/images/cloud.png";

const t = i18n.global.t;

const MAX_OPTIONS_PER_ROW = 5;
const HIT_AREA_SCALE = 1.35;
const DRAG_SCALE = 1.15;
const DEPTH_CLOUDS = -11;
const DEPTH_BACKGROUND = -10;
const DEPTH_DIMMER = -9;
const DEPTH_DRAGGING = 10;
const MOVE_MS = 160;
const SVG_TEXTURE_SIZE = 128;
const SPRITE_TYPES = ["rotation", "color"];

const SKY_COLOR = "#87ceeb";
const BG_DIM_ALPHA = 0.2;

const CLOUD_CONFIG = {
  count: 3,
  baseSpeed: 4,
  alpha: 0.6,
  minScale: 0.9,
  maxScale: 3.1,
};

const POST_IT_BG = 0xfef9c3;
const POST_IT_TAPE = 0xfde047;
const POST_IT_BORDER = 0xeab308;

const WHITE_POST_IT_BG = 0xf8fafc;
const WHITE_POST_IT_TAPE = 0xe2e8f0;
const WHITE_POST_IT_BORDER = 0xcbd5e1;

const FONT_MAIN = '"Space Grotesk", system-ui, -apple-system, sans-serif';

/**
 * Cena principal do jogo de Reconhecimento de Padrões.
 */
export default class PatternRecognitionScene extends Phaser.Scene {
  /**
   * @param {Function} onWinCallback Callback executado ao acertar a resposta.
   * @param {Function} onErrorCallback Callback executado em caso de erro na resposta.
   * @param {Function} [onSlotChangeCallback] Callback executado quando o estado do slot muda.
   * @param {Function} [onStepChangeCallback] Callback executado ao avançar sub-etapas de transformação.
   */
  constructor(
    onWinCallback,
    onErrorCallback,
    onSlotChangeCallback,
    onStepChangeCallback,
  ) {
    super("PatternRecognitionScene");
    this.onWinCallback = onWinCallback;
    this.onErrorCallback = onErrorCallback;
    this.onSlotChangeCallback = onSlotChangeCallback;
    this.onStepChangeCallback = onStepChangeCallback;

    this.slot = new AnswerSlot();
    this.currentStepIndex = 0;
    this.levelObjects = [];
    this.taskObjects = [];
    this.options = [];
    this.clouds = [];
    this.slotInfo = null;
    this.slotHot = false;
    this.isDragging = false;
    this.isSolved = false;
    this.isTransitioning = false;

    this.theme = null;
    this.music = null;
    this.loadToken = 0;
    this.attemptedAssets = new Set();
    this.isShutdown = false;

    this.handlePause = () => this.music?.pause();
    this.handleResume = () => this.music?.resume();
  }

  // --- LIFECYCLE ---------------------------------------------------------

  preload() {
    this.load.image("scene1_clean", scene1Clean);
    this.load.image("scene1_clean_night", scene1CleanNight);
    this.load.image("cloud_sprite", defaultCloudSprite);
    this.load.audio("connect", connectAudio);
    this.load.audio("error", errorAudio);
    this.load.audio("win", winAudio);
    this.load.audio("swipe", swipeAudio);
    this.load.audio("stamp", stampAudio);

    // Formas geométricas para fases de rotação e transformação
    const SHAPE_NAMES = [
      "triangle",
      "arrow",
      "t_shape",
      "l_shape",
      "chevron",
      "semicircle",
      "wedge",
      "pointer",
      "split_square",
      "split_circle",
      "split_shield",
      "split_diamond",
      "split_triangle",
    ];
    SHAPE_NAMES.forEach((shape) => {
      this.load.svg(
        `shape-${shape}`,
        `assets/pattern/placeholder/${shape}.svg`,
        {
          width: SVG_TEXTURE_SIZE,
          height: SVG_TEXTURE_SIZE,
        },
      );
    });
  }

  create() {
    this.isShutdown = false;
    AudioManager.init(this);

    this.input.on("dragstart", this.onDragStart, this);
    this.input.on("drag", this.onDrag, this);
    this.input.on("dragend", this.onDragEnd, this);
    this.scale.on("resize", this.onResize, this);
    this.events.on(Phaser.Scenes.Events.PAUSE, this.handlePause);
    this.events.on(Phaser.Scenes.Events.RESUME, this.handleResume);
    this.events.once("shutdown", this.onShutdown, this);

    this.initClouds();
    this.loadLevel();
  }

  /**
   * Atualiza continuamente o deslocamento das nuvens no céu exterior.
   * @param {number} time
   * @param {number} delta
   */
  update(time, delta) {
    if (this.isShutdown || !this.clouds.length) return;
    const { width, height } = this.scale;
    const deltaSeconds = delta / 1000;

    for (let i = 0; i < this.clouds.length; i++) {
      const cloud = this.clouds[i];
      cloud.x += cloud.speed * deltaSeconds;

      if (cloud.x > width + cloud.displayWidth) {
        cloud.x = -cloud.displayWidth;
        cloud.y = Phaser.Math.Between(height * 0.04, height * 0.26);
        cloud.speed =
          CLOUD_CONFIG.baseSpeed * Phaser.Math.FloatBetween(0.7, 1.4);
      }
    }
  }

  onShutdown() {
    this.isShutdown = true;
    this.input.off("dragstart", this.onDragStart, this);
    this.input.off("drag", this.onDrag, this);
    this.input.off("dragend", this.onDragEnd, this);
    this.scale.off("resize", this.onResize, this);
    this.events.off(Phaser.Scenes.Events.PAUSE, this.handlePause);
    this.events.off(Phaser.Scenes.Events.RESUME, this.handleResume);
    this.stopMusic();
    this.destroyClouds();
    this.destroyLevelObjects();
  }

  // --- ESTADO DO NÍVEL ---------------------------------------------------

  /**
   * Determina se o cenário deve ser renderizado no modo noturno.
   * Fases 1 a 10 são sempre diurnas. Fases posteriores dependem da escolha do jogador.
   * @returns {boolean}
   */
  isNightMode() {
    const level = this.registry.get("level") ?? 1;
    if (level <= 10) return false;
    const stage2TimeOfDay = this.registry.get("stage2TimeOfDay") ?? "night";
    return stage2TimeOfDay !== "day";
  }

  loadLevel({ animateIn = false } = {}) {
    const level = this.registry.get("level") ?? 1;
    const rawConfig = LEVEL_CONFIGS[(level - 1) % LEVEL_CONFIGS.length];
    this.levelData = shuffleLevelOptions(rawConfig);
    this.currentStepIndex = 0;
    this.slot.clear();
    this.isDragging = false;
    this.isSolved = false;
    this.onSlotChangeCallback?.({ isSlotFilled: false, isInteracting: false });
    this.onStepChangeCallback?.({ stepIndex: 0, completedStep: 0 });

    this.theme = getThemeForLevel(level);

    const isNight = this.isNightMode();
    const currentBgColor = isNight
      ? this.theme.backgroundColor || "#101820"
      : SKY_COLOR;
    this.cameras.main.setBackgroundColor(currentBgColor);

    const token = ++this.loadToken;
    this.ensureThemeAssets(this.theme, () => {
      if (token !== this.loadToken || this.isShutdown) return;
      this.applyMusic();
      this.renderLevel({ animateIn });
    });
  }

  resetLevel({ animateIn = false } = {}) {
    this.loadLevel({ animateIn });
  }

  /**
   * @param {Phaser.Structs.Size} gameSize
   */
  onResize(gameSize) {
    this.cameras.main.setViewport(0, 0, gameSize.width, gameSize.height);
    this.isDragging = false;
    this.initClouds();
    this.renderLevel({ animateIn: false });
  }

  // --- NUVENS EM MOVIMENTO -----------------------------------------------

  /**
   * Inicializa o pool de nuvens posicionadas no céu exterior.
   */
  initClouds() {
    this.destroyClouds();
    const { width, height } = this.scale;
    const isNight = this.isNightMode();

    for (let i = 0; i < CLOUD_CONFIG.count; i++) {
      const x = Phaser.Math.Between(-50, width);
      const y = Phaser.Math.Between(height * 0.04, height * 0.26);
      const cloud = this.add.image(x, y, "cloud_sprite");
      const scale = Phaser.Math.FloatBetween(
        CLOUD_CONFIG.minScale,
        CLOUD_CONFIG.maxScale,
      );

      cloud.setScale(scale);
      cloud.setAlpha(isNight ? 0.35 : CLOUD_CONFIG.alpha);
      if (isNight) {
        cloud.setTint(0xc7d2fe);
      }
      cloud.setDepth(DEPTH_CLOUDS);
      cloud.speed = CLOUD_CONFIG.baseSpeed * Phaser.Math.FloatBetween(0.7, 1.4);

      this.clouds.push(cloud);
    }
  }

  destroyClouds() {
    this.clouds.forEach((cloud) => cloud.destroy());
    this.clouds = [];
  }

  // --- TEMA E ASSETS -----------------------------------------------------

  /**
   * @param {Object} theme
   * @param {Function} onReady
   */
  ensureThemeAssets(theme, onReady) {
    const queued = this.queueThemeAssets(theme);
    if (queued === 0) {
      onReady();
      return;
    }
    this.load.once(Phaser.Loader.Events.COMPLETE, onReady);
    this.load.start();
  }

  /**
   * @param {Object} theme
   * @returns {number} Itens na fila.
   */
  queueThemeAssets(theme) {
    let queued = 0;

    const enqueue = (key, alreadyLoaded, addToLoader) => {
      if (alreadyLoaded || this.attemptedAssets.has(key)) return;
      this.attemptedAssets.add(key);
      addToLoader();
      queued++;
    };

    const addTexture = (key, url) => {
      if (/\.svg(\?.*)?$/i.test(url)) {
        this.load.svg(key, url, {
          width: SVG_TEXTURE_SIZE,
          height: SVG_TEXTURE_SIZE,
        });
      } else {
        this.load.image(key, url);
      }
    };

    if (theme.backgroundImage) {
      const key = assetKey(theme.id, "bg");
      enqueue(key, this.textures.exists(key), () =>
        addTexture(key, theme.backgroundImage),
      );
    }

    SPRITE_TYPES.forEach((type) => {
      const url = theme.dragSprites[type];
      if (!url) return;
      const key = assetKey(theme.id, `sprite-${type}`);
      enqueue(key, this.textures.exists(key), () => addTexture(key, url));
    });

    if (theme.music) {
      const key = assetKey(theme.id, "music");
      enqueue(key, this.cache.audio.exists(key), () =>
        this.load.audio(key, theme.music.url),
      );
    }

    return queued;
  }

  applyMusic() {
    const { id, music } = this.theme;
    const key = assetKey(id, "music");

    if (this.music && this.music.key !== key) this.stopMusic();
    if (!music || !this.cache.audio.exists(key)) return;

    if (!this.music) {
      this.music = this.sound.add(key, {
        loop: true,
        volume: music.volume * AudioManager.globalVolume,
      });
    }
    if (!this.music.isPlaying) this.music.play();
  }

  stopMusic() {
    if (!this.music) return;
    this.music.stop();
    this.music.destroy();
    this.music = null;
  }

  /**
   * @returns {string|null}
   */
  getDragSpriteKey() {
    const key = assetKey(this.theme.id, `sprite-${this.levelData.type}`);
    return this.textures.exists(key) ? key : null;
  }

  // --- RENDER ------------------------------------------------------------

  /**
   * @template T
   * @param {T} gameObject
   * @returns {T}
   */
  track(gameObject) {
    this.levelObjects.push(gameObject);
    return gameObject;
  }

  /**
   * Rastreia objetos específicos da tarefa atual (para swipe e animação de entrada).
   * @template T
   * @param {T} gameObject
   * @returns {T}
   */
  trackTask(gameObject) {
    this.taskObjects.push(gameObject);
    this.track(gameObject);
    return gameObject;
  }

  destroyLevelObjects() {
    this.levelObjects.forEach((obj) => {
      this.tweens.killTweensOf(obj);
      obj.destroy();
    });
    this.levelObjects = [];
    this.taskObjects = [];
    this.options = [];
    this.slotInfo = null;
    this.slotHot = false;
  }

  /**
   * Cria e anima o carimbo visual "APROVADO" que bate rápido sobre a tarefa.
   * @param {number} x
   * @param {number} y
   * @returns {Phaser.GameObjects.Container}
   */
  showApprovedStamp(x, y) {
    const stampContainer = this.add.container(x, y);
    stampContainer.setDepth(25);
    stampContainer.setAngle(-8);

    const stampW = 204;
    const stampH = 56;

    // Borda externa do carimbo
    const border = this.add.graphics();
    border.lineStyle(3.5, 0x10b981, 0.95);
    border.strokeRoundedRect(-stampW / 2, -stampH / 2, stampW, stampH, 8);

    // Borda interna dupla
    const innerBorder = this.add.graphics();
    innerBorder.lineStyle(1.5, 0x10b981, 0.7);
    innerBorder.strokeRoundedRect(
      -stampW / 2 + 5,
      -stampH / 2 + 5,
      stampW - 10,
      stampH - 10,
      5,
    );

    // Texto APROVADO
    const text = this.add
      .text(0, 0, "★ APROVADO ★", {
        fontSize: "20px",
        fontFamily: FONT_MAIN,
        fontStyle: "bold",
        fill: "#10b981",
        stroke: "#064e3b",
        strokeThickness: 1,
      })
      .setOrigin(0.5);

    stampContainer.add([border, innerBorder, text]);
    stampContainer.setScale(2.5);
    stampContainer.setAlpha(0);

    this.trackTask(stampContainer);

    this.tweens.add({
      targets: stampContainer,
      scale: 1,
      alpha: 1,
      duration: 140,
      ease: "Back.easeOut",
      easeParams: [1.7],
      onComplete: () => {
        this.cameras.main.shake(70, 0.0035);
      },
    });

    return stampContainer;
  }

  /**
   * Efeito de transição física: arrasta a tarefa concluída para a esquerda para abrir espaço.
   * @param {Function} onComplete
   */
  swipeAwayCurrentTask(onComplete) {
    AudioManager.play("swipe", { volume: 0.65 });
    const { width } = this.scale;
    const shiftX = width + 140;

    this.tweens.add({
      targets: this.taskObjects,
      x: `-=${shiftX}`,
      alpha: 0,
      duration: 240,
      ease: "Cubic.easeIn",
      onComplete: () => {
        this.destroyLevelObjects();
        onComplete?.();
      },
    });
  }

  renderLevel({ animateIn = false } = {}) {
    this.destroyLevelObjects();

    const { width, height } = this.scale;
    const baseSize = Math.min(width, height);

    this.drawBackground(width, height);
    this.drawSequence(width, height, baseSize);
    this.drawSlot(width, height, baseSize);
    this.drawOptions(width, height, baseSize);
    this.drawConfirmButton(width, height, baseSize);

    if (animateIn && this.taskObjects.length > 0) {
      const shiftX = width + 140;
      this.isTransitioning = true;
      this.taskObjects.forEach((obj) => {
        obj.x += shiftX;
        obj.setAlpha(0);
      });

      this.tweens.add({
        targets: this.taskObjects,
        x: `-=${shiftX}`,
        alpha: 1,
        duration: 260,
        ease: "Cubic.easeOut",
        onComplete: () => {
          this.isTransitioning = false;
        },
      });
    }
  }

  drawBackground(width, height) {
    const isNight = this.isNightMode();
    const bgKey = isNight ? "scene1_clean_night" : "scene1_clean";
    let bgRendered = false;

    if (this.textures.exists(bgKey)) {
      const texture = this.textures.get(bgKey);
      if (texture) {
        texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
      }
      const image = this.track(
        this.add.image(width / 2, height / 2, bgKey).setDepth(DEPTH_BACKGROUND),
      );
      image.setScale(Math.max(width / image.width, height / image.height));
      bgRendered = true;
    } else {
      const key = assetKey(this.theme.id, "bg");
      if (this.theme.backgroundImage && this.textures.exists(key)) {
        const image = this.track(
          this.add.image(width / 2, height / 2, key).setDepth(DEPTH_BACKGROUND),
        );
        image.setScale(Math.max(width / image.width, height / image.height));
        bgRendered = true;
      }
    }

    if (bgRendered && BG_DIM_ALPHA > 0) {
      this.track(
        this.add
          .rectangle(
            width / 2,
            height / 2,
            width,
            height,
            0x000000,
            BG_DIM_ALPHA,
          )
          .setDepth(DEPTH_DIMMER),
      );
    }
  }

  getActiveStep() {
    if (!Array.isArray(this.levelData?.steps)) return null;
    return this.levelData.steps[this.currentStepIndex] ?? null;
  }

  getSequenceRow(width, height) {
    const seqLen = this.levelData?.sequence
      ? this.levelData.sequence.length
      : 3;
    const totalItems = seqLen + 1;
    return {
      totalItems,
      spacing: width / (totalItems + 1),
      y: height * 0.36,
    };
  }

  drawSequence(width, height, baseSize) {
    const isTransformation =
      this.levelData.type === "transformation" ||
      Boolean(this.levelData.baseShape !== undefined);

    if (isTransformation) {
      const y = height * 0.36;
      const tileSize = baseSize * 0.16;
      const baseX = width * 0.35;
      const arrowX = width * 0.5;
      const activeStep = this.getActiveStep();
      const isChainedStep = this.currentStepIndex > 0;

      // Sombra e Post-it da Forma Base (ou Resultado da etapa anterior)
      this.trackTask(
        this.add.rectangle(
          baseX + 2,
          y + 3,
          tileSize,
          tileSize,
          0x000000,
          0.25,
        ),
      );

      this.basePostItBox = this.trackTask(
        this.add
          .rectangle(baseX, y, tileSize, tileSize, POST_IT_BG)
          .setStrokeStyle(
            isChainedStep ? 2.5 : 1.5,
            isChainedStep ? 0x10b981 : POST_IT_BORDER,
            isChainedStep ? 0.95 : 0.6,
          ),
      );

      const stripH = tileSize * 0.18;
      this.trackTask(
        this.add.rectangle(
          baseX,
          y - tileSize / 2 + stripH / 2,
          tileSize,
          stripH,
          isChainedStep ? 0x6ee7b7 : POST_IT_TAPE,
          0.85,
        ),
      );

      const baseValue = activeStep?.baseShape ??
        this.levelData.baseShape ?? {
          angle: 0,
          flipX: false,
          flipY: false,
        };
      this.trackTask(
        this.createShape(baseX, y + stripH * 0.2, baseValue, baseSize),
      );

      const baseLabelText = isChainedStep
        ? t("pattern.label_step_result", { step: this.currentStepIndex })
        : t("pattern.label_original");

      // Rótulo da forma original ou do resultado intermediário
      this.trackTask(
        this.add
          .text(baseX, y + tileSize / 2 + 10, baseLabelText, {
            fontFamily: FONT_MAIN,
            fontSize: `${Math.max(12, baseSize * 0.028)}px`,
            fill: isChainedStep ? "#34d399" : "#cbd5e1",
            stroke: "#0f172a",
            strokeThickness: 2.5,
            fontStyle: "bold",
          })
          .setOrigin(0.5, 0),
      );

      // Seta indicativa ➜
      this.trackTask(
        this.add
          .text(arrowX, y, "➜", {
            fontFamily: FONT_MAIN,
            fontSize: `${Math.max(26, baseSize * 0.065)}px`,
            fill: isChainedStep ? "#34d399" : "#38bdf8",
            stroke: "#0f172a",
            strokeThickness: 2,
            fontStyle: "bold",
          })
          .setOrigin(0.5),
      );
      return;
    }

    const { spacing, y } = this.getSequenceRow(width, height);
    const tileSize = baseSize * 0.15;

    this.levelData.sequence.forEach((value, i) => {
      const x = spacing * (i + 1);

      this.trackTask(
        this.add.rectangle(x + 2, y + 3, tileSize, tileSize, 0x000000, 0.25),
      );

      this.trackTask(
        this.add
          .rectangle(x, y, tileSize, tileSize, POST_IT_BG)
          .setStrokeStyle(1.5, POST_IT_BORDER, 0.6),
      );

      const stripH = tileSize * 0.18;
      this.trackTask(
        this.add.rectangle(
          x,
          y - tileSize / 2 + stripH / 2,
          tileSize,
          stripH,
          POST_IT_TAPE,
          0.85,
        ),
      );

      this.trackTask(this.createShape(x, y + stripH * 0.2, value, baseSize));
    });
  }

  drawSlot(width, height, baseSize) {
    const isTransformation =
      this.levelData.type === "transformation" ||
      Boolean(this.levelData.baseShape !== undefined);

    let x, y, size;
    if (isTransformation) {
      x = width * 0.65;
      y = height * 0.36;
      size = baseSize * 0.18;
    } else {
      const {
        spacing,
        totalItems,
        y: rowY,
      } = this.getSequenceRow(width, height);
      x = spacing * totalItems;
      y = rowY;
      size = baseSize * 0.18;
    }

    this.trackTask(
      this.add.rectangle(x + 2, y + 3, size, size, 0x000000, 0.35),
    );

    this.slotBox = this.trackTask(
      this.add
        .rectangle(x, y, size, size, this.theme.ui.slotBg)
        .setStrokeStyle(2.5, this.theme.ui.slotBorder),
    );

    this.questionMark = this.trackTask(
      this.add
        .text(x, y, "?", {
          fontFamily: FONT_MAIN,
          fontSize: `${Math.max(24, baseSize * 0.07)}px`,
          fill: this.theme.text.hint,
          fontStyle: "bold",
        })
        .setOrigin(0.5),
    );

    if (isTransformation) {
      const hasSteps = Array.isArray(this.levelData.steps);
      const slotLabel = hasSteps
        ? this.currentStepIndex < this.levelData.steps.length - 1
          ? t("pattern.label_step_result", { step: this.currentStepIndex + 1 })
          : t("pattern.label_final_result")
        : t("pattern.label_result");

      this.trackTask(
        this.add
          .text(x, y + size / 2 + 10, slotLabel, {
            fontFamily: FONT_MAIN,
            fontSize: `${Math.max(12, baseSize * 0.028)}px`,
            fill: "#38bdf8",
            stroke: "#0f172a",
            strokeThickness: 2.5,
            fontStyle: "bold",
          })
          .setOrigin(0.5, 0),
      );
    }

    this.slotInfo = { x, y, size };
    this.updateSlotVisuals();
  }

  drawOptions(width, height, baseSize) {
    const values = this.levelData.answerOptions;
    const columns = computeColumns(values.length, MAX_OPTIONS_PER_ROW);
    const boxSize = Math.min(
      baseSize * 0.15,
      getCellWidth(width, columns) * 0.86,
    );

    const positions = computeGridPositions({
      count: values.length,
      columns,
      width,
      startY: height * 0.55,
      rowGap: boxSize * 1.25,
    });

    this.options = values.map((value, index) =>
      this.createOption(value, index, positions[index], boxSize, baseSize),
    );

    if (!this.slot.isEmpty) {
      const piece = this.options[this.slot.occupant];
      if (piece) {
        piece.setPosition(this.slotInfo.x, this.slotInfo.y);
        this.setPiecePostItStyle(piece, true);
      }
    }
  }

  /**
   * @param {*} value
   * @param {number} index
   * @param {{x: number, y: number}} home
   * @param {number} boxSize
   * @param {number} baseSize
   * @returns {Phaser.GameObjects.Container}
   */
  createOption(value, index, home, boxSize, baseSize) {
    this.trackTask(
      this.add
        .rectangle(home.x, home.y, boxSize, boxSize, 0x000000, 0.18)
        .setStrokeStyle(1.5, 0xffffff, 0.25),
    );

    const stripH = boxSize * 0.18;
    const tileShadow = this.add.rectangle(
      2,
      3,
      boxSize,
      boxSize,
      0x000000,
      0.28,
    );
    const tileBg = this.add
      .rectangle(0, 0, boxSize, boxSize, WHITE_POST_IT_BG)
      .setStrokeStyle(1.5, WHITE_POST_IT_BORDER, 0.6);
    const tileTape = this.add.rectangle(
      0,
      -boxSize / 2 + stripH / 2,
      boxSize,
      stripH,
      WHITE_POST_IT_TAPE,
      0.85,
    );
    const shape = this.createShape(0, stripH * 0.2, value, baseSize);

    const hit = boxSize * HIT_AREA_SCALE;
    const piece = this.add.container(home.x, home.y, [
      tileShadow,
      tileBg,
      tileTape,
      shape,
    ]);
    piece.setSize(hit, hit);
    piece.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(0, 0, hit, hit),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      draggable: true,
      useHandCursor: true,
    });
    piece.setData({ optionIndex: index, home, tileShadow, tileBg, tileTape });

    return this.trackTask(piece);
  }

  /**
   * @param {number} x
  /**
   * Resolve a textura SVG da forma geométrica configurada na fase atual.
   * @returns {string|null}
   */
  getShapeSpriteKey() {
    const shape = this.levelData?.shape || "triangle";
    const key = `shape-${shape}`;
    return this.textures.exists(key) ? key : null;
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {*} value
   * @param {number} baseSize
   * @returns {Phaser.GameObjects.GameObject}
   */
  createShape(x, y, value, baseSize) {
    const r = baseSize * 0.055;
    const isRotation = this.levelData.type === "rotation";
    const isTransformation = this.levelData.type === "transformation";

    if (isRotation || isTransformation) {
      const shapeKey = this.getShapeSpriteKey();
      if (shapeKey) {
        const size = r * 1.6;
        const sprite = this.add
          .image(x, y, shapeKey)
          .setDisplaySize(size, size);

        const angle =
          typeof value === "object" ? (value.angle ?? 0) : Number(value) || 0;
        const flipX = typeof value === "object" ? Boolean(value.flipX) : false;
        const flipY = typeof value === "object" ? Boolean(value.flipY) : false;

        sprite.setAngle(angle);
        sprite.setFlip(flipX, flipY);

        const isSplitShape = this.levelData.shape?.startsWith("split_");
        if (!this.levelData.preserveColors && !isSplitShape) {
          sprite.setTint(this.theme.ui.shape);
        }
        return sprite;
      }

      const triangle = this.add.triangle(
        x,
        y,
        0,
        r * 1.6,
        r * 1.6,
        r * 1.6,
        r * 0.8,
        0,
        this.theme.ui.shape,
      );
      const angle =
        typeof value === "object" ? (value.angle ?? 0) : Number(value) || 0;
      triangle.setAngle(angle);
      return triangle;
    }

    const spriteKey = this.getDragSpriteKey();
    if (spriteKey) {
      const size = r * 2;
      const sprite = this.add.image(x, y, spriteKey).setDisplaySize(size, size);
      sprite.setTint(value);
      return sprite;
    }

    return this.add.circle(x, y, r, value);
  }

  drawConfirmButton(width, height, baseSize) {
    const { button, buttonPressed, buttonBorder } = this.theme.ui;
    const btnWidth = Math.min(260, width * 0.75);
    const btnHeight = Math.max(46, baseSize * 0.12);
    const btnX = width / 2;
    const btnY = height * 0.89;

    this.trackTask(
      this.add.rectangle(
        btnX + 2,
        btnY + 3,
        btnWidth,
        btnHeight,
        0x000000,
        0.3,
      ),
    );

    const btnBg = this.trackTask(
      this.add
        .rectangle(btnX, btnY, btnWidth, btnHeight, button)
        .setInteractive({ useHandCursor: true })
        .setStrokeStyle(2, buttonBorder),
    );

    const btnText = this.trackTask(
      this.add
        .text(btnX, btnY, t("global.buttons.confirm"), {
          fontFamily: FONT_MAIN,
          fontSize: `${Math.max(18, Math.min(22, baseSize * 0.05))}px`,
          fill: this.theme.text.button,
          fontStyle: "bold",
        })
        .setOrigin(0.5),
    );

    const release = () => {
      btnBg.setFillStyle(button);
      btnText.setY(btnY);
    };

    btnBg.on("pointerdown", () => {
      btnBg.setFillStyle(buttonPressed);
      btnText.setY(btnY + 2);
      this.checkAnswer();
    });
    btnBg.on("pointerup", release);
    btnBg.on("pointerout", release);
  }

  // --- DRAG & DROP -------------------------------------------------------

  /**
   * Altera a paleta da peça entre post-it amarelo e branco.
   * @param {Phaser.GameObjects.Container} piece
   * @param {boolean} isPlacedInSlot
   */
  setPiecePostItStyle(piece, isPlacedInSlot) {
    const tileBg = piece.getData("tileBg");
    const tileTape = piece.getData("tileTape");
    if (!tileBg || !tileTape) return;

    if (isPlacedInSlot) {
      tileBg.setFillStyle(POST_IT_BG);
      tileBg.setStrokeStyle(1.5, POST_IT_BORDER, 0.6);
      tileTape.setFillStyle(POST_IT_TAPE, 0.85);
    } else {
      tileBg.setFillStyle(WHITE_POST_IT_BG);
      tileBg.setStrokeStyle(1.5, WHITE_POST_IT_BORDER, 0.6);
      tileTape.setFillStyle(WHITE_POST_IT_TAPE, 0.85);
    }
  }

  isOption(gameObject) {
    return this.options.includes(gameObject);
  }

  isPieceOverSlot(piece) {
    const { x, y, size } = this.slotInfo;
    return isOverSlot(piece.x, piece.y, x, y, size);
  }

  onDragStart(pointer, piece) {
    if (this.isTransitioning || !this.isOption(piece)) return;

    this.isDragging = true;
    this.tweens.killTweensOf(piece);
    this.slot.release(piece.getData("optionIndex"));
    this.updateSlotVisuals();
    this.onSlotChangeCallback?.({
      isSlotFilled: !this.slot.isEmpty,
      isInteracting: true,
    });

    this.setPiecePostItStyle(piece, false);

    piece.setDepth(DEPTH_DRAGGING);
    piece.setScale(DRAG_SCALE);

    const shadow = piece.getData("tileShadow");
    if (shadow) shadow.setPosition(4, 6);

    AudioManager.play("connect", { volume: 0.5 });
  }

  onDrag(pointer, piece, dragX, dragY) {
    if (!this.isOption(piece)) return;

    piece.setPosition(dragX, dragY);
    this.setSlotHighlight(this.isPieceOverSlot(piece));
  }

  onDragEnd(pointer, piece) {
    if (!this.isOption(piece)) return;

    this.isDragging = false;
    this.setSlotHighlight(false);
    piece.setDepth(0);

    const shadow = piece.getData("tileShadow");
    if (shadow) shadow.setPosition(2, 3);

    if (this.isPieceOverSlot(piece)) {
      this.dropIntoSlot(piece);
    } else {
      this.sendHome(piece);
    }

    this.onSlotChangeCallback?.({
      isSlotFilled: !this.slot.isEmpty,
      isInteracting: false,
    });
  }

  dropIntoSlot(piece) {
    const displacedIndex = this.slot.place(piece.getData("optionIndex"));

    if (displacedIndex !== NO_ANSWER) {
      const displacedPiece = this.options[displacedIndex];
      if (displacedPiece) {
        this.setPiecePostItStyle(displacedPiece, false);
        this.sendHome(displacedPiece);
      }
    }

    this.setPiecePostItStyle(piece, true);
    this.moveTo(piece, this.slotInfo.x, this.slotInfo.y);
    this.updateSlotVisuals();
    AudioManager.play("connect");
  }

  sendHome(piece) {
    this.setPiecePostItStyle(piece, false);
    const { x, y } = piece.getData("home");
    this.moveTo(piece, x, y);
  }

  moveTo(piece, x, y) {
    this.tweens.killTweensOf(piece);
    this.tweens.add({
      targets: piece,
      x,
      y,
      scale: 1,
      duration: MOVE_MS,
      ease: "Cubic.easeOut",
    });
  }

  setSlotHighlight(isHot) {
    if (!this.slotBox || this.slotHot === isHot) return;
    this.slotHot = isHot;
    this.slotBox.setStrokeStyle(
      isHot ? 3.5 : 2.5,
      isHot ? this.theme.ui.optionBorderActive : this.theme.ui.slotBorder,
    );
  }

  updateSlotVisuals() {
    this.questionMark?.setVisible(this.slot.isEmpty);
  }

  // --- RESULTADO ---------------------------------------------------------

  checkAnswer() {
    if (this.isTransitioning || this.isDragging || this.isSolved) return;

    const activeStep = this.getActiveStep();
    const targetCorrectIndex =
      activeStep?.correctOptionIndex ?? this.levelData.correctOptionIndex;

    const status = evaluateAnswer(this.slot.occupant, targetCorrectIndex);

    if (status === AnswerStatus.CORRECT) {
      const hasNextStep =
        Array.isArray(this.levelData.steps) &&
        this.currentStepIndex < this.levelData.steps.length - 1;

      if (hasNextStep) {
        this.isTransitioning = true;
        const completedStepNum = this.currentStepIndex + 1;
        AudioManager.play("stamp", { volume: 0.35 });

        this.onStepChangeCallback?.({
          stepIndex: this.currentStepIndex + 1,
          completedStep: completedStepNum,
        });

        const occupantPiece = this.options[this.slot.occupant];
        const { width, height } = this.scale;
        const targetBaseX = width * 0.35;
        const targetBaseY = height * 0.36;

        if (occupantPiece) {
          occupantPiece.setDepth(DEPTH_DRAGGING);
          this.tweens.add({
            targets: occupantPiece,
            x: targetBaseX,
            y: targetBaseY,
            scale: 1.08,
            duration: 320,
            ease: "Cubic.easeInOut",
            onComplete: () => {
              this.currentStepIndex += 1;
              this.slot.clear();
              this.isTransitioning = false;
              this.onSlotChangeCallback?.({
                isSlotFilled: false,
                isInteracting: false,
              });
              this.renderLevel({ animateIn: false });
            },
          });
        } else {
          this.currentStepIndex += 1;
          this.slot.clear();
          this.isTransitioning = false;
          this.onSlotChangeCallback?.({
            isSlotFilled: false,
            isInteracting: false,
          });
          this.renderLevel({ animateIn: false });
        }
        return;
      }

      if (Array.isArray(this.levelData.steps)) {
        this.onStepChangeCallback?.({
          stepIndex: this.levelData.steps.length,
          completedStep: this.currentStepIndex + 1,
        });
      }

      this.isSolved = true;
      this.isTransitioning = true;
      const level = this.registry.get("level") ?? 1;
      const totalLevels = this.registry.get("totalLevels") ?? 10;
      const stageLevel =
        this.registry.get("stageLevel") ?? ((level - 1) % totalLevels) + 1;
      const isGroupComplete = stageLevel >= totalLevels;

      const occupantPiece = this.options[this.slot.occupant];
      if (occupantPiece) {
        this.tweens.add({
          targets: occupantPiece,
          scale: 1.14,
          duration: 120,
          yoyo: true,
          ease: "Quad.easeOut",
        });
      }

      const { width, height } = this.scale;
      const stampX = this.slotInfo
        ? Math.min(this.slotInfo.x, width - 110)
        : width / 2;
      const stampY = this.slotInfo ? this.slotInfo.y : height * 0.33;
      this.showApprovedStamp(stampX, stampY);

      if (isGroupComplete) {
        AudioManager.play("win");
        this.time.delayedCall(500, () => {
          this.isTransitioning = false;
          this.onWinCallback?.({ isGroupComplete: true });
        });
      } else {
        // Guitarra suave e sutil para acertos intermediários
        AudioManager.play("stamp", { volume: 0.35 });

        // Pausa breve para visualizar o carimbo APROVADO antes do swipe físico
        this.time.delayedCall(260, () => {
          this.swipeAwayCurrentTask(() => {
            this.isTransitioning = false;
            this.onWinCallback?.({ isGroupComplete: false });
          });
        });
      }
      return;
    }

    AudioManager.play("error");

    if (status === AnswerStatus.EMPTY) {
      this.cameras.main.shake(150, 0.01);
      this.onErrorCallback?.(t("pattern.err_select_first"), {
        isMistake: false,
      });
    } else {
      this.cameras.main.shake(200, 0.015);
      this.onErrorCallback?.(t("pattern.err_incorrect"), {
        isMistake: true,
      });

      if (!this.slot.isEmpty) {
        const wrongPiece = this.options[this.slot.occupant];
        if (wrongPiece) {
          this.setPiecePostItStyle(wrongPiece, false);
        }
      }
    }
  }
}
