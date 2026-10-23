import { test } from "node:test";
import assert from "node:assert/strict";
import { buildRanking } from "./ranking.js";

const seed = [
  { id: "a", name: "A", xp: 100 },
  { id: "b", name: "B", xp: 300 },
];

test("buildRanking: ordena por XP e marca o jogador atual", () => {
  const result = buildRanking(seed, { id: "me", name: "Eu", xp: 200 });
  assert.deepEqual(
    result.map((p) => p.id),
    ["b", "me", "a"],
  );
  assert.equal(result.find((p) => p.isMe).position, 2);
});

test("buildRanking: em empate, o jogador atual fica na frente", () => {
  const result = buildRanking(seed, { id: "me", name: "Eu", xp: 300 });
  assert.equal(result[0].id, "me");
});

test("buildRanking: não altera a lista original", () => {
  buildRanking(seed, { id: "me", name: "Eu", xp: 0 });
  assert.equal(seed.length, 2);
});

test("buildRanking: com lista vazia devolve só o jogador atual na posição 1", () => {
  const result = buildRanking([], { id: "me", name: "Eu", xp: 0 });
  assert.equal(result.length, 1);
  assert.equal(result[0].position, 1);
  assert.equal(result[0].isMe, true);
});
