import Phaser from "phaser";
import i18n from "../../i18n";
import { LEVELS, COLORS, toGrid } from "../data/MatrixMirrorLevels";
import AudioManager from "../managers/AudioManager";
import {
  createPostIt,
  drawProgressBar,
  showApprovedStamp,
} from "../utils/pixelUi";

import connectAudio from "../../assets/audio/connect.mp3";
import errorAudio from "../../assets/audio/error.mp3";
import winAudio from "../../assets/audio/success_guitar.mp3";
import stampAudio from "../../assets/audio/stamp.mp3";
import scene1Clean from "../../assets/images/scene1_clean.png";

const t = i18n.global.t;

/**
 * true  -> o jogador precisa tocar em "Confirmar" (erros são contabilizados).
 * false -> vence automaticamente ao completar a matriz (comportamento antigo).
 */
const REQUIRE_CONFIRM = true;

const DEPTH_BACKGROUND = -10;
const DEPTH_DIMMER = -9;
const DEPTH_WIN = 10;
const BG_DIM_ALPHA = 0.25;
const SKY_COLOR = "#87ceeb";

const BUTTON_CLEAR = {
  fill: 0x475569,
  pressed: 0x334155,
  border: 0x1e293b,
  text: "#f1f5f9",
};
const BUTTON_CONFIRM = {
  fill: 0x94ddbc,
  pressed: 0xa0ecd0,
  border: 0x36535b,
  text: "#101820",
};

/**
 * Cena do Matrix Mirror: o jogador reproduz, espelhada, a matriz original.
 */
export default class MatrixMirrorScene extends Phaser.Scene {
  /**
   * @param {(correct:number,total:number)=>void} onMatchUpdate
   * @param {()=>void} onWin
   * @param {(msg:string,opts:{isMistake:boolean})=>void} [onError]
   */
  constructor(onMatchUpdate, onWin, onError) {
    super("MatrixGameScene");
    this.onMatchUpdate = onMatchUpdate;
    this.onWinCallback = onWin;
    this.onErrorCallback = onError;

    this.levelData = null;
    this.inputGrid = [];
    this.expectedGrid = [];
    this.playerGrid = [];

    this.levelObjects = []; // tudo que é destruído a cada render
    this.uiObjects = []; // subconjunto que some na animação de vitória
    this.interactives = []; // objetos que precisam ser desativados na vitória
    this.labels = []; // textos de coordenadas (somem no "dobrar")
    this.cells = []; // células interativas da matriz do jogador

    this.originalContainer = null;
    this.playerContainer = null;
    this.syncText = null;
    this.mirrorGlint = null;
    this.layout = null;

    this.isAnimating = false;
    this.isShutdown = false;
  }

  // --- LIFECYCLE ---------------------------------------------------------

  preload() {
    this.load.image("scene1_clean", scene1Clean);
    this.load.audio("connect", connectAudio);
    this.load.audio("error", errorAudio);
    this.load.audio("win", winAudio);
    this.load.audio("stamp", stampAudio);
  }

  create() {
    this.isShutdown = false;
    AudioManager.init(this);

    this.scale.on("resize", this.onResize, this);
    this.events.once("shutdown", this.onShutdown, this);

    this.loadLevel({ animateIn: true });
  }

  onShutdown() {
    this.isShutdown = true;
    this.scale.off("resize", this.onResize, this);
    this.destroyLevelObjects();
  }

  /** Redesenha preservando o progresso do jogador (útil em rotação/barra do navegador). */
  onResize(gameSize) {
    if (this.isShutdown || !this.levelData) return;
    this.cameras.main.setViewport(0, 0, gameSize.width, gameSize.height);
    if (this.isAnimating) return;
    this.renderLevel({ animateIn: false });
  }

  // --- ESTADO DO NÍVEL ---------------------------------------------------

  loadLevel({ animateIn = false } = {}) {
    const level = this.registry.get("level") ?? 1;
    this.levelData = LEVELS[(level - 1) % LEVELS.length];

    const { rows, cols } = this.levelData.dimensions;
    this.inputGrid = toGrid(this.levelData.input);
    this.expectedGrid = toGrid(this.levelData.expected);
    this.playerGrid = Array.from({ length: rows }, () =>
      new Array(cols).fill(0),
    );

    this.isAnimating = false;
    this.cameras.main.setBackgroundColor(SKY_COLOR);
    this.renderLevel({ animateIn });
  }

