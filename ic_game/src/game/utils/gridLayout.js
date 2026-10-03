/**
 * Helpers de layout em grade (sem Phaser), reutilizáveis por qualquer mini-jogo.
 */

/**
 * Número de colunas para `count` itens com no máximo `maxPerRow` por linha,
 * distribuindo de forma equilibrada (8 itens, máx. 5 => 2 linhas de 4).
 */
export function computeColumns(count, maxPerRow = 5) {
  if (count <= 0) return 0;
  const rows = Math.ceil(count / maxPerRow);
  return Math.ceil(count / rows);
}

/** Largura de cada célula, com meia célula de margem em cada lado. */
export function getCellWidth(width, columns) {
  return columns > 0 ? width / (columns + 1) : width;
}

/**
 * Posições (centro) dos itens. A última linha, se incompleta, fica centralizada.
 * @returns {{x:number, y:number, row:number, col:number}[]}
 */
export function computeGridPositions({
  count,
  columns,
  width,
  startY,
  rowGap,
}) {
  if (count <= 0 || columns <= 0) return [];

  const cellWidth = getCellWidth(width, columns);
  const positions = [];

  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / columns);
    const col = i % columns;
    const itemsInRow = Math.min(columns, count - row * columns);
    const x = width / 2 + (col - (itemsInRow - 1) / 2) * cellWidth;
    positions.push({ x, y: startY + row * rowGap, row, col });
  }

  return positions;
}
