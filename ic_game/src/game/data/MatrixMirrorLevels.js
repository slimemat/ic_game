export const COLORS = {
  BG: "#1a202c",
  OFF: "#2d3748",
  ON_ORIGINAL: "#4fd1c5", // Ciano
  ON_PLAYER: "#f6e05e", // Amarelo
  BORDER: "#4a5568",
  TEXT_OFF: "#4a5568",
  TEXT_ON_ORIGINAL: "#1a202c",
  TEXT_ON_PLAYER: "#1a202c",
};

export const LEVELS = [
  {
    // Fase 1: 1D Espelhamento
    title: "O Básico (1 Linha)",
    description: "Crie o reflexo amarelo da imagem ciano.",
    input: [1, 0, 0],
    expected: [0, 0, 1],
    dimensions: { rows: 1, cols: 3 },
  },
  {
    // Fase 2: 2x2
    title: "Bloco 2x2",
    description:
      "Espelhe a matriz. No final, elas se dobram para a prova real!",
    input: [
      [1, 0],
      [0, 1],
    ],
    expected: [
      [0, 1],
      [1, 0],
    ],
    dimensions: { rows: 2, cols: 2 },
  },
  {
    // Fase 3: 3x3 Desafio
    title: "A Fechadura 3x3",
    description: "A matriz completa será dobrada como uma página de livro.",
    input: [
      [0, 1, 1],
      [1, 0, 0],
      [0, 1, 1],
    ],
    expected: [
      [1, 1, 0],
      [0, 0, 1],
      [1, 1, 0],
    ],
    dimensions: { rows: 3, cols: 3 },
  },
];
