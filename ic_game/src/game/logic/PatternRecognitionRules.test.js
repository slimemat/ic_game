import test from "node:test";
import assert from "node:assert/strict";
import {
  AnswerSlot,
  AnswerStatus,
  NO_ANSWER,
  evaluateAnswer,
  isOverSlot,
  shuffleLevelOptions,
} from "./PatternRecognitionRules.js";
import {
  computeColumns,
  computeGridPositions,
  getCellWidth,
} from "../utils/gridLayout.js";

test("computeColumns: uma linha até 5 opções, duas linhas equilibradas acima disso", () => {
  assert.equal(computeColumns(0), 0);
  assert.equal(computeColumns(4), 4);
  assert.equal(computeColumns(5), 5);
  assert.equal(computeColumns(8), 4); // grade 4x2
  assert.equal(computeColumns(6), 3);
});

test("computeGridPositions: 8 opções formam 2 linhas de 4, simétricas", () => {
  const width = 800;
  const pos = computeGridPositions({
    count: 8,
    columns: 4,
    width,
    startY: 100,
    rowGap: 50,
  });
  assert.equal(pos.length, 8);
  assert.equal(pos[0].y, 100);
  assert.equal(pos[4].y, 150);
  assert.equal(pos[0].x, getCellWidth(width, 4));
  assert.equal(pos[0].x + pos[3].x, width); // simetria
});

test("computeGridPositions: uma linha igual ao espaçamento width/(n+1) original", () => {
  const pos = computeGridPositions({
    count: 5,
    columns: 5,
    width: 600,
    startY: 0,
    rowGap: 0,
  });
  pos.forEach((p, i) => assert.ok(Math.abs(p.x - (600 / 6) * (i + 1)) < 1e-9));
});

test("computeGridPositions: última linha incompleta é centralizada", () => {
  const pos = computeGridPositions({
    count: 5,
    columns: 3,
    width: 400,
    startY: 0,
    rowGap: 10,
  });
  assert.equal((pos[3].x + pos[4].x) / 2, 200);
});

test("AnswerSlot: place, deslocamento, release e clear", () => {
  const slot = new AnswerSlot();
  assert.ok(slot.isEmpty);
  assert.equal(slot.place(2), NO_ANSWER);
  assert.equal(slot.place(3), 2); // 2 foi deslocada
  assert.equal(slot.place(3), NO_ANSWER); // mesma peça de novo
  slot.release(2); // não é a ocupante: ignora
  assert.equal(slot.occupant, 3);
  slot.release(3);
  assert.ok(slot.isEmpty);
  slot.place(1);
  slot.clear();
  assert.ok(slot.isEmpty);
});

test("evaluateAnswer", () => {
  assert.equal(evaluateAnswer(NO_ANSWER, 3), AnswerStatus.EMPTY);
  assert.equal(evaluateAnswer(3, 3), AnswerStatus.CORRECT);
  assert.equal(evaluateAnswer(1, 3), AnswerStatus.INCORRECT);
  assert.equal(evaluateAnswer(0, 0), AnswerStatus.CORRECT); // índice 0 é válido
});

test("isOverSlot", () => {
  assert.ok(isOverSlot(100, 100, 100, 100, 80));
  assert.ok(isOverSlot(140, 100, 100, 100, 80)); // dentro da tolerância
  assert.ok(!isOverSlot(200, 100, 100, 100, 80));
});

test("shuffleLevelOptions: preserva todas as opções e atualiza correctOptionIndex", () => {
  const original = {
    difficulty: 1,
    type: "rotation",
    shape: "triangle",
    sequence: [0, 90, 180],
    answerOptions: [0, 90, 180, 270],
    correctOptionIndex: 3, // 270
  };

  const shuffled = shuffleLevelOptions(original);

  // Não muta o original
  assert.notEqual(shuffled, original);
  assert.equal(shuffled.answerOptions.length, 4);

  // O valor correto permanece 270 no novo índice
  assert.equal(shuffled.answerOptions[shuffled.correctOptionIndex], 270);

  // Todas as opções originais ainda estão presentes
  assert.deepEqual(
    [...shuffled.answerOptions].sort((a, b) => a - b),
    [0, 90, 180, 270],
  );

  // A validação de acerto continua funcionando
  assert.equal(
    evaluateAnswer(shuffled.correctOptionIndex, shuffled.correctOptionIndex),
    AnswerStatus.CORRECT,
  );
});

test("shuffleLevelOptions: determinístico com mock RNG", () => {
  const config = {
    answerOptions: [10, 20, 30],
    correctOptionIndex: 1, // 20
  };

  // Mock RNG que inverte posições
  let counter = 0;
  const mockRng = () => {
    counter++;
    return 0; // sempre troca com o primeiro
  };

  const result = shuffleLevelOptions(config, mockRng);
  assert.equal(result.answerOptions[result.correctOptionIndex], 20);
});

test("shuffleLevelOptions: embaralha objetos de transformação preservando propriedades e resposta correta", () => {
  const transformConfig = {
    type: "transformation",
    shape: "split_square",
    baseShape: { angle: 0, flipX: false, flipY: false },
    answerOptions: [
      { angle: 0, flipX: false, flipY: false },
      { angle: 90, flipX: false, flipY: false }, // Correta
      { angle: 180, flipX: false, flipY: false },
      { angle: 270, flipX: false, flipY: false },
    ],
    correctOptionIndex: 1,
  };

  const shuffled = shuffleLevelOptions(transformConfig);
  assert.notEqual(shuffled, transformConfig);
  assert.equal(shuffled.answerOptions.length, 4);

  const correctItem = shuffled.answerOptions[shuffled.correctOptionIndex];
  assert.equal(correctItem.angle, 90);
  assert.equal(correctItem.flipX, false);

  assert.equal(
    evaluateAnswer(shuffled.correctOptionIndex, shuffled.correctOptionIndex),
    AnswerStatus.CORRECT,
  );
});
