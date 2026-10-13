import Phaser from "phaser";
import { LEVEL_CONFIGS } from "../data/PatternRecognitionLevels";
import {
  AnswerSlot,
  AnswerStatus,
  NO_ANSWER,
  evaluateAnswer,
  isOverSlot,
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
import scene1Clean from "../../assets/images/scene1_clean.png";
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

const QUESTION_KEY_BY_DIFFICULTY = {
  1: "pattern.question_diff_1",
  2: "pattern.question_diff_2",
};

/**
 * Cena principal do jogo de Reconhecimento de Padrões.
 */
export default class PatternRecognitionScene extends Phaser.Scene {
  /**
   * @param {Function} onWinCallback Callback executado ao acertar a resposta.
   * @param {Function} onErrorCallback Callback executado em caso de erro na resposta.
   */
  constructor(onWinCallback, onErrorCallback) {
    super("PatternRecognitionScene");
    this.onWinCallback = onWinCallback;
    this.onErrorCallback = onErrorCallback;

    this.slot = new AnswerSlot();
    this.levelObjects = [];
    this.options = [];
    this.clouds = [];
    this.slotInfo = null;
    this.slotHot = false;
    this.isDragging = false;
    this.isSolved = false;

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
    this.load.image("cloud_sprite", defaultCloudSprite);
    this.load.audio("connect", connectAudio);
    this.load.audio("error", errorAudio);
    this.load.audio("win", winAudio);
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

  loadLevel() {
    const level = this.registry.get("level") ?? 1;
    this.levelData = LEVEL_CONFIGS[(level - 1) % LEVEL_CONFIGS.length];
    this.slot.clear();
    this.isDragging = false;
    this.isSolved = false;

    this.theme = getThemeForLevel(level);

    const isFirstStage = level <= 10;
    const currentBgColor = isFirstStage
      ? SKY_COLOR
      : this.theme.backgroundColor;
    this.cameras.main.setBackgroundColor(currentBgColor);

    const token = ++this.loadToken;
    this.ensureThemeAssets(this.theme, () => {
      if (token !== this.loadToken || this.isShutdown) return;
      this.applyMusic();
      this.renderLevel();
    });
  }

  resetLevel() {
    this.loadLevel();
  }

  /**
   * @param {Phaser.Structs.Size} gameSize
   */
  onResize(gameSize) {
    this.cameras.main.setViewport(0, 0, gameSize.width, gameSize.height);
    this.isDragging = false;
    this.initClouds();
    this.renderLevel();
  }

  // --- NUVENS EM MOVIMENTO -----------------------------------------------

  /**
   * Inicializa o pool de nuvens posicionadas no céu exterior.
   */
  initClouds() {
    this.destroyClouds();
    const { width, height } = this.scale;

    for (let i = 0; i < CLOUD_CONFIG.count; i++) {
      const x = Phaser.Math.Between(-50, width);
      const y = Phaser.Math.Between(height * 0.04, height * 0.26);
      const cloud = this.add.image(x, y, "cloud_sprite");
      const scale = Phaser.Math.FloatBetween(
        CLOUD_CONFIG.minScale,
        CLOUD_CONFIG.maxScale,
      );

      cloud.setScale(scale);
      cloud.setAlpha(CLOUD_CONFIG.alpha);
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

  destroyLevelObjects() {
    this.levelObjects.forEach((obj) => {
      this.tweens.killTweensOf(obj);
      obj.destroy();
    });
    this.levelObjects = [];
    this.options = [];
    this.slotInfo = null;
    this.slotHot = false;
  }

  renderLevel() {
    this.destroyLevelObjects();

    const { width, height } = this.scale;
    const baseSize = Math.min(width, height);

    this.drawBackground(width, height);
    this.drawProgressBar(width, height, baseSize);
    this.drawTexts(width, height, baseSize);
    this.drawSequence(width, height, baseSize);
    this.drawSlot(width, height, baseSize);
    this.drawOptions(width, height, baseSize);
    this.drawConfirmButton(width, height, baseSize);
  }

  drawBackground(width, height) {
    const level = this.registry.get("level") ?? 1;
    const isFirstStage = level <= 10;
    let bgRendered = false;

    if (isFirstStage && this.textures.exists("scene1_clean")) {
      const texture = this.textures.get("scene1_clean");
      if (texture) {
        texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
      }
      const image = this.track(
        this.add
          .image(width / 2, height / 2, "scene1_clean")
          .setDepth(DEPTH_BACKGROUND),
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

  /**
   * Componente visual da barra de progresso no topo da tela.
   * @param {number} width
   * @param {number} height
   * @param {number} baseSize
   */
  drawProgressBar(width, height, baseSize) {
    const level = this.registry.get("level") ?? 1;
    const totalLevels = this.registry.get("totalLevels") ?? 10;
    const stageLevel = ((level - 1) % totalLevels) + 1;
    const progress = stageLevel / totalLevels;

    const barWidth = Math.min(width * 0.78, 320);
    const barHeight = Math.max(8, baseSize * 0.022);
    const x = (width - barWidth) / 2;
    const y = height * 0.04;
    const radius = barHeight / 2;

    const track = this.add.graphics();
    track.fillStyle(0x0f172a, 0.55);
    track.lineStyle(1.5, 0x334155, 0.75);
    track.fillRoundedRect(x, y, barWidth, barHeight, radius);
    track.strokeRoundedRect(x, y, barWidth, barHeight, radius);
    this.track(track);

    const fillWidth = Math.max(radius * 2, barWidth * progress);
    const fill = this.add.graphics();
    fill.fillStyle(0x38bdf8, 0.95);
    fill.fillRoundedRect(x, y, fillWidth, barHeight, radius);
    this.track(fill);

    const labelText = `${t("pattern.level", { num: stageLevel })} / ${totalLevels}`;
    const label = this.add
      .text(width / 2, y + barHeight + 6, labelText, {
        fontSize: `${Math.max(10, baseSize * 0.026)}px`,
        fill: "#cbd5e1",
        stroke: "#0f172a",
        strokeThickness: 2,
        fontStyle: "bold",
      })
      .setOrigin(0.5, 0);
    this.track(label);
  }

  drawTexts(width, height, baseSize) {
    const questionKey = QUESTION_KEY_BY_DIFFICULTY[this.levelData.difficulty];

    this.track(
      this.add
        .text(width / 2, height * 0.12, t(questionKey), {
          fontSize: `${Math.min(22, width * 0.055)}px`,
          fill: this.theme.text.title,
          stroke: "#0f172a",
          strokeThickness: 3,
          align: "center",
          wordWrap: { width: width * 0.92 },
        })
        .setOrigin(0.5),
    );

    this.track(
      this.add
        .text(width / 2, height * 0.19, t("pattern.drag_hint"), {
          fontSize: `${Math.max(12, baseSize * 0.03)}px`,
          fill: this.theme.text.hint,
          stroke: "#0f172a",
          strokeThickness: 2,
          align: "center",
          wordWrap: { width: width * 0.92 },
        })
        .setOrigin(0.5),
    );
  }

  getSequenceRow(width, height) {
    const totalItems = this.levelData.sequence.length + 1;
    return {
      totalItems,
      spacing: width / (totalItems + 1),
      y: height * 0.33,
    };
  }

  drawSequence(width, height, baseSize) {
    const { spacing, y } = this.getSequenceRow(width, height);
    const tileSize = baseSize * 0.15;

    this.levelData.sequence.forEach((value, i) => {
      const x = spacing * (i + 1);

      this.track(
        this.add.rectangle(x + 2, y + 3, tileSize, tileSize, 0x000000, 0.25),
      );

      this.track(
        this.add
          .rectangle(x, y, tileSize, tileSize, POST_IT_BG)
          .setStrokeStyle(1.5, POST_IT_BORDER, 0.6),
      );

      const stripH = tileSize * 0.18;
      this.track(
        this.add.rectangle(
          x,
          y - tileSize / 2 + stripH / 2,
          tileSize,
          stripH,
          POST_IT_TAPE,
          0.85,
        ),
      );

      this.track(this.createShape(x, y + stripH * 0.2, value, baseSize));
    });
  }

  drawSlot(width, height, baseSize) {
    const { spacing, totalItems, y } = this.getSequenceRow(width, height);
    const x = spacing * totalItems;
    const size = baseSize * 0.18;

    this.track(this.add.rectangle(x + 2, y + 3, size, size, 0x000000, 0.35));

    this.slotBox = this.track(
      this.add
        .rectangle(x, y, size, size, this.theme.ui.slotBg)
        .setStrokeStyle(2.5, this.theme.ui.slotBorder),
    );

    this.questionMark = this.track(
      this.add
        .text(x, y, "?", {
          fontSize: `${baseSize * 0.07}px`,
          fill: this.theme.text.hint,
          fontStyle: "bold",
        })
        .setOrigin(0.5),
    );

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
      startY: height * 0.53,
      rowGap: boxSize * 1.3,
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
    this.track(
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

    return this.track(piece);
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
    const spriteKey = this.getDragSpriteKey();

    if (spriteKey) {
      const size = isRotation ? r * 1.6 : r * 2;
      const sprite = this.add.image(x, y, spriteKey).setDisplaySize(size, size);
      if (isRotation) {
        sprite.setAngle(value);
        sprite.setTint(this.theme.ui.shape);
      } else {
        sprite.setTint(value);
      }
      return sprite;
    }

    if (isRotation) {
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
      triangle.setAngle(value);
      return triangle;
    }

    return this.add.circle(x, y, r, value);
  }

  drawConfirmButton(width, height, baseSize) {
    const { button, buttonPressed, buttonBorder } = this.theme.ui;
    const btnWidth = Math.min(260, width * 0.75);
    const btnHeight = baseSize * 0.12;
    const btnX = width / 2;
    const btnY = height * 0.88;

    this.track(
      this.add.rectangle(
        btnX + 2,
        btnY + 3,
        btnWidth,
        btnHeight,
        0x000000,
        0.3,
      ),
    );

    const btnBg = this.track(
      this.add
        .rectangle(btnX, btnY, btnWidth, btnHeight, button)
        .setInteractive({ useHandCursor: true })
        .setStrokeStyle(2, buttonBorder),
    );

    const btnText = this.track(
      this.add
        .text(btnX, btnY, t("global.buttons.confirm"), {
          fontSize: `${Math.min(24, baseSize * 0.05)}px`,
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
    if (!this.isOption(piece)) return;

    this.isDragging = true;
    this.tweens.killTweensOf(piece);
    this.slot.release(piece.getData("optionIndex"));
    this.updateSlotVisuals();

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
    if (this.isDragging || this.isSolved) return;

    const status = evaluateAnswer(
      this.slot.occupant,
      this.levelData.correctOptionIndex,
    );

    if (status === AnswerStatus.CORRECT) {
      this.isSolved = true;
      AudioManager.play("win");
      this.onWinCallback?.();
      return;
    }

    AudioManager.play("error");

    if (status === AnswerStatus.EMPTY) {
      this.cameras.main.shake(150, 0.01);
      this.onErrorCallback?.(t("pattern.err_select_first"));
    } else {
      this.cameras.main.shake(200, 0.015);
      this.onErrorCallback?.(t("pattern.err_incorrect"));

      if (!this.slot.isEmpty) {
        const wrongPiece = this.options[this.slot.occupant];
        if (wrongPiece) {
          this.setPiecePostItStyle(wrongPiece, false);
        }
      }
    }
  }
}