  resetLevel() {
    this.loadLevel({ animateIn: true });
  }

  // --- RASTREIO DE OBJETOS ----------------------------------------------

  track(gameObject) {
    this.levelObjects.push(gameObject);
    return gameObject;
  }

  /** Rastreia um objeto de UI (some quando o jogador vence). */
  trackUi(gameObject) {
    this.uiObjects.push(gameObject);
    return this.track(gameObject);
  }

  destroyLevelObjects() {
    this.tweens.killAll();
    this.time.removeAllEvents();
    this.levelObjects.forEach((obj) => obj.destroy());
    this.levelObjects = [];
    this.uiObjects = [];
    this.interactives = [];
    this.labels = [];
    this.cells = [];
    this.originalContainer = null;
    this.playerContainer = null;
    this.syncText = null;
    this.mirrorGlint = null;
  }

  // --- RENDER ------------------------------------------------------------

  renderLevel({ animateIn = false } = {}) {
    if (this.isShutdown) return;
    this.destroyLevelObjects();

    const { width, height } = this.scale;
    const baseSize = Math.min(width, height);
    const layout = this.computeLayout(width, height, baseSize);
    this.layout = layout;

    this.drawBackground(width, height);
    this.drawProgress(width, height, baseSize);
    this.drawHeader(width, height, baseSize);
    this.drawPanels(layout, animateIn);
    this.drawButtons(width, height, baseSize);

    this.updateSync();
  }

  /**
   * Layout lado a lado (portrait first): [Original] | espelho | [Seu espelho].
   * A largura de cada painel é o que limita o tamanho da célula; a altura sobra.
   * O conjunto (rótulo + painéis + espelho) fica centralizado na área livre.
   */
  computeLayout(width, height, baseSize) {
    const { rows, cols } = this.levelData.dimensions;

    const labelSize = Math.max(11, Math.min(15, baseSize * 0.03));
    const labelH = labelSize * 2 + 10; // reserva 2 linhas para o rótulo
    const pad = Math.max(6, baseSize * 0.02);
    const sideMargin = Math.max(8, width * 0.03);
    const mirrorW = Math.max(18, width * 0.055);
    const mirrorGap = Math.max(6, width * 0.02);

    const panelW = (width - 2 * sideMargin - mirrorW - 2 * mirrorGap) / 2;
    const top = height * 0.235;
    const bottom = height * 0.83;
    const availH = bottom - top - labelH;

    const spacing = Math.max(
      28,
      Math.min((panelW - 2 * pad) / cols, (availH - 2 * pad) / rows, 120),
    );
    const size = spacing * 0.86;
    const panelH = rows * spacing + 2 * pad;
    const blockH = labelH + panelH;

    const blockTop = top + Math.max(0, (bottom - top - blockH) / 2);

    return {
      rows,
      cols,
      spacing,
      size,
      pad,
      labelSize,
      panelW,
      panelH,
      labelY: blockTop + labelH - 4,
      rowY: blockTop + labelH + panelH / 2,
      leftX: sideMargin + panelW / 2,
      rightX: width - sideMargin - panelW / 2,
      mirrorX: width / 2,
      mirrorW,
      mirrorH: panelH + pad * 2,
    };
  }

  drawBackground(width, height) {
    const texture = this.textures.get("scene1_clean");
    texture.setFilter(Phaser.Textures.FilterMode.NEAREST);

    const image = this.track(
      this.add
        .image(width / 2, height / 2, "scene1_clean")
        .setDepth(DEPTH_BACKGROUND),
    );
    image.setScale(Math.max(width / image.width, height / image.height));

    this.track(
      this.add
        .rectangle(width / 2, height / 2, width, height, 0x000000, BG_DIM_ALPHA)
        .setDepth(DEPTH_DIMMER),
    );
  }

  drawProgress(width, height, baseSize) {
    const level = this.registry.get("level") ?? 1;
    const total = LEVELS.length;
    const stage = ((level - 1) % total) + 1;

    drawProgressBar(this, {
      width,
      height,
      baseSize,
      progress: stage / total,
      label: t("matrix.progress", { num: stage, total }),
    }).forEach((obj) => this.track(obj));
  }

