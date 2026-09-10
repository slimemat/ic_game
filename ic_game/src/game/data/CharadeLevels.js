export const CHARADES_LEVELS = [
  {
    title: "Jogo 1: Quem é o Suspeito? - FASE 1",
    statement:
      "Suspeitos: Ana (Sem óculos), Beto (Com óculos), Caio (Sem óculos).",
    suspects: ["Ana", "Beto", "Caio"],
    clue: "O culpado usa óculos.",
    rule: "",
    answer: "Beto",
    library: [
      { id: "ana", type: "person", color: 0xfca5a5, label: "Ana" },
      { id: "beto", type: "person", color: 0x93c5fd, label: "Beto" },
      { id: "caio", type: "person", color: 0x86efac, label: "Caio" },
      { id: "glasses", type: "accessory", color: 0x334155, label: "Óculos" },
    ],
  },
  {
    title: "Jogo 1: Quem é o Suspeito? - FASE 2",
    statement: "Suspeitos: Ana e Beto.",
    suspects: ["Ana", "Beto"],
    clue: "Ana diz: 'Eu sou a culpada.'\nBeto diz: 'Ana está mentindo.'",
    rule: "Apenas 1 fala a verdade.",
    answer: "Beto",
    library: [
      { id: "ana", type: "person", color: 0xfca5a5, label: "Ana" },
      { id: "beto", type: "person", color: 0x93c5fd, label: "Beto" },
      { id: "truth", type: "logic", color: 0x86efac, label: "Verdade" },
      { id: "lie", type: "logic", color: 0xfca5a5, label: "Mentira" },
      { id: "culprit", type: "logic", color: 0xf87171, label: "Culpado" },
    ],
  },
  {
    title: "Jogo 1: Quem é o Suspeito? - FASE 3",
    statement: "Suspeitos: A, B e C.",
    suspects: ["A", "B", "C"],
    clue: "A diz: 'B é culpado.'\nB diz: 'C é inocente.'\nC diz: 'A declaração de B é falsa.'",
    rule: "Exatamente um deles mentiu.",
    answer: "C",
    library: [
      { id: "personA", type: "person", color: 0xfca5a5, label: "Pessoa A" },
      { id: "personB", type: "person", color: 0x93c5fd, label: "Pessoa B" },
      { id: "personC", type: "person", color: 0x86efac, label: "Pessoa C" },
      { id: "truth", type: "logic", color: 0x86efac, label: "Verdade" },
      { id: "lie", type: "logic", color: 0xfca5a5, label: "Mentira" },
      { id: "culprit", type: "logic", color: 0xf87171, label: "Culpado" },
      { id: "innocent", type: "logic", color: 0x93c5fd, label: "Inocente" },
    ],
  },
];
