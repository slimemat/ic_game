import test from "node:test";
import assert from "node:assert/strict";
import {
  AnswerSlot,
  AnswerStatus,
  NO_ANSWER,
  evaluateAnswer,
  isOverSlot,
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