  drawHeader(width, height, baseSize) {
    const key = this.levelData.i18nKey;

    // Título da fase
    this.trackUi(
      this.add
        .text(width / 2, height * 0.1, t(`${key}.title`).toUpperCase(), {
          fontSize: `${Math.max(11, Math.min(14, baseSize * 0.028))}px`,
          color: "#38bdf8",
          stroke: "#0f172a",
          strokeThickness: 2,
          align: "center",
          fontStyle: "bold",
          wordWrap: { width: width * 0.9 },
        })
        .setOrigin(0.5),
    );

    // Instrução da fase
    this.trackUi(
      this.add
        .text(width / 2, height * 0.145, t(`${key}.description`), {
          fontSize: `${Math.max(13, Math.min(18, width * 0.042))}px`,
          color: "#f8fafc",
          stroke: "#0f172a",
          strokeThickness: 3,
          align: "center",
          fontStyle: "bold",
          wordWrap: { width: width * 0.9 },
        })
        .setOrigin(0.5),
    );

    // Contador de sincronização (atualizado em updateSync)
    this.syncText = this.trackUi(
      this.add
        .text(width / 2, height * 0.195, "", {
          fontSize: `${Math.max(12, Math.min(17, baseSize * 0.034))}px`,
          color: "#cbd5e1",
          stroke: "#0f172a",
          strokeThickness: 2,
          fontStyle: "bold",
        })
        .setOrigin(0.5),
    );
  }

  drawPanels(layout, animateIn) {
    const labelStyle = {
      fontSize: `${layout.labelSize}px`,
      color: "#e2e8f0",
      stroke: "#0f172a",
      strokeThickness: 2,
      fontStyle: "bold",
      align: "center",
      wordWrap: { width: layout.panelW },
    };

    [
      [layout.leftX, "canvas.matrix.original"],
      [layout.rightX, "canvas.matrix.mirror"],
    ].forEach(([x, key]) =>
      this.trackUi(
        this.add.text(x, layout.labelY, t(key), labelStyle).setOrigin(0.5, 1),
      ),
    );

    this.originalContainer = this.track(
      this.add.container(layout.leftX, layout.rowY),
    );
    this.playerContainer = this.track(
      this.add.container(layout.rightX, layout.rowY),
    );

    this.drawMirror(layout);

    this.drawMatrix(
      this.originalContainer,
      this.inputGrid,
      layout,
      COLORS.ORIGINAL,
      false,
      animateIn,
    );
    this.drawMatrix(
      this.playerContainer,
      this.playerGrid,
      layout,
      COLORS.PLAYER,
      true,
      animateIn,
    );
  }

  /** Espelho vertical entre as duas matrizes (moldura de vidro + reflexos). */
  drawMirror(layout) {
    const { mirrorX, rowY, mirrorW: w, mirrorH: h } = layout;

    const frame = this.add.graphics();
    frame.fillStyle(0xe0f2fe, 0.28);
    frame.fillRoundedRect(-w / 2, -h / 2, w, h, 5);
    frame.lineStyle(3, 0xffffff, 0.85);
    frame.strokeRoundedRect(-w / 2, -h / 2, w, h, 5);
    frame.lineStyle(1.5, 0x7dd3fc, 0.9);
    frame.strokeRoundedRect(-w / 2 + 3, -h / 2 + 3, w - 6, h - 6, 3);

    // Reflexos diagonais do vidro
    frame.lineStyle(Math.max(2, w * 0.14), 0xffffff, 0.35);
    frame.lineBetween(-w / 2 + 4, -h * 0.22 + w * 0.9, w / 2 - 4, -h * 0.22);
    frame.lineBetween(-w / 2 + 4, -h * 0.1 + w * 0.9, w / 2 - 4, -h * 0.1);

    // Brilho que pisca quando o jogador toca numa célula
    const glint = this.add
      .rectangle(0, 0, w - 6, h - 6, 0xffffff, 1)
      .setAlpha(0);
    this.mirrorGlint = glint;

    this.trackUi(this.add.container(mirrorX, rowY, [frame, glint]));
  }

