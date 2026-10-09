import Phaser from "phaser";
import { COLORS, LEVEL_CONFIGS } from "../data/PatternRecognitionLevels";
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
import AudioManager from "../managers/AudioManager";
import i18n from "../../i18n";

import connectAudio from "../../assets/audio/connect.mp3";
import errorAudio from "../../assets/audio/error.mp3";
import winAudio from "../../assets/audio/success_guitar.mp3";

const t = i18n.global.t;

const MAX_OPTIONS_PER_ROW = 5;
const HIT_AREA_SCALE = 1.2; // área de toque maior que o desenho
const DRAG_SCALE = 1.1;
const DEPTH_DRAGGING = 10;
const MOVE_MS = 160;

const QUESTION_KEY_BY_DIFFICULTY = {
  1: "pattern.question_diff_1",
  2: "pattern.question_diff_2",
};

export default class PatternRecognitionScene extends Phaser.Scene {
  constructor(onWinCallback, onErrorCallback) {
    super("PatternRecognitionScene");
    this.onWinCallback = onWinCallback;
    this.onErrorCallback = onErrorCallback;

    this.slot = new AnswerSlot();
    this.levelObjects = []; // tudo que é recriado a cada render
    this.options = []; // peças arrastáveis, indexadas como answerOptions
    this.slotInfo = null;
    this.slotHot = false;
    this.isDragging = false;
    this.isSolved = false;
  }

  // --- LIFECYCLE ---------------------------------------------------------

  preload() {
    this.load.audio("connect", connectAudio);
    this.load.audio("error", errorAudio);
    this.load.audio("win", winAudio);
  }

  create() {
    AudioManager.init(this);

    this.input.on("dragstart", this.onDragStart, this);
    this.input.on("drag", this.onDrag, this);
    this.input.on("dragend", this.onDragEnd, this);
    this.scale.on("resize", this.onResize, this);
    this.events.once("shutdown", this.onShutdown, this);

    this.loadLevel();
  }

  onShutdown() {
    this.input.off("dragstart", this.onDragStart, this);
    this.input.off("drag", this.onDrag, this);
    this.input.off("dragend", this.onDragEnd, this);
    this.scale.off("resize", this.onResize, this);
    this.destroyLevelObjects();
  }

  // --- ESTADO DO NÍVEL ---------------------------------------------------

  loadLevel() {
    const level = this.registry.get("level") ?? 1;
    this.levelData = LEVEL_CONFIGS[(level - 1) % LEVEL_CONFIGS.length];
    this.slot.clear();
    this.isDragging = false;
    this.isSolved = false;
    this.renderLevel();
  }

  resetLevel() {
    this.loadLevel();
  }

  /** No resize o nível é redesenhado, mas a resposta do jogador é mantida. */
  onResize(gameSize) {
    this.cameras.main.setViewport(0, 0, gameSize.width, gameSize.height);
    this.isDragging = false;
    this.renderLevel();
  }

  // --- RENDER ------------------------------------------------------------

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

