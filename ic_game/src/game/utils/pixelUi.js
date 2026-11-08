/**
 * Elementos visuais compartilhados entre os mini-jogos (estilo "escritório / post-it").
 * Extraídos do PatternRecognitionScene para evitar duplicação (DRY).
 * Nenhuma função aqui guarda estado: elas criam objetos e devolvem as referências
 * para que a Scene decida como rastrear/destruir.
 */

/** Paletas de post-it reaproveitáveis. */
export const POST_IT = {
  yellow: { bg: 0xfef9c3, tape: 0xfde047, border: 0xeab308 },
  white: { bg: 0xf8fafc, tape: 0xe2e8f0, border: 0xcbd5e1 },
};

/**
 * Barra de progresso no topo da tela (mesmo visual do Pattern Recognition).
 * @param {Phaser.Scene} scene
 * @param {{width:number,height:number,baseSize:number,progress:number,label:string}} opts
 * @returns {Phaser.GameObjects.GameObject[]} objetos criados (para rastreio)
 */
export function drawProgressBar(
  scene,
  { width, height, baseSize, progress, label },
) {
  const barWidth = Math.min(width * 0.78, 320);
  const barHeight = Math.max(8, baseSize * 0.022);
  const x = (width - barWidth) / 2;
  const y = height * 0.04;
  const radius = barHeight / 2;

  const track = scene.add.graphics();
  track.fillStyle(0x0f172a, 0.55);
  track.lineStyle(1.5, 0x334155, 0.75);
  track.fillRoundedRect(x, y, barWidth, barHeight, radius);
  track.strokeRoundedRect(x, y, barWidth, barHeight, radius);

  const fillWidth = Math.max(radius * 2, barWidth * Math.min(1, progress));
  const fill = scene.add.graphics();
  fill.fillStyle(0x38bdf8, 0.95);
  fill.fillRoundedRect(x, y, fillWidth, barHeight, radius);

  const text = scene.add
    .text(width / 2, y + barHeight + 6, label, {
      fontSize: `${Math.max(10, baseSize * 0.026)}px`,
      color: "#cbd5e1",
      stroke: "#0f172a",
      strokeThickness: 2,
      fontStyle: "bold",
    })
    .setOrigin(0.5, 0);

  return [track, fill, text];
}

/**
 * Post-it quadrado (sombra + papel + fita) dentro de um Container.
 * O Container fica centrado em (x, y).
 * @param {Phaser.Scene} scene
 * @param {number} x
 * @param {number} y
 * @param {number} size
 * @param {{bg:number,tape:number,border:number}} palette
 */
export function createPostIt(scene, x, y, size, palette = POST_IT.white) {
  const stripH = size * 0.18;
  const shadow = scene.add.rectangle(2, 3, size, size, 0x000000, 0.28);
  const bg = scene.add
    .rectangle(0, 0, size, size, palette.bg)
    .setStrokeStyle(1.5, palette.border, 0.6);
  const tape = scene.add.rectangle(
    0,
    -size / 2 + stripH / 2,
    size,
    stripH,
    palette.tape,
    0.85,
  );
  const container = scene.add.container(x, y, [shadow, bg, tape]);
  container.setSize(size, size);

  return { container, shadow, bg, tape, stripH };
}

/**
 * Carimbo "APROVADO" que bate rápido sobre a tarefa.
 * @param {Phaser.Scene} scene
 * @param {number} x
 * @param {number} y
 * @param {string} label Texto já traduzido (ex.: "★ APROVADO ★").
 * @returns {Phaser.GameObjects.Container}
 */
export function showApprovedStamp(scene, x, y, label) {
  const container = scene.add.container(x, y);
  container.setDepth(25);
  container.setAngle(-8);

  const w = 204;
  const h = 56;

  const border = scene.add.graphics();
  border.lineStyle(3.5, 0x10b981, 0.95);
  border.strokeRoundedRect(-w / 2, -h / 2, w, h, 8);

  const inner = scene.add.graphics();
  inner.lineStyle(1.5, 0x10b981, 0.7);
  inner.strokeRoundedRect(-w / 2 + 5, -h / 2 + 5, w - 10, h - 10, 5);

  const text = scene.add
    .text(0, 0, label, {
      fontSize: "20px",
      fontStyle: "bold",
      color: "#10b981",
      stroke: "#064e3b",
      strokeThickness: 1,
    })
    .setOrigin(0.5);

  container.add([border, inner, text]);
  container.setScale(2.5);
  container.setAlpha(0);

  scene.tweens.add({
    targets: container,
    scale: 1,
    alpha: 1,
    duration: 140,
    ease: "Back.easeOut",
    easeParams: [1.7],
    onComplete: () => scene.cameras.main.shake(70, 0.0035),
  });

  return container;
}