  /**
   * Cada célula = slot "afundado" (sempre visível) + post-it (aparece quando ligada)
   * + coordenada + área de toque do tamanho total do espaçamento (sem "zonas mortas").
   */
  drawMatrix(container, grid, layout, palette, isInteractive, animateIn) {
    const { rows, cols, spacing, size, pad } = layout;
    const startX = -(cols * spacing) / 2 + spacing / 2;
    const startY = -(rows * spacing) / 2 + spacing / 2;

    // Painel translúcido: dá contraste sobre o cenário
    const panel = this.add
      .rectangle(
        0,
        0,
        cols * spacing + pad * 2,
        rows * spacing + pad * 2,
        COLORS.PANEL,
        COLORS.PANEL_ALPHA,
      )
      .setStrokeStyle(2, 0xffffff, 0.18);
    container.add(panel);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = startX + c * spacing;
        const y = startY + r * spacing;

        const slot = this.add
          .rectangle(x, y, size, size, 0x000000, COLORS.SLOT_ALPHA)
          .setStrokeStyle(1.5, 0xffffff, 0.25);

        const piece = createPostIt(this, x, y, size, palette);

        const label = this.add
          .text(x, y + piece.stripH * 0.2, `${r + 1},${c + 1}`, {
            fontSize: `${Math.max(10, size * 0.26)}px`,
            fontStyle: "bold",
            color: COLORS.TEXT_OFF,
          })
          .setOrigin(0.5);

        container.add([slot, piece.container, label]);
        this.labels.push(label);

        const cell = { r, c, slot, piece, label, isOn: false };
        this.setCellOn(cell, grid[r][c] === 1, {
          animate: animateIn,
          delay: (r * cols + c) * 45,
        });

        if (isInteractive) {
          const hit = this.add
            .rectangle(x, y, spacing, spacing, 0x000000, 0.001)
            .setInteractive({ useHandCursor: true });
          hit.on("pointerdown", () => this.handleCellTap(cell));
          container.add(hit);
          this.interactives.push(hit);
          this.cells.push(cell);
        }
      }
    }
  }

  /** Liga/desliga o post-it de uma célula, com animação opcional. */
  setCellOn(cell, isOn, { animate = true, delay = 0 } = {}) {
    const wasOn = cell.isOn;
    const node = cell.piece.container;
    cell.isOn = isOn;

    this.tweens.killTweensOf(node);
    cell.label.setColor(isOn ? COLORS.TEXT_ON : COLORS.TEXT_OFF);

    if (isOn) {
      node.setVisible(true);
      if (!animate) {
        node.setScale(1);
        return;
      }
      node.setScale(0);
      this.tweens.add({
        targets: node,
        scale: 1,
        duration: 200,
        delay,
        ease: "Back.easeOut",
      });
      return;
    }

    if (!animate || !wasOn) {
      node.setVisible(false).setScale(0);
      return;
    }
    this.tweens.add({
      targets: node,
      scale: 0,
      duration: 110,
      ease: "Quad.easeIn",
      onComplete: () => node.setVisible(false),
    });
  }

  drawButtons(width, height, baseSize) {
    const rowW = Math.min(width * 0.92, 440);
    const gap = 10;
    const btnH = Math.max(48, Math.min(64, baseSize * 0.13));
    const y = height * 0.9;
    const fontSize = Math.max(14, Math.min(22, baseSize * 0.05));

    const left = width / 2 - rowW / 2;
    const clearW = rowW * 0.34;
    const confirmW = rowW - clearW - gap;

    this.createButton({
      x: left + clearW / 2,
      y,
      w: clearW,
      h: btnH,
      fontSize: fontSize * 0.9,
      label: t("matrix.clear_matrix"),
      colors: BUTTON_CLEAR,
      onPress: () => this.clearPlayer(),
    });

    this.createButton({
      x: left + clearW + gap + confirmW / 2,
      y,
      w: confirmW,
      h: btnH,
      fontSize,
      label: t("global.buttons.confirm"),
      colors: BUTTON_CONFIRM,
      onPress: () => this.checkAnswer(),
    });
  }

  createButton({ x, y, w, h, fontSize, label, colors, onPress }) {
    const shadow = this.add.rectangle(x + 2, y + 3, w, h, 0x000000, 0.3);
    const bg = this.add
      .rectangle(x, y, w, h, colors.fill)
      .setStrokeStyle(2, colors.border)
      .setInteractive({ useHandCursor: true });
    const text = this.add
      .text(x, y, label, {
        fontSize: `${fontSize}px`,
        color: colors.text,
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const release = () => {
      bg.setFillStyle(colors.fill);
      text.setY(y);
    };

    bg.on("pointerdown", () => {
      bg.setFillStyle(colors.pressed);
      text.setY(y + 2);
    });
    bg.on("pointerup", () => {
      release();
      onPress();
    });
    bg.on("pointerout", release);

    [shadow, bg, text].forEach((obj) => this.trackUi(obj));
    this.interactives.push(bg);
  }

  // --- INTERAÇÃO ---------------------------------------------------------

  handleCellTap(cell) {
    if (this.isAnimating) return;

    const { r, c } = cell;
    const next = this.playerGrid[r][c] === 1 ? 0 : 1;
    this.playerGrid[r][c] = next;

    AudioManager.play("connect", { volume: 0.6 });
    this.setCellOn(cell, next === 1);

    // "Aperto" tátil no slot
    this.tweens.add({
      targets: cell.slot,
      scale: 0.9,
      duration: 60,
      yoyo: true,
    });

    this.flashMirror();
    this.updateSync();

    if (!REQUIRE_CONFIRM) {
      const { correct, total } = this.countMatches();
      if (correct === total) this.playWinAnimation();
    }
  }

  clearPlayer() {
    if (this.isAnimating) return;
    AudioManager.play("connect");

    this.playerGrid.forEach((row) => row.fill(0));
    this.cells.forEach((cell) => this.setCellOn(cell, false));
    this.updateSync();
  }

  // --- RESULTADO ---------------------------------------------------------

  countMatches() {
    const { rows, cols } = this.levelData.dimensions;
    let correct = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (this.playerGrid[r][c] === this.expectedGrid[r][c]) correct++;
      }
    }
    return { correct, total: rows * cols };
  }

  updateSync() {
    const { correct, total } = this.countMatches();

    if (this.syncText?.active) {
      this.syncText
        .setText(t("matrix.sync", { correct, total }))
        .setColor(correct === total ? "#4ade80" : "#cbd5e1");
    }
    this.onMatchUpdate?.(correct, total);
  }

  checkAnswer() {
    if (this.isAnimating) return;

    const { correct, total } = this.countMatches();
    if (correct === total) {
      this.playWinAnimation();
      return;
    }

    AudioManager.play("error");
    this.cameras.main.shake(200, 0.015);
    this.onErrorCallback?.(t("matrix.err_incomplete"), { isMistake: true });
  }

  /** Pisca o espelho: reforça a ideia de "reflexo" a cada toque. */
  flashMirror() {
    if (!this.mirrorGlint?.active) return;
    this.tweens.killTweensOf(this.mirrorGlint);
    this.mirrorGlint.setAlpha(0);
    this.tweens.add({
      targets: this.mirrorGlint,
      alpha: 0.5,
      duration: 110,
      yoyo: true,
    });
  }

  pulse(target, scaleX) {
    this.tweens.add({
      targets: target,
      scaleX,
      scaleY: 1.08,
      duration: 260,
      yoyo: true,
      ease: "Sine.easeInOut",
    });
  }

  /** O espelho some, os painéis deslizam até o centro e se sobrepõem; depois, o carimbo. */
  playWinAnimation() {
    this.isAnimating = true;
    AudioManager.play("win");

    this.interactives.forEach((obj) => obj.disableInteractive());

    // uiObjects inclui o espelho, os textos e os botões
    this.tweens.add({
      targets: [...this.uiObjects, ...this.labels],
      alpha: 0,
      duration: 250,
    });

    const { rowY, mirrorX } = this.layout;

    this.playerContainer.setAlpha(0.75).setDepth(DEPTH_WIN);

    this.tweens.add({
      targets: this.originalContainer,
      x: mirrorX,
      duration: 900,
      ease: "Cubic.easeInOut",
    });

    this.tweens.add({
      targets: this.playerContainer,
      x: mirrorX,
      scaleX: -1,
      duration: 900,
      ease: "Cubic.easeInOut",
      onComplete: () => {
        this.pulse(this.originalContainer, 1.08);
        this.pulse(this.playerContainer, -1.08);

        this.time.delayedCall(300, () => {
          AudioManager.play("stamp", { volume: 0.5 });
          this.track(
            showApprovedStamp(
              this,
              mirrorX,
              rowY,
              `★ ${t("global.modals.victory_tag").toUpperCase()} ★`,
            ),
          );
          this.time.delayedCall(700, () => this.onWinCallback?.());
        });
      },
    });
  }
}