    this.drawTexts(width, height, baseSize);
    this.drawSequence(width, height, baseSize);
    this.drawSlot(width, height, baseSize);
    this.drawOptions(width, height, baseSize);
    this.drawConfirmButton(width, height, baseSize);
  }

  drawTexts(width, height, baseSize) {
    const questionKey = QUESTION_KEY_BY_DIFFICULTY[this.levelData.difficulty];

    this.track(
      this.add
        .text(width / 2, height * 0.12, t(questionKey), {
          fontSize: `${Math.min(24, width * 0.06)}px`,
          fill: "#e2e8f0",
          align: "center",
          wordWrap: { width: width * 0.9 },
        })
        .setOrigin(0.5),
    );

    this.track(
      this.add
        .text(width / 2, height * 0.19, t("pattern.drag_hint"), {
          fontSize: `${Math.max(12, baseSize * 0.03)}px`,
          fill: "#a0aec0",
          align: "center",
          wordWrap: { width: width * 0.9 },
        })
        .setOrigin(0.5),
    );
  }

  /** Linha da sequência: N formas + 1 slot, com espaçamento uniforme. */
  getSequenceRow(width, height) {
    const totalItems = this.levelData.sequence.length + 1;
    return {
      totalItems,
      spacing: width / (totalItems + 1),
      y: height * 0.34,
    };
  }

  drawSequence(width, height, baseSize) {
    const { spacing, y } = this.getSequenceRow(width, height);

    this.levelData.sequence.forEach((value, i) => {
      this.track(this.createShape(spacing * (i + 1), y, value, baseSize));
    });
  }

  drawSlot(width, height, baseSize) {
    const { spacing, totalItems, y } = this.getSequenceRow(width, height);
    const x = spacing * totalItems;
    const size = baseSize * 0.18;

    this.slotBox = this.track(
      this.add
        .rectangle(x, y, size, size, COLORS.SLOT_BG)
        .setStrokeStyle(2, COLORS.SLOT_BORDER),
    );
    this.questionMark = this.track(
      this.add
        .text(x, y, "?", {
          fontSize: `${baseSize * 0.06}px`,
          fill: "#a0aec0",
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
      baseSize * 0.14,
      getCellWidth(width, columns) * 0.85,
    );

    const positions = computeGridPositions({
      count: values.length,
      columns,
      width,
      startY: height * 0.54,
      rowGap: boxSize * 1.3,
    });

    this.options = values.map((value, index) =>
      this.createOption(value, index, positions[index], boxSize, baseSize),
    );

    // Restaura a peça que já estava no slot (ex.: após resize).
    if (!this.slot.isEmpty) {
      const piece = this.options[this.slot.occupant];
      if (piece) piece.setPosition(this.slotInfo.x, this.slotInfo.y);
    }
  }

  createOption(value, index, home, boxSize, baseSize) {
    // Moldura fixa na posição de origem: indica a "vaga" da peça.
    this.track(
      this.add
        .rectangle(home.x, home.y, boxSize, boxSize, COLORS.OPTION_BG)
        .setStrokeStyle(2, COLORS.OPTION_BORDER),
    );

    const hit = boxSize * HIT_AREA_SCALE;
    const shape = this.createShape(0, 0, value, baseSize);
    const piece = this.add.container(home.x, home.y, [shape]);
    piece.setSize(hit, hit);
    piece.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(0, 0, hit, hit),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      draggable: true,
      useHandCursor: true,
    });
    piece.setData({ optionIndex: index, home });

    return this.track(piece);
  }

  createShape(x, y, value, baseSize) {
    const r = baseSize * 0.06;
    let shape;

    if (this.levelData.type === "rotation") {
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

  drawConfirmButton(width, height, baseSize) {
    const btnWidth = Math.min(250, width * 0.7);
    const btnHeight = baseSize * 0.12;
    const btnX = width / 2;
    const btnY = height * 0.88;

    const btnBg = this.track(
      this.add
        .rectangle(btnX, btnY, btnWidth, btnHeight, 0x48bb78)
        .setInteractive({ useHandCursor: true })
        .setStrokeStyle(2, 0x2f855a),
    );

    const btnText = this.track(
      this.add
        .text(btnX, btnY, t("global.buttons.confirm"), {
          fontSize: `${Math.min(24, baseSize * 0.05)}px`,
          fill: "#ffffff",
          fontStyle: "bold",
        })
        .setOrigin(0.5),
    );

    const release = () => {
      btnBg.setFillStyle(0x48bb78);
      btnText.setY(btnY);
    };

    btnBg.on("pointerdown", () => {
      btnBg.setFillStyle(0x38a169);
      btnText.setY(btnY + 2);
      this.checkAnswer();
    });
    btnBg.on("pointerup", release);
    btnBg.on("pointerout", release);
  }

  // --- DRAG & DROP -------------------------------------------------------

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

    piece.setDepth(DEPTH_DRAGGING);
    piece.setScale(DRAG_SCALE);
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

    if (this.isPieceOverSlot(piece)) {
      this.dropIntoSlot(piece);
    } else {
      this.sendHome(piece);
    }
  }

  dropIntoSlot(piece) {
    const displacedIndex = this.slot.place(piece.getData("optionIndex"));

    if (displacedIndex !== NO_ANSWER) {
      this.sendHome(this.options[displacedIndex]);
    }

    this.moveTo(piece, this.slotInfo.x, this.slotInfo.y);
    this.updateSlotVisuals();
    AudioManager.play("connect");
  }

  sendHome(piece) {
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
      isHot ? 3 : 2,
      isHot ? COLORS.OPTION_BORDER_ACTIVE : COLORS.SLOT_BORDER,
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
    }
  }
}
